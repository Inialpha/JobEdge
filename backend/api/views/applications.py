from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.core.validators import URLValidator
from django.core.exceptions import ValidationError
from django.db import transaction
from ..models import Application, Resume, ResumeEvaluation, User
from ..serializers.application import ApplicationSerializer
from ..serializers.resume import ResumeSerializer
from ai_services.application_generation import DocumentsUnavailable, generate_application_documents
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from ..utils.normalize_resume_payload import normalize_resume_payload

class ApplicationAPIView(APIView):
    """
    API View for managing job applications.
    """
    
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        """
        Retrieve a single application by ID or list all applications for the user.
        """
        user = request.user
        
        if pk:
            # Fetch a single application
            application = get_object_or_404(Application, pk=pk)
            if user.is_staff or application.user == user:
                serializer = ApplicationSerializer(application)
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                return Response({
                    "details": "Permission denied"
                }, status=status.HTTP_403_FORBIDDEN)
        else:
            # List all applications for the user (or all if admin)
            if user.is_staff:
                applications = Application.objects.all().order_by('-created_at')
            else:
                applications = Application.objects.filter(user=user).order_by('-created_at')
            serializer = ApplicationSerializer(applications, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """
        Create a new application by generating a resume and cover letter from job description.
        """
        job_description = request.data.get("job_description")
        job_link = request.data.get("job_link", "")
        user = request.user
        
        if not job_description:
            return Response({
                "details": "Job description is required"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            master_resume = Resume.objects.get(user=user, is_master=True)
        except Resume.DoesNotExist:
            return Response({
                "details": "No master resume found. Please create a master resume first."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get master resume data
        master_resume_serializer = ResumeSerializer(master_resume)
        master_data = master_resume_serializer.data
        master_data.pop("id", None)
        master_data.pop("user", None)
        master_data.pop("text", None)
        
        # The resume AND the cover letter are written, evaluated and revised by the agent.
        try:
            documents = generate_application_documents(job_description, master_data)
        except DocumentsUnavailable as exc:
            # failed_stage / reason / trace_id say where it broke; the trace id finds the lines in logs/app.log
            return Response({
                "details": "Our service is currently handling a high volume of requests. Please try again shortly.",
                **exc.to_dict(),
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)

        tailored_resume_data = dict(documents.resume)
        tailored_resume_data["is_master"] = False
        normalized_resume = normalize_resume_payload(tailored_resume_data)

        if not normalized_resume.get("summary") and normalized_resume.get("professionalSummary"):
            normalized_resume["summary"] = normalized_resume.get("professionalSummary")
        resume_serializer = ResumeSerializer(data=normalized_resume)
        if not resume_serializer.is_valid():
            return Response({
                "details": "Failed to create resume",
                "errors": resume_serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        application_data = {
            "user": user.id,
            "job_description": job_description,
            "cover_letter": documents.cover_letter,
            "job_link": job_link if job_link else None
        }
        # Save the resume and the application together: nothing is left behind if either fails.
        with transaction.atomic():
            resume_serializer.save(user=user)
            created_resume = resume_serializer.instance
            application_serializer = ApplicationSerializer(data={**application_data, "resume": created_resume.id})
            if not application_serializer.is_valid():
                transaction.set_rollback(True)
                return Response({
                    "details": "Failed to create application",
                    "errors": application_serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            application_serializer.save()
            application = application_serializer.instance

        # Keep both evaluations (linked to the application) so prompts, models and workflows can be compared.
        evaluation = documents.evaluation_summary()
        for kind, outcome in (("resume", documents.resume_outcome), ("cover_letter", documents.letter_outcome)):
            if outcome.report:
                record = ResumeEvaluation.record(user, job_description, outcome.report, document_type=kind, application=application)
                if record and evaluation.get(kind):
                    evaluation[kind] = {**evaluation[kind], "id": str(record.id)}

        payload = dict(application_serializer.data)
        payload["evaluation"] = evaluation
        return Response(payload, status=status.HTTP_201_CREATED)

    def put(self, request, pk):
        """
        Update an existing application (mainly for updating cover letter).
        """
        application = get_object_or_404(Application, pk=pk)
        user = request.user
        
        # Check permissions
        if not (user.is_staff or application.user == user):
            return Response({
                "details": "Permission denied"
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Allow partial updates
        serializer = ApplicationSerializer(application, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        """
        Delete an application.
        """
        application = get_object_or_404(Application, pk=pk)
        user = request.user
        
        # Check permissions
        if not (user.is_staff or application.user == user):
            return Response({
                "details": "Permission denied"
            }, status=status.HTTP_403_FORBIDDEN)
        
        application.delete()
        return Response({
            "message": "Application deleted successfully"
        }, status=status.HTTP_204_NO_CONTENT)
