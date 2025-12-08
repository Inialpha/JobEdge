from groq import Groq
import groq
import json


client = Groq()


def generate_cover_letter(resume: dict, job_description: str) -> str:
    """
    Generate a cover letter based on the resume and job description using AI.
    
    Args:
        resume: Dictionary containing resume data (skills, experience, education, etc.)
        job_description: String containing the job description
        
    Returns:
        str: Generated cover letter text
    """
    try:
        system_message = (
            "You are a professional cover letter writer with expertise in creating compelling, "
            "personalized cover letters that highlight a candidate's qualifications and align them "
            "with job requirements. Your cover letters are professional, engaging, and tailored to "
            "each specific role."
        )

        
        user_prompt = f"""
Create a professional cover letter for the following candidate applying to this job.

Candidate Information:
Resume:
{json.dumps(resume, indent=2)}

Job Description:
{job_description}

Requirements:
1. Start with a strong opening that shows enthusiasm and demonstrates understanding of the role
2. Highlight 2-3 key experiences or achievements that directly relate to the job requirements
3. Explain why the candidate is a great fit for this specific role and company
4. Show knowledge of the company/role based on the job description
5. Close with a call to action and professional sign-off
6. Keep it concise (3-4 paragraphs, approximately 250-350 words)
7. Use a professional but warm tone
8. Do NOT include placeholder text like [Your Address] or [Date]
9. Do NOT include the candidate's address, phone number, or email in the letter body
10. Start directly with "Dear Hiring Manager," or similar greeting
11. End with "Sincerely," followed by the candidate's name

Return ONLY the cover letter text, no additional commentary or formatting markers.
"""

        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.7,  # Slightly higher temperature for more natural writing
            top_p=1,
            stream=False,
        )

        cover_letter = completion.choices[0].message.content.strip()
        
        # Remove any markdown formatting if present
        cover_letter = cover_letter.replace('```', '').strip()
        
        return cover_letter

    except (groq.RateLimitError) as e:
        print(f"❌ Groq API error in generate_cover_letter(): {e}")
        return None
    except Exception as e:
        print("❌ Error in generate_cover_letter():", e)
        return None
