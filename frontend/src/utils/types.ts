export type FormType = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export type NewData = {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
};

export type FeedbackType = {
  variant?: string;
  message: string;
  title?: string;
};


export type Job = {
  id: string;
  job_id_from_source: string;
  job_title: string;
  employer_name: string;
  employer_logo?: string | null;
  employer_website?: string | null;
  job_publisher: string;
  job_employment_type: "full-time" | "part-time" | "contract" | "temporary" | "internship" | "freelance"; // Add all options from EMPLOYMENT_TYPES
  job_employment_types: string[]; // Assuming EMPLOYMENT_TYPES is a list of strings
  job_apply_link: string;
  job_apply_is_direct: boolean;
  job_description: string;
  job_is_remote: boolean;
  job_location: string;
  job_city: string;
  job_state: string;
  job_country: string;
  job_benefits?: string[] | null;
  job_google_link?: string | null;
  job_salary?: number | null;
  job_min_salary?: number | null;
  job_max_salary?: number | null;
  job_qualifications: string[];
  job_responsibilities: string[];
};
