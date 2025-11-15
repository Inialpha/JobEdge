from django.core.validators import URLValidator, validate_email
from django.core.exceptions import ValidationError


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
