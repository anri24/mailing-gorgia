import { AxiosError } from "axios";
import { useUserStore } from "@/store/user";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { SignInAPI } from "@/queries/api/query-slice";
import { SignInFormType } from "@/schemas/signInSchema";
import { toast } from "sonner";
import { jwtDecode } from "jwt-decode";

interface ErrorResponse {
  message: string;
}

interface SignInResponse {
  token: string;
}

interface JWTPayload {
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier": string;
  Name: string;
  IsAdmin: string;
  jti: string;
  exp: number;
  iss: string;
  aud: string;
}

export function useSignIn() {
  const { setCredentials } = useUserStore();
  const navigate = useNavigate();

  return useMutation<SignInResponse, AxiosError<ErrorResponse>, SignInFormType>({
    mutationFn: async (user) => {
      try {
        const response = await SignInAPI.signIn(user);
        return response;
      } catch (error) {
        console.error("Sign in API call failed:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      const decoded = jwtDecode<JWTPayload>(data.token);
      
      setCredentials({
        accessToken: data.token,
        id: decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"],
        name: decoded.Name,
        isAdmin: decoded.IsAdmin.toLowerCase() === "true",
      });

      navigate({ to: "/" });
    },
    onError: (error) => {
      const errorMessage = error.response?.data.message ?? "An error occurred";
      toast.error(errorMessage);
    },
  });
}
