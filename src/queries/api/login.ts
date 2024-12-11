import { AxiosError } from "axios";
import { useUserStore } from "@/store/user";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { SignInAPI } from "@/queries/api/query-slice";
import { SignInFormType } from "@/schemas/signInSchema";
import { toast } from "sonner";

interface ErrorResponse {
  message: string;
}

interface SignInResponse {
  token: string;
}

export function useSignIn() {
  const { setCredentials } = useUserStore();
  const navigate = useNavigate();

  return useMutation<SignInResponse, AxiosError<ErrorResponse>, SignInFormType>(
    {
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
        setCredentials({
          accessToken: data.token,
          id: 1,
          email: "g.anakidze@gmail.com",
          firstName: "Giorgi",
          lastName: "Anakidze",
          isAdmin: true,
          role: "admin",
        });

        toast.success("Successfully signed in");

        // Navigate to dashboard after successful login
        navigate({ to: "/" });
      },
      onError: (error) => {
        const errorMessage =
          error.response?.data.message ?? "An error occurred";
        toast.error(errorMessage);
      },
    }
  );
}
