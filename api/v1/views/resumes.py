from fastapi import APIRouter, Depends, HTTPException
from schemas.resume import ResumeCreate, ResumeUpdate, ResumeResponse
from models.resume import Resume
from storage, gey_db import DBStorage
import uuid

router = APIRouter(prefix="/resumes", tags=["Resumes"])

@router.post("/", response_model=ResumeResponse)
def create_resume(resume: ResumeCreate, db: DBStorage = Depends(get_db)):
    new_resume = Resume(**resume.dict())
    db.new(new_resume)
    db.save()
    return new_resume

@router.get("/{resume_id}", response_model=ResumeResponse)
def get_resume(resume_id: uuid.UUID, db: DBStorage = Depends(get_db)):
    resume = db.get(Resume, resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume

@router.patch("/{resume_id}", response_model=ResumeResponse)
def update_resume(resume_id: uuid.UUID, resume_data: ResumeUpdate, db: DBStorage = Depends(get_db)):
    resume = db.get(Resume, resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    for key, value in resume_data.dict(exclude_unset=True).items():
        setattr(resume, key, value)

    db.save()
    return resume

@router.delete("/{resume_id}")
def delete_resume(resume_id: uuid.UUID, db: DBStorage = Depends(get_db)):
    resume = db.get(Resume, resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    db.delete(resume)
    db.save()
    return {"message": "Resume deleted"}

"""
    def post(self, request):
        
        Create a new resume.
        
        print(request.data)
        file_name = request.data.get("file")
        user_id = request.data.get("user_id")
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"details": "No user for user's id"}, status=status.HTTP_400_BAD_REQUEST)

        file = File(file_name)
        resume_data = ai(file.text)
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
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(e)
            return Response({"error": "An error occured"}, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
    
        Update an existing resume.
        
        resume = get_object_or_404(Resume, pk=pk)
        serializer = ResumeSerializer(resume, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        
        Delete a resume.
        
        resume = get_object_or_404(Resume, pk=pk)
        resume.delete()
        return Response({"message": "Resume deleted successfully"}, status=status.HTTP_204_NO_CONTENT)

class GenerateResume(APIView):
    def get(self, request, resume_id):
        pass

    def post(self, request):
        take a user id and a job id, return an ai generated resume base on users master resume 
        print(request.data)
        job_id = request.data.get("job_id")
        user_id = request.data.get("user_id")
        try:
            user = User.objects.get(id=user_id)
            job = Job.objects.get(id=job_id)
            resume = Resume.objects.get(user=user, is_master=True)
        except User.DoesNotExist:
            return Response({"details": "No user for user's id"}, status=status.HTTP_400_BAD_REQUEST)
        except Resume.DoesNotExist:
            return Response({"details": "User does not have a master resume"}, status=status.HTTP_400_BAD_REQUEST)
        except Job.DoesNotExist:
            return Response({"details": "No job for jobs's id"}, status=status.HTTP_400_BAD_REQUEST)

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


def generate_resume_text(instance):

    Generates a formatted resume-like text from the given instance.
    
    :param instance: A dictionary containing the instance data.
    :return: A formatted text string.
    
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

    """
