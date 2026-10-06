# JobEdge Resume Intelligence & Editing Requirements

## Stage 1 — Product Requirement

### Purpose

Upgrade the existing JobEdge resume-generation system from simply generating a resume from a job description into a **measurable, evidence-based resume optimization system**.

JobEdge already supports AI-generated resumes and cover letters. The new system should make generated resumes more relevant to the target job, natural, truthful, and measurable, while showing how well a generated resume aligns with a job description.

### Backend — Resume Intelligence

The system should:

- Analyze the candidate's Master Resume and target Job Description.
- Identify relevant skills, experience, qualifications, and terminology.
- Transform relevant candidate information into **natural, job-specific resume content**, rather than simply copying or returning extracted skills and experience.
- Preserve the candidate's actual facts and never fabricate achievements, technologies, responsibilities, metrics, or experience.
- Generate a personalized summary specific to the candidate and target role rather than relying on repetitive generic templates.
- Introduce controlled variation in wording while maintaining accuracy and professional quality.
- Produce measurable evaluation results showing how well the generated resume aligns with the target Job Description.

### Agentic Evaluation Loop

Implement a lightweight **agent loop directly in the application**, without LangChain, LangGraph, or another agent orchestration framework.

The workflow should support:

**Analyze → Generate → Evaluate → Revise → Re-evaluate → Finalize**

A generation agent produces the resume. A separate evaluation process/agent evaluates it against the Job Description and the candidate's source information.

The evaluator should identify weaknesses such as poor job alignment, missing relevant terminology, generic writing, excessive repetition, or unsupported claims.

If the resume fails the defined quality threshold, structured feedback should be passed back to the generation step for a limited number of revisions.

Evaluation results must be retained so different prompts, models, and workflows can be compared objectively.

### Frontend — Resume Editing

Improve the existing resume editing experience so users can control the structure of their final resume.

- Contact information and Summary remain fixed at the top.
- Other resume sections can be reordered by the user.
- Users can move sections up or down during editing.
- The selected order must be preserved in PDF and DOCX exports.
- Section ordering should be represented as structured data rather than hardcoded into the renderer.

### Overall Goal

JobEdge should move from **"AI generates a resume"** toward **"AI generates, evaluates, improves, and measures a truthful resume against a specific job."**

---

## Stage 2 — Refinement & Implementation Requirement

Refine and implement the above requirement against the **existing JobEdge codebase** rather than rebuilding the application.

Before changing the implementation:

1. Inspect the current backend resume-generation workflow, prompts, schemas, services, and export pipeline.
2. Identify where job analysis, skill/experience selection, content generation, and resume rendering currently occur.
3. Inspect the frontend resume editor and document-generation workflow.
4. Design the evaluation system around the existing architecture.
5. Define a small repeatable benchmark of Master Resume + Job Description test cases.
6. Define scoring criteria and thresholds for relevance, keyword alignment, factual accuracy, summary quality, naturalness, redundancy, and structure.
7. Implement the agentic generation/evaluation/revision loop using the existing application stack and direct application logic. **Do not introduce LangChain, LangGraph, or another agent orchestration framework solely for this feature.**
8. Ensure the evaluator distinguishes between:
   - relevant information correctly transformed,
   - information copied without useful transformation,
   - important job requirements that were missed,
   - and information incorrectly invented.
9. Ensure every revision remains grounded in the candidate's original information.
10. Add tests that allow future prompt/model/workflow changes to be compared against the same benchmark.
11. Implement frontend section reordering without breaking existing resume editing, PDF, or DOCX generation.
12. Preserve existing JobEdge functionality for resume generation, cover letters, job search, authentication, and other existing features.

The implementation should prioritize **measurability, factual grounding, maintainability, and incremental improvement** rather than simply making generated text sound more impressive.
