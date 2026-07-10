import { GoogleLogin, GoogleOAuthProvider, CredentialResponse } from "@react-oauth/google";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { login } from "@/store/userSlice";
import { getRequest, postRequest } from "@/utils/apis";
import { setCookie } from "@/utils/cookieManager";

type FeedbackVariant = "success" | "error";

interface GoogleSignInButtonProps {
  onFeedback: (payload: { message: string; variant: FeedbackVariant }) => void;
}

export default function GoogleSignInButton({ onFeedback }: GoogleSignInButtonProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    const idToken = credentialResponse.credential;
    if (!idToken) {
      onFeedback({ message: "Google sign-in did not return an ID token.", variant: "error" });
      return;
    }

    try {
      const response = await postRequest(
        `${import.meta.env.VITE_AUTH_URL}/google/`,
        { id_token: idToken },
        false
      );

      const authResult = await response.json();
      if (!response.ok) {
        onFeedback({
          message: authResult?.detail || "Google sign-in failed.",
          variant: "error",
        });
        return;
      }

      setCookie("token", authResult.token);

      const profileResponse = await getRequest(`${import.meta.env.VITE_API_URL}/users/profile/`);
      const profileJson = await profileResponse.json();
      if (!profileResponse.ok) {
        onFeedback({
          message: profileJson?.detail || "Unable to load user profile.",
          variant: "error",
        });
        return;
      }

      const userData = {
        id: profileJson.id,
        firstName: profileJson.first_name,
        lastName: profileJson.last_name,
        email: profileJson.email,
        isStaff: profileJson.is_staff,
        hasMasterResume: profileJson.has_master_resume,
      };

      dispatch(login(userData));
      onFeedback({ message: "Google sign-in successful. Redirecting to dashboard.", variant: "success" });
      setTimeout(() => {
        navigate(userData.isStaff ? "/admin/dashboard" : "/dashboard");
      }, 1000);
    } catch {
      onFeedback({ message: "An error occurred during Google sign-in.", variant: "error" });
    }
  };

  if (!clientId) {
    return (
      <p className="text-xs text-center text-gray-500">
        Google sign-in is unavailable right now.
      </p>
    );
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="flex justify-center">
        <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => onFeedback({ message: "Google sign-in failed.", variant: "error" })} />
      </div>
    </GoogleOAuthProvider>
  );
}
