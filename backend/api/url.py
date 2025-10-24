from django.urls import path
from .views.resumes import ResumeAPIView, GenerateResume, GenerateResumeFromJobDescription, ResumeFromObjectAPIView
from .views.users import UserAPIView, CustomSignup
from .views.jobs import JobSearchAPIView, JobAPIView
# import authemail
from authemail import views


urlpatterns = [
    path('generate_resume/', GenerateResume.as_view(), name="generate-resume"),
    path('resume/generate/', GenerateResumeFromJobDescription.as_view(), name="generate-resume-from-job-description"),
    path('resume/from-object/', ResumeFromObjectAPIView.as_view(), name='resume-from-object'),
    path('resumes/', ResumeAPIView.as_view(), name='resume-list'),
    path('resumes/<str:pk>/', ResumeAPIView.as_view(), name='resume-detail'),
    # users
    path('users/', UserAPIView.as_view(), name='create-user'),
    path('users/<str:pk>/', UserAPIView.as_view(), name='update-delete-user'),
    path('jobs/search/', JobSearchAPIView.as_view(), name='jobsearch'),
    path('jobs/', JobAPIView.as_view(), name='job-list'),
    path('api/jobs/<int:id>/', JobAPIView.as_view(), name='job-detail'),

    # auth routes........auth routes #
    # ..........signup......... #
    path('auth/signup', CustomSignup.as_view(), name='custom-signup'),
    path('auth/signup/', CustomSignup.as_view(), name='custom-signup'),
    
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



