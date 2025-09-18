class Job:
    All locations, all categories, all job types. It is going to be a daily thing. This is the dept of the data
class JobCategory(str, Enum):
ADMINISTRATIVE = "Administrative & Office Support"                                                                    AGRICULTURE = "Agriculture, Forestry & Fishing"                                                                       ARTS = "Arts, Culture & Entertainment"
BUSINESS = "Business, Consulting & Management"                                                                        COMMUNITY = "Community & Social Services"                                                                             CONSTRUCTION = "Construction & Skilled Trades"
CUSTOMER_SERVICE = "Customer Service"                                                                                 EDUCATION = "Education & Training"                                                                                    ENGINEERING = "Engineering & Technical"
FINANCE = "Finance & Accounting"                                                                                      HEALTHCARE = "Healthcare & Medical"
HOSPITALITY = "Hospitality & Tourism"
HUMAN_RESOURCES = "Human Resources (HR)"
INFORMATION_TECHNOLOGY = "Information Technology (IT) & Software Development"
LEGAL = "Legal & Law Enforcement"
MANUFACTURING = "Manufacturing & Production"
MARKETING = "Marketing, Advertising & PR"
MEDIA = "Media & Communications"
REAL_ESTATE = "Real Estate & Property"
RETAIL = "Retail & Sales"
SCIENCE = "Science & Research"
SUPPLY_CHAIN = "Supply Chain & Logistics"
TRANSPORTATION = "Transportation"
UTILITIES = "Utilities & Energy"

class Job1(BaseModel):
# Job Identification
job_publisher: str = Field(
...,
description="The name of the source or platform publishing the job"
)

# Job Details
job_title: str = Field(
    ...,
    description="The full title of the job as displayed on the listing."                                              )
job_description: str = Field(
    ...,
    description="The full job description including company background, culture, etc."
)
job_qualifications: List[str] = Field(
    default_factory=list,
    description="A list of job requirements, qualifications, and experience expected from the candidate."             )
job_responsibilities: List[str] = Field(
    default_factory=list,
    description="A list of key responsibilities and tasks associated with the job."
)
job_benefits: Optional[List[str]] = Field(
    default_factory=list,
    description="A list of employee benefits offered (e.g., health insurance, remote work, equity)."
)

# Employer Details
employer_name: str = Field(
    ...,
    description="The full name of the hiring employer or company."
)
employer_logo: Optional[HttpUrl] = Field(
    None,
    description="A URL to the company's logo image, if available."
)
employer_website: Optional[HttpUrl] = Field(
    None,
    description="The website URL of the employer's profile or homepage."
)

# Location & Remote Work
job_location: str = Field(
    ...,
    description="Full location string as listed (e.g., 'New York, NY, United States')."
)
job_country: Optional[str] = Field(
    None,
    description="Country parsed from the location string (e.g., 'United States')."
)
job_is_remote: bool = Field(
    default=False,
    description="Boolean flag indicating whether the job is explicitly remote."
)
# Employment Type
job_employment_type: str = Field(
    default='full-time',
    description="The primary employment type (e.g., 'full-time', 'part-time', 'contractor')."
)
job_employment_types: List[str] = Field(
    default_factory=list,
    description="List of all applicable employment types."
)
# Salary & Compensation
job_salary: Optional[conint(ge=0)] = Field(
    None,
    description="Overall salary value if a single estimate is provided including currency and time period."
)
# Additional Information
job_tags: List[str] = Field(
    default_factory=list,
    description="A list of keywords or tags from the jobs"
)
job_category: JobCategory


