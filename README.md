# JobEdge

> **Land your dream job faster — powered by AI.**

JobEdge is a full-stack job application platform that leverages AI to help job seekers create tailored resumes and cover letters, discover relevant job openings, and manage their entire application workflow in one place.

---

## Table of Contents

- [Description](#description)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

---

## Description

Job hunting is time-consuming and repetitive. JobEdge removes that friction by combining a smart resume builder, AI-powered content generation, and an integrated job search into a single, seamless experience.

Users build a **Master Resume** — a comprehensive profile of their professional history — and JobEdge uses it to instantly generate targeted resumes and cover letters tailored to any job description. The result: less time formatting documents, more time getting interviews.

---

## Key Features

- 🧠 **AI-Powered Resume & Cover Letter Generation** — Automatically tailors your resume and writes a personalized cover letter for every job you apply to, using large language models via Groq.
- 📄 **Smart Resume Builder** — Create or upload resumes in PDF, DOCX, or TXT format. AI extracts and structures your information automatically.
- 🗂️ **Master Resume** — Maintain one comprehensive professional profile that serves as the source of truth for all AI-generated applications.
- 🔍 **Integrated Job Search** — Search for jobs by keyword and location, powered by SerpAPI and the Google Jobs API.
- 📥 **Resume Export** — Download tailored resumes as polished PDF or DOCX files.
- 🔐 **Secure Authentication** — Email-based signup and login with email verification, password reset, and Google OAuth.
- 🗺️ **Guided Onboarding Tours** — Interactive step-by-step tours to help new users get started quickly.
- 📊 **Admin Dashboard** — Analytics and user management for platform administrators.
- 📧 **Automated User Outreach** — Intelligent email engagement system to re-engage users who haven't completed their profile or started applying.

---

## Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| [React 18](https://react.dev/) | UI library |
| [TypeScript](https://www.typescriptlang.org/) | Static typing |
| [Vite](https://vitejs.dev/) | Build tool & dev server |
| [Tailwind CSS](https://tailwindcss.com/) | Utility-first styling |
| [Redux Toolkit](https://redux-toolkit.js.org/) + [Redux Persist](https://github.com/rt2zz/redux-persist) | Global state management |
| [TanStack React Query](https://tanstack.com/query) | Server state & data fetching |
| [React Router DOM](https://reactrouter.com/) | Client-side routing |
| [Radix UI](https://www.radix-ui.com/) | Accessible headless UI components |
| [Framer Motion](https://www.framer.com/motion/) | Animations |
| [React Hook Form](https://react-hook-form.com/) | Form handling |
| [@react-pdf/renderer](https://react-pdf.org/) + [jsPDF](https://github.com/parallax/jsPDF) | PDF generation |
| [Mammoth](https://github.com/mwilliamson/mammoth.js) + [docx](https://github.com/dolanmiu/docx) | DOCX handling |
| [Tesseract.js](https://tesseract.projectnaptha.com/) | Client-side OCR for scanned documents |
| [Axios](https://axios-http.com/) | HTTP client |
| [@react-oauth/google](https://github.com/MomenSherif/react-oauth) | Google OAuth |
| [Vercel Analytics](https://vercel.com/analytics) | Usage analytics |

### Backend

| Technology | Purpose |
|---|---|
| [Django 5](https://www.djangoproject.com/) | Web framework |
| [Django REST Framework](https://www.django-rest-framework.org/) | RESTful API |
| [Groq](https://groq.com/) + [LangChain](https://www.langchain.com/) | LLM inference & orchestration |
| [Pydantic](https://docs.pydantic.dev/) | Structured AI output validation |
| [django-rest-authemail](https://github.com/celasun/django-rest-authemail) | Email-based authentication |
| [django-anymail](https://anymail.dev/) + Brevo | Transactional email delivery |
| [SerpAPI](https://serpapi.com/) | Job search integration |
| [PyMuPDF](https://pymupdf.readthedocs.io/) + [pdfminer](https://pdfminersix.readthedocs.io/) | PDF text extraction |
| [python-docx](https://python-docx.readthedocs.io/) | DOCX file processing |
| [Gunicorn](https://gunicorn.org/) | WSGI production server |
| [Docker](https://www.docker.com/) | Containerization |

### Database

| Technology | Purpose |
|---|---|
| [MySQL](https://www.mysql.com/) | Primary relational database |
| [mysqlclient](https://github.com/PyMySQL/mysqlclient) | Django MySQL adapter |

### External Services

| Service | Purpose |
|---|---|
| [Groq API](https://groq.com/) | Fast LLM inference (Llama 3, Mixtral) |
| [SerpAPI](https://serpapi.com/) | Real-time job listings from Google Jobs |
| [Brevo](https://www.brevo.com/) | Transactional email |
| [Google OAuth 2.0](https://developers.google.com/identity) | Social authentication |
| [Vercel](https://vercel.com/) | Frontend hosting |
| [Render](https://render.com/) | Backend hosting |

---

## Getting Started

### Prerequisites

- **Node.js** v18+ and npm
- **Python** 3.10+
- **MySQL** 8.0+
- **Tesseract OCR** (for the backend OCR fallback)

### Backend Setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables (see section below)
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
python manage.py migrate

# Start the development server
python manage.py runserver
```

#### Docker (alternative)

```bash
cd backend
docker build -t jobedge-backend .
docker run -p 8000:8000 --env-file .env jobedge-backend
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start the development server
npm run dev

# Build for production
npm run build
```

---

## Environment Variables

### Backend (`.env`)

```env
SECRET_KEY=your_django_secret_key

# Database
DATABASE_NAME=jobedge
DATABASE_USER=your_db_user
DATABASE_PASSWORD=your_db_password
DATABASE_HOST=localhost
DATABASE_PORT=3306

# AI
GROQ_API_KEY=your_groq_api_key

# Email (Brevo)
BREVO_API_KEY=your_brevo_api_key
EMAIL_HOST_PASSWORD=your_gmail_app_password

# Google Sign-In (comma-separated if multiple clients)
GOOGLE_OAUTH_CLIENT_IDS=your_google_web_client_id.apps.googleusercontent.com

# Job Search
SERPAPI_KEY=your_serpapi_key
```

### Frontend (`.env`)

```env
VITE_API_URL=http://localhost:8000/api
VITE_AUTH_URL=http://localhost:8000/auth
VITE_EMAIL_API_URL=http://localhost:8000/email
VITE_GOOGLE_CLIENT_ID=your_google_web_client_id.apps.googleusercontent.com
```

---

## Project Structure

```
JobEdge/
├── backend/
│   ├── JobEdgeApi/         # Django project settings & URL routing
│   ├── api/                # Core app: models, views, serializers
│   │   ├── models/         # User, Resume, Job, Application, Company
│   │   ├── views/          # REST API endpoints
│   │   └── serializers/    # DRF serializers
│   ├── ai_services/        # Groq LLM integration & prompt logic
│   ├── job_services/       # Job search & scraping services
│   ├── requirements.txt
│   ├── manage.py
│   └── Dockerfile
└── frontend/
    ├── src/
    │   ├── components/     # Reusable UI components
    │   ├── pages/          # Route-level page components
    │   ├── store/          # Redux slices & store configuration
    │   ├── hooks/          # Custom React hooks
    │   ├── utils/          # API clients, helpers, tour configs
    │   ├── types/          # TypeScript type definitions
    │   └── context/        # React context providers
    ├── package.json
    └── vite.config.ts
```

---

## Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change, then submit a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the [MIT License](LICENSE).
