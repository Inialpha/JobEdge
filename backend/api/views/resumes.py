from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.core.validators import URLValidator, validate_email
from django.core.exceptions import ValidationError
from ..models import Resume, Job, User
from ..serializers.resume import ResumeSerializer
from file_reader import File
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
        if pk:
            # Fetch a single resume
            resume = get_object_or_404(Resume, pk=pk)
            serializer = ResumeSerializer(resume)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            # Fetch all resumes
            resumes = Resume.objects.all()
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

        file = File(file_name)
        resume_data = ai(file.text)
        print(resume_data)
        resume_data['file'] = file_name
        resume_data["text"] = file.text
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


        serializer = ResumeSerializer(data=resume_data)
        try:
            if serializer.is_valid():
                # remove any previous master resume to avoid two master resumes
                try:
                    master_resume = Resume.objects.get(user=user, is_master=True)
                    if master_resume:
                        print(master_resume)
                        master_resume.delete()
                except Resume.DoesNotExist:
                    pass

                serializer.save()
                user.has_master_resume = True
                user.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                print(serializer.errors)

            print("status=status.HTTP_400_BAD_REQUEST)")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(e)
            return Response({"error": "An error occured"}, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        """
        Update an existing resume.
        """
        resume = get_object_or_404(Resume, pk=pk)
        serializer = ResumeSerializer(resume, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        """
        Delete a resume.
        """
        resume = get_object_or_404(Resume, pk=pk)
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
        tailored_resume["text"] = generate_resume_text(tailored_resume)
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
                new_resume.save()
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
        
        # Generate tailored resume using AI
        tailored_resume = generate_resume(job_description, resume_serializer.data["text"])
        print(tailored_resume)
        
        if not tailored_resume:
            return Response({"details": "Failed to generate resume"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        tailored_resume["text"] = generate_resume_text(tailored_resume)
        tailored_resume["user"] = user_id

        # Validate URL fields - preserve AI-generated values if valid
        url_fields = ["linkedin", "website"]
        url_validator = URLValidator()
        for url_field in url_fields:
            try:
                url_validator(tailored_resume.get(url_field, ""))
                # Keep the AI-generated URL as it's valid - no changes needed
                pass
            except ValidationError as e:
                # If invalid, set to None
                tailored_resume[url_field] = None
        if not tailored_resume.get("summary") and tailored_resume.get("professionalSummary"):
            tailored_resume["summary"] = tailored_resume.get("professionalSummary")
        new_resume = ResumeSerializer(data=tailored_resume)
        if new_resume.is_valid():
            try:
                new_resume.save()
                return Response(new_resume.data, status=status.HTTP_200_OK)
            except Exception as e:
                print("error", e)
                return Response({"details": "Failed to save resume"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            print(new_resume.errors)
            return Response(new_resume.errors, status=status.HTTP_400_BAD_REQUEST)


def generate_resume_text(instance):
    """
    Generates a formatted resume-like text from the given instance.
    
    :param instance: A dictionary containing the instance data.
    :return: A formatted text string.
    """
    text_parts = []
    
    # Name
    text_parts.append(instance.get("name", "N/A"))
    
    # Summary
    text_parts.append("\nSUMMARY")
    text_parts.append(instance.get("summary", "N/A"))
    
    # Professional Experience
    experiences = instance.get("professional_experiences", [])
    if experiences:
        text_parts.append("\nPROFESSIONAL EXPERIENCE")
        for exp in experiences:
            text_parts.append(f"{exp.get('company', 'N/A')}, {exp.get('location', 'N/A')}\n— {exp.get('title', 'N/A')}\n{exp.get('start_date', 'N/A')} - {exp.get('end_date', 'Present')}")
            for duty in exp.get("responsibilities", []):
                text_parts.append(f"●\n{duty}")

    # Education
    educations = instance.get("educations", [])
    if educations:
        text_parts.append("\nEDUCATION")
        for edu in educations:
            text_parts.append(f"{edu.get('institution', 'N/A')}, {edu.get('location', 'N/A')}\n— {edu.get('degree', 'N/A')}\n{edu.get('start_year', 'N/A')} - {edu.get('end_year', 'N/A')}")

    # Projects
    projects = instance.get("projects", [])
    if projects:
        text_parts.append("\nPROJECTS")
        for project in projects:
            text_parts.append(f"{project.get('name', 'N/A')} — {project.get('description', 'N/A')}")
            for detail in project.get("details", []):
                text_parts.append(detail)
            if "link" in project:
                text_parts.append(f"Link: {project['link']}")

    # Contact Information
    contact_info = []
    if instance.get("address"):
        contact_info.append(f"Address: {instance['address']}")
    if instance.get("linkedin"):
        contact_info.append(f"LinkedIn: {instance['linkedin']}")
    if instance.get("phone_number"):
        contact_info.append(f"Phone: {instance['phone_number']}")
    if instance.get("website"):
        contact_info.append(f"Website: {instance['website']}")
    if instance.get("email"):
        contact_info.append(instance["email"])
    
    if contact_info:
        text_parts.append("\n" + "\n".join(contact_info))

    # Skills
    skills = instance.get("skills", [])
    if skills:
        text_parts.append("\nSKILL")
        for skill in skills:
            text_parts.append(f"●\n{skill}")

    # Languages
    languages = instance.get("languages", [])
    if languages:
        text_parts.append("\nLANGUAGES")
        text_parts.append(", ".join(languages))

    return "\n".join(text_parts)
