from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.core.validators import URLValidator, validate_email
from django.core.exceptions import ValidationError
from ..models import Resume, Job, User
from ..serializers.resume import ResumeSerializer
from file_reader import File, extract_text_safe
from ai_services.resume_extractor import ai, generate_resume
from django.db.models import Q
from ..serializers.job import JobSerializer 
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny

class ResumeAPIView(APIView):
    """
    API View for managing resumes.
    """

    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        """
        Retrieve a single resume by ID or list all resumes.
        """
        user = request.user
        if pk:
            # Fetch a single resume
            resume = get_object_or_404(Resume, pk=pk)
            if user.is_staff or resume.user == user:
                serializer = ResumeSerializer(resume)
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                return Response({
                    "details": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        else:
            if user.is_staff:
                resumes = Resume.objects.all()
            else:
                resumes = Resume.objects.filter(user=user)
            serializer = ResumeSerializer(resumes, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """
        Create a new resume.
        """

        file_name = request.data.get("file")
        user_id = request.user.id
        #user_id = request.data.get("user")
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            print("No user for user's id")
            return Response({"details": "No user for user's id"}, status=status.HTTP_400_BAD_REQUEST)

        text = extract_text_safe(file_name)
        if len(text) < 5:
            return Response({"error": "Failed to process this file. This can happen if the file contains images. Please upload another file or another format"}, status=status.HTTP_400_BAD_REQUEST)

        resume_data = ai(text)
        if resume_data is None:
            return Response({"error": "Our service is currently handling a high volume of requests. Please try again shortly."}, status=status.HTTP_429_TOO_MANY_REQUESTS)
        resume_data["text"] = text
        resume_data['user'] = user_id
        resume_data["is_master"] = True
        
        # validate url fields
        url_fields = ["linkedin", "website"]
        url_validator = URLValidator()
        for url_field in url_fields:
            try:
                url_validator(resume_data.get(url_field, ""))
                resume_data[url_field] = request.data.get(url_field)
            except ValidationError as e:
                resume_data[url_field] = None

        try:
            serializer = ResumeSerializer(data=resume_data)
            if not serializer.is_valid():
                pass
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": "An error occured. Please try again"}, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        """
        Update an existing resume.
        """
        resume = get_object_or_404(Resume, pk=pk)
        resume_data = request.data.copy()
        normalized_resume = normalize_resume_payload(resume_data)
        serializer = ResumeSerializer(resume, data=normalized_resume)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        print(serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        """
        Delete a resume.
        """
        resume = get_object_or_404(Resume, pk=pk)
        user = request.user
        if resume.is_master:
            user.has_master_resume = False
            user.save()
        resume.delete()
        return Response({"message": "Resume deleted successfully"}, status=status.HTTP_204_NO_CONTENT)


class GenerateResume(APIView):
    def get(self, request, resume_id):
        pass

    def post(self, request):
        """ take a user id and a job id, return an ai generated resume base on users master resume """
        job_id = request.data.get("job_id")
        user_id = request.data.get("user_id")
        try:
            user = User.objects.get(id=user_id)
            job = Job.objects.get(id=job_id)
            resume = Resume.objects.get(user=user, is_master=True)
        except (User.DoesNotExist, Resume.DoesNotExist, Job.DoesNotExist):
            return Response({"details": "No user for user's id"}, status=status.HTTP_400_BAD_REQUEST)
        resume_serializer = ResumeSerializer(resume)
        job_serializer = JobSerializer(job)
        tailored_resume = generate_resume(job_serializer.data["job_description"],
                resume_serializer.data["text"])
        if tailored_resume is None:
            return Response({"details": "Our service is currently handling a high volume of requests. Please try again shortly."}, status=status.HTTP_429_TOO_MANY_REQUESTS)
        tailored_resume["user"] = user_id

        url_fields = ["linkedin", "website"]
        url_validator = URLValidator()
        for url_field in url_fields:
            try:
                url_validator(tailored_resume.get(url_field, ""))
                tailored_resume[url_field] = request.data.get(url_field)
            except ValidationError as e:
                tailored_resume[url_field] = None

        new_resume = ResumeSerializer(data=tailored_resume)
        if new_resume.is_valid():
            try:
                return Response(new_resume.data, status=status.HTTP_200_OK)
            except Exception as e:
                print("error", e)
        else:
            print(new_resume.errors)
        return Response(new_resume.errors, status=status.HTTP_400_BAD_REQUEST)


class GenerateResumeFromJobDescription(APIView):
    """
    API View for generating a resume from a job description without needing a job_id.
    """
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Take a user id and a job description, return an ai generated resume based on user's master resume.
        User ID is extracted from the authenticated user.
        """
        job_description = request.data.get("job_description")
        # Use authenticated user only for security
        user_id = request.user.id
        
        if not job_description:
            print("Job description is required")
            return Response({"details": "Job description is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(id=user_id)
            resume = Resume.objects.get(user=user, is_master=True)
        except User.DoesNotExist:
            print("User not found")
            return Response({"details": "User not found"}, status=status.HTTP_400_BAD_REQUEST)
        except Resume.DoesNotExist:
            print("No master resume found for user")
            return Response({"details": "No master resume found for user"}, status=status.HTTP_400_BAD_REQUEST)
        
        resume_serializer = ResumeSerializer(resume)
        data = resume_serializer.data
        data.pop("id", None)
        data.pop("user", None)
        data.pop("text", None)
        
        tailored_resume = generate_resume(job_description, data)
        
        if not tailored_resume:
            return Response({"details": "Our service is currently handling a high volume of requests. Please try again shortly."}, status=status.HTTP_429_TOO_MANY_REQUESTS)
        
        tailored_resume["user"] = user_id

        url_fields = ["linkedin", "website"]
        url_validator = URLValidator()
        for url_field in url_fields:
            try:
                url_validator(tailored_resume.get(url_field, ""))
                pass
            except ValidationError as e:
                tailored_resume[url_field] = None
        if not tailored_resume.get("summary") and tailored_resume.get("professionalSummary"):
            tailored_resume["summary"] = tailored_resume.get("professionalSummary")
        new_resume = ResumeSerializer(data=tailored_resume)
        if new_resume.is_valid():
            try:
                return Response(new_resume.data, status=status.HTTP_200_OK)
            except Exception as e:
                print("error", e)
                return Response({"details": "Failed to save resume"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            print(new_resume.errors)
            return Response(new_resume.errors, status=status.HTTP_400_BAD_REQUEST)


class ResumeFromObjectAPIView(APIView):
    """
    API View for creating a resume from a resume object.
    """
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Create a resume from a resume object with optional is_master flag.
        """
        resume_data = request.data.copy()
        user = request.user
        
        
        # Check if this should be a master resume
        is_master = resume_data.get('is_master', False)
        
        normalized_resume = normalize_resume_payload(resume_data)
        serializer = ResumeSerializer(data=normalized_resume)
        try:
            if serializer.is_valid():
                if is_master:
                    try:
                        master_resume = Resume.objects.get(user=user, is_master=True)
                        master_resume.delete()
                    except Resume.DoesNotExist:
                        pass
                    
                    user.has_master_resume = True
                    user.save()
                
                serializer.save(user=user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                print("Serializer errors:", serializer.errors)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print("Error creating resume:", e)
            return Response({"error": "An error occurred"}, status=status.HTTP_400_BAD_REQUEST)



def normalize_resume_payload(data):
    out = dict(data)

    if "personalInformation" in out:
        out["personal_information"] = out.get("personalInformation")

    if "professionalExperience" in out:
        out["professional_experiences"] = [
            {
                "organization": item.get("organization", ""),
                "role": item.get("role", ""),
                "start_date": item.get("startDate", ""),
                "end_date": item.get("endDate", ""),
                "location": item.get("location", ""),
                "responsibilities": item.get("responsibilities", []),
            }
            for item in out.get("professionalExperience", [])
        ]
        out.pop("professionalExperience", None)

    if "education" in out:
        out["educations"] = [
            {
                "institution": item.get("institution", ""),
                "degree": item.get("degree", ""),
                "field": item.get("field", ""),
                "start_date": item.get("startDate", ""),
                "end_date": item.get("endDate", ""),
                "gpa": item.get("gpa", ""),
            }
            for item in out.get("education", [])
        ]
        out.pop("education", None)

    validator = URLValidator()
    info = out.get("personal_information", {})

    for fld in ["linkedin", "website"]:
        val = info.get(fld)
        if val:
            try:
                validator(val)
            except ValidationError:
                info.pop(fld, None)
        else:
            info.pop(fld, None)

    email_val = info.get("email")
    if email_val:
        try:
            validate_email(email_val)
        except ValidationError:
            info.pop("email", None)
    else:
        info.pop("email", None)

    out["personal_information"] = info
    return out
