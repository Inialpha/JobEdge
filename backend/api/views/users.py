from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from ..models import User
from ..serializers.user import UserSerializer, CustomSignupSerializer, ProfileSerializer
from rest_framework.authentication import SessionAuthentication, TokenAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from django.conf import settings
from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2 import id_token as google_id_token


class ProfileAPIView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        try:
            serializer = ProfileSerializer(request.user)
            serializer.data.pop("password", None)
            return Response(serializer.data)
        except Exception as e:
            print(e)
            raise e

class UserAPIView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    # POST method: Create a new user
    def post(self, request, *args, **kwargs):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                "message": "User created successfully",
                "user": UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # PUT method: Update an existing user (requires user ID in the request)
    def put(self, request, *args, **kwargs):
        user_id = kwargs.get('pk')
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                "message": "User updated successfully",
                "user": UserSerializer(user).data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # DELETE method: Delete an existing user (requires user ID in the request)
    def delete(self, request, *args, **kwargs):
        user_id = kwargs.get('pk')
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        
        user.delete()
        return Response({"message": "User deleted successfully"}, status=status.HTTP_204_NO_CONTENT)



from authemail.views import Signup
class CustomSignup(Signup):
    permission_classes = [AllowAny]
    serializer_class = CustomSignupSerializer


class GoogleSignInAPIView(APIView):
    permission_classes = [AllowAny]

    @staticmethod
    def _fallback_names(email, given_name, family_name):
        first_name = (given_name or "").strip()
        last_name = (family_name or "").strip()

        if not first_name:
            first_name = email.split("@")[0][:255] or "User"
        if not last_name:
            last_name = ""

        return first_name[:255], last_name[:256]

    def post(self, request, *args, **kwargs):
        credential = request.data.get("id_token")
        if not isinstance(credential, str) or not credential.strip():
            return Response(
                {"detail": "Google ID token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        allowed_client_ids = settings.GOOGLE_OAUTH_CLIENT_IDS
        if not allowed_client_ids:
            return Response(
                {"detail": "Google authentication is not configured."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        try:
            id_info = google_id_token.verify_oauth2_token(credential, GoogleRequest())
        except ValueError:
            return Response(
                {"detail": "Invalid Google ID token."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if id_info.get("aud") not in allowed_client_ids:
            return Response(
                {"detail": "Google ID token audience mismatch."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not id_info.get("email_verified"):
            return Response(
                {"detail": "Google account email is not verified."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        email = (id_info.get("email") or "").strip()
        google_sub = (id_info.get("sub") or "").strip()

        if not email or not google_sub:
            return Response(
                {"detail": "Google token is missing required claims."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        first_name, last_name = self._fallback_names(
            email=email,
            given_name=id_info.get("given_name"),
            family_name=id_info.get("family_name"),
        )

        user = User.objects.filter(email__iexact=email).first()

        if user:
            if user.google_sub and user.google_sub != google_sub:
                return Response(
                    {"detail": "This email is already linked to another Google account."},
                    status=status.HTTP_409_CONFLICT,
                )

            updated_fields = []
            if not user.google_sub:
                user.google_sub = google_sub
                updated_fields.append("google_sub")
            if not user.first_name:
                user.first_name = first_name
                updated_fields.append("first_name")
            if not user.last_name:
                user.last_name = last_name
                updated_fields.append("last_name")
            if hasattr(user, "is_verified") and not user.is_verified:
                user.is_verified = True
                updated_fields.append("is_verified")
            if updated_fields:
                user.save(update_fields=updated_fields)
        else:
            user = User(
                email=email,
                first_name=first_name,
                last_name=last_name,
                google_sub=google_sub,
            )
            if hasattr(user, "is_verified"):
                user.is_verified = True
            user.set_unusable_password()
            user.save()

        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key}, status=status.HTTP_200_OK)
