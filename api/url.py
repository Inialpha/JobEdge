from django.urls import path
from .views.resumes import ResumeAPIView, GenerateResume
from .views.users import UserAPIView, CustomSignup, ProfileView
from .views.jobs import JobSearchAPIView, JobAPIView
from .views.auth import GoogleSignup
# import authemail
from authemail import views


urlpatterns = [
    path('generate_resume/', GenerateResume.as_view(), name="generate-resume"),
    path('resumes/', ResumeAPIView.as_view(), name='resume-list'),
    path('resumes/<str:pk>/', ResumeAPIView.as_view(), name='resume-detail'),
    # users
    path('users/profile/', ProfileView.as_view(), name='user-profile'),
    path('users/', UserAPIView.as_view(), name='create-user'),
    path('users/<str:pk>/', UserAPIView.as_view(), name='update-delete-user'),
    path('jobs/search/', JobSearchAPIView.as_view(), name='jobsearch'),
    path('jobs/', JobAPIView.as_view(), name='job-list'),
    path('api/jobs/<str:id>/', JobAPIView.as_view(), name='job-detail'),

    # auth routes........auth routes #
    # ..........signup......... #
    path('auth/signup', CustomSignup.as_view(), name='custom-signup'),
    path('auth/signup/', CustomSignup.as_view(), name='custom-signup'),
    path('auth/google/signup', GoogleSignup.as_view()),
    
    path('auth/verify-email/', views.SignupVerify.as_view(),
         name='authemail-signup-verify'),
    

    path('auth/login/', views.Login.as_view(), name='authemail-login'),
    path('auth/logout/', views.Logout.as_view(), name='authemail-logout'),

    path('auth/password/reset/', views.PasswordReset.as_view(),
         name='authemail-password-reset'),
    path('auth/password/reset/verify/', views.PasswordResetVerify.as_view(),
         name='authemail-password-reset-verify'),
    path('auth/password/reset/verified/', views.PasswordResetVerified.as_view(),
         name='authemail-password-reset-verified'),

    path('email/change/', views.EmailChange.as_view(),
         name='authemail-email-change'),
    path('email/change/verify/', views.EmailChangeVerify.as_view(),
         name='authemail-email-change-verify'),

    path('password/change/', views.PasswordChange.as_view(),
         name='authemail-password-change'),

    path('users/me/', views.UserMe.as_view(), name='authemail-me'),
]
