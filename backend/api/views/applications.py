from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.core.validators import URLValidator
from django.core.exceptions import ValidationError
from ..models import Application, Resume, User
from ..serializers.application import ApplicationSerializer
from ..serializers.resume import ResumeSerializer
from ai_services.resume_extractor import generate_resume
from ai_services.cover_letters import generate_cover_letter
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated


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
        user_id = request.user.id
        
        if not job_description:
            return Response({
                "details": "Job description is required"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(id=user_id)
            master_resume = Resume.objects.get(user=user, is_master=True)
        except User.DoesNotExist:
            return Response({
                "details": "User not found"
            }, status=status.HTTP_400_BAD_REQUEST)
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
        
        # Generate tailored resume using AI
        tailored_resume_data = generate_resume(job_description, master_data)
        
        if not tailored_resume_data:
            return Response({
                "details": "Failed to generate resume"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        tailored_resume_data["user"] = user_id
        tailored_resume_data["is_master"] = False
        
        # Validate URL fields
        url_fields = ["linkedin", "website"]
        url_validator = URLValidator()
        for url_field in url_fields:
            try:
                url_validator(tailored_resume_data.get(url_field, ""))
            except ValidationError:
                tailored_resume_data[url_field] = None
        
        # Handle summary field
        if not tailored_resume_data.get("summary") and tailored_resume_data.get("professionalSummary"):
            tailored_resume_data["summary"] = tailored_resume_data.get("professionalSummary")
        
        # Create the tailored resume
        resume_serializer = ResumeSerializer(data=tailored_resume_data)
        if not resume_serializer.is_valid():
            print("Resume serializer errors:", resume_serializer.errors)
            return Response({
                "details": "Failed to create resume",
                "errors": resume_serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        resume_serializer.save()
        created_resume = resume_serializer.instance
        
        # Generate cover letter using the tailored resume and job description
        cover_letter_text = generate_cover_letter(tailored_resume_data, job_description)
        
        if not cover_letter_text:
            # If cover letter generation fails, still create application with a default message
            cover_letter_text = "Cover letter generation failed. Please write your own cover letter."
        
        # Validate job_link if provided
        if job_link:
            try:
                url_validator(job_link)
            except ValidationError:
                job_link = None
        
        # Create the application
        application_data = {
            "user": user_id,
            "job_description": job_description,
            "resume": created_resume.id,
            "cover_letter": cover_letter_text,
            "job_link": job_link if job_link else None
        }
        
        application_serializer = ApplicationSerializer(data=application_data)
        if application_serializer.is_valid():
            application_serializer.save()
            return Response(application_serializer.data, status=status.HTTP_201_CREATED)
        else:
            print("Application serializer errors:", application_serializer.errors)
            return Response({
                "details": "Failed to create application",
                "errors": application_serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

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
