import { z } from "zod";
import { AxiosError } from "axios";
import { useUserStore } from "@/store/user";
import { useMutation } from "@tanstack/react-query";
import { SignInAPI } from "@/queries/api/query-slice";
import {
  SignInAPIResponseSchema,
  SignInFormType,
} from "@/schemas/signInSchema";
import { toast } from "sonner";

interface ErrorResponse {
  message: string;
}

export function useSignIn() {
  const { setCredentials } = useUserStore();
  return useMutation<
    z.infer<typeof SignInAPIResponseSchema>,
    AxiosError<ErrorResponse>,
    SignInFormType
  >({
    mutationFn: (user) => SignInAPI.signIn(user),
    onSuccess: (data) => {
      const { payload, message } = data;

      setCredentials({
        accessToken: payload.accessToken,
        role: payload.role,
      });

      toast.success(message);
    },
    onError: (error) => {
      const errorMessage = error.response?.data.message;

      toast.error(errorMessage);
    },
  });
}
