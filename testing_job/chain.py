from langchain_core.prompts import PromptTemplate
from langchain_groq import ChatGroq
import json
import os
from dotenv import load_dotenv

# Load your OpenAI key from .env file
load_dotenv()

# Load the LangChain prompt template
with open("langchain_job_prompt_template.txt", "r", encoding="utf-8") as f:
    template_text = f.read()

# Define the prompt
prompt = PromptTemplate(
    input_variables=["job_post"],
    template=template_text
)

# Initialize the LLM
llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0,
    max_tokens=None,
    timeout=None,
    max_retries=2,
)
# Chain it
chain = prompt | llm

# 🔁 Function to extract structured data from raw job post
def extract_job_structure(job_text) -> dict:
    try:
        response = chain.invoke({"job_post": job_text})
        content = response.content.strip("`").strip("json").strip()
        return json.loads(content)
    except Exception as e:
        print("Error:", e)
        return None

# 🧪 Example usage
if __name__ == "__main__":
    with open("sample_job.txt", "r", encoding="utf-8") as f:
        job_text = f.read()

    structured_job = extract_job_structure(job_text)

    if structured_job:
        print(json.dumps(structured_job, indent=2))
    else:
        print("Failed to parse structured output.")
