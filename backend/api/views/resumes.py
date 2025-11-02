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

        try:
            serializer = ResumeSerializer(data=resume_data)
            if not serializer.is_valid():
                pass
            print(resume_data, "\n\n\n\n")
            print(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
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
        user = request.user
        print(user)
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
        
        # Generate tailored resume using AI
        tailored_resume = generate_resume(job_description, data)
        
        if not tailored_resume:
            return Response({"details": "Failed to generate resume"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
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
        user_id = request.user.id
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"details": "User not found"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Set user in resume data
        resume_data['user'] = user_id
        
        # Check if this should be a master resume
        is_master = resume_data.get('is_master', False)
        
        if 'personalInformation' in resume_data:
            resume_data['personal_information'] = resume_data['personalInformation']
        # Convert professionalExperience to professional_experiences
        if 'professionalExperience' in resume_data:
            resume_data['professional_experiences'] = [
                {
                    'organization': exp.get('organization', ''),
                    'role': exp.get('role', ''),
                    'start_date': exp.get('startDate', ''),
                    'end_date': exp.get('endDate', ''),
                    'location': exp.get('location', ''),
                    'responsibilities': exp.get('responsibilities', [])
                }
                for exp in resume_data['professionalExperience']
            ]
            del resume_data['professionalExperience']
        
        # Convert education to educations
        if 'education' in resume_data:
            resume_data['educations'] = [
                {
                    'institution': edu.get('institution', ''),
                    'degree': edu.get('degree', ''),
                    'field': edu.get('field', ''),
                    'start_date': edu.get('startDate', ''),
                    'end_date': edu.get('endDate', ''),
                    'gpa': edu.get('gpa', '')
                }
                for edu in resume_data['education']
            ]
            del resume_data['education']
        
        # Validate URL fields only if they have values
        url_fields = ["linkedin", "website"]
        url_validator = URLValidator()
        for url_field in url_fields:
            url_value = resume_data.get(url_field, "")
            if url_value:  # Only validate non-empty URLs
                try:
                    url_validator(url_value)
                except ValidationError:
                    resume_data[url_field] = None
            else:
                resume_data[url_field] = None
        
        # Validate email only if it has a value
        email_value = resume_data.get("email", "")
        if email_value:  # Only validate non-empty email
            try:
                validate_email(email_value)
            except ValidationError:
                resume_data['email'] = None
        else:
            resume_data['email'] = None
        
        serializer = ResumeSerializer(data=resume_data)
        
        try:
            if serializer.is_valid():
                # If this is a master resume, remove any previous master resume
                if is_master:
                    try:
                        master_resume = Resume.objects.get(user=user, is_master=True)
                        master_resume.delete()
                    except Resume.DoesNotExist:
                        pass
                    
                    user.has_master_resume = True
                    user.save()
                
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                print("Serializer errors:", serializer.errors)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print("Error creating resume:", e)
            return Response({"error": "An error occurred"}, status=status.HTTP_400_BAD_REQUEST)


class ConvertPdfToDocxAPIView(APIView):
    """
    API View for converting PDF to DOCX format using pdf2docx library.
    """
    #authentication_classes = [TokenAuthentication]
    #permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Receive a PDF file, convert it to DOCX, and return the DOCX file.
        """
        print(request)
        import os
        import tempfile
        from pdf2docx import Converter
        from django.http import FileResponse
        print("after imports")
        
        # Get the uploaded PDF file
        pdf_file = request.FILES.get('pdf_file')
        
        if not pdf_file:
            print("{error: No PDF file provided,")
            return Response(
                {"error": "No PDF file provided"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate that the uploaded file is a PDF
        if not pdf_file.name.endswith('.pdf'):
            print("pdf_file.name.endswith(")
            return Response(
                {"error": "File must be a PDF"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Create temporary files for PDF input and DOCX output
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_pdf:
                # Write uploaded PDF to temporary file
                for chunk in pdf_file.chunks():
                    temp_pdf.write(chunk)
                temp_pdf_path = temp_pdf.name
            
            # Create temporary DOCX file path
            temp_docx_path = temp_pdf_path.replace('.pdf', '.docx')
            
            # Convert PDF to DOCX
            cv = Converter(temp_pdf_path)
            cv.convert(temp_docx_path)
            cv.close()
            
            # Open the converted DOCX file for response
            docx_file = open(temp_docx_path, 'rb')
            
            # Create response with DOCX file
            response = FileResponse(
                docx_file,
                content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            )
            response['Content-Disposition'] = f'attachment; filename="resume.docx"'
            
            # Clean up temporary PDF file immediately
            os.unlink(temp_pdf_path)
            
            # Schedule DOCX cleanup after response is sent
            # Note: The file will be deleted after the response is fully sent
            def cleanup_docx():
                try:
                    os.unlink(temp_docx_path)
                except Exception:
                    pass
            
            # Register cleanup callback
            import atexit
            atexit.register(cleanup_docx)
            
            return response
            
        except Exception as e:
            # Clean up temporary files in case of error
            try:
                if 'temp_pdf_path' in locals():
                    os.unlink(temp_pdf_path)
                if 'temp_docx_path' in locals() and os.path.exists(temp_docx_path):
                    os.unlink(temp_docx_path)
            except Exception:
                pass
            
            print(f"Error converting PDF to DOCX: {e}")
            return Response(
                {"error": "Failed to convert PDF to DOCX"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
