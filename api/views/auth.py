from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from allauth.socialaccount.models import SocialAccount
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
#from dj_rest_auth.registration.views import SocialLoginView
#from dj_rest_auth.views import LoginView
from rest_framework.permissions import AllowAny
from django.contrib.auth import get_user_model
import requests
from rest_framework.authtoken.models import Token
User = get_user_model()


#class GoogleLogin(SocialLoginView):
#    adapter_class = GoogleOAuth2Adapter

class GoogleSignup(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            id_token = request.data.get('credential')
            print(id_token)
            if not id_token:
                return Response({"detail": "Missing access id_token"}, status=status.HTTP_400_BAD_REQUEST)

            # Verify the token with Google
            response = requests.get(
                f"https://www.googleapis.com/oauth2/v3/tokeninfo?id_token={id_token}"
            )
            user_info = response.json()
            print(user_info)

            if "email" not in user_info:
                return Response({"detail": "Invalid id_token"}, status=status.HTTP_400_BAD_REQUEST)

            email = user_info['email']

            # Check if the user already exists
            user, created = User.objects.get_or_create(email=email, defaults={
                'first_name': user_info.get('given_name'),
                'last_name': user_info.get('family_name')
            })

            # Link social account if new user
            if created:
                user.is_verified = true
                user.save()
                pass
                """SocialAccount.objects.create(
                    user=user,
                    provider='google',
                    uid=user_info.get('sub')
                )"""
                
            stat = status.HTTP_201_CREATED if created else status.HTTP_200_OK
            token, created = Token.objects.get_or_create(user=user)
            return Response({'token': token.key},
                    status=stat)

        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
