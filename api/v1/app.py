from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()
from routes.users import user_router
from routes.waitlist import waitlist_router, waitlist_auth_router
from routes.auth import auth_router
from routes.stats import stats_router
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include routes
app.include_router(auth_router, prefix="/api/auth/", tags=["User_Auth"])
app.include_router(user_router, prefix="/api/users", tags=["Users"])
app.include_router(waitlist_router, prefix="/api/waitlist", tags=["Waitlist"])
app.include_router(waitlist_auth_router, prefix="/api/auth/waitlist", tags=["Waitlist_Auth"])
app.include_router(stats_router, prefix="/api/stats", tags=["Stats"])

@app.get("/")
def root():
    return {"message": "Welcome to the JobEdge api"}
