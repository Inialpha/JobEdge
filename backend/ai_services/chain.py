import json
from langchain_core.prompts import PromptTemplate
from langchain_groq import ChatGroq

with open("langchain_job_prompt_template.txt", "r", encoding="utf-8") as f:
    template_text = f.read()

prompt = PromptTemplate(
    input_variables=["job_post"],
    template=template_text
)

llm = ChatGroq(
    model="llama3-70b-8192",  # Use correct Groq model name
    temperature=0,
    max_tokens=None,
    timeout=None,
    max_retries=2,
)

chain = prompt | llm

def extract_job_structure(job_text: str) -> dict:
    try:
        result = chain.invoke({"job_post": job_text})
        response = result.content if hasattr(result, "content") else result
        return json.loads(response)
    except Exception as e:
        print("Error extracting job structure:", e)
        return None
