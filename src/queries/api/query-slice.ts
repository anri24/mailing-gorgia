import { z } from "zod";
import { api } from "@/api/helper";
import {
  SignInAPIResponseSchema,
  SignInFormSchema,
} from "@/schemas/signInSchema";

const SignInRequest = SignInFormSchema;

const SignInResponse = SignInAPIResponseSchema;

const SignInPath = import.meta.env.VITE_API_URL + "/Auth";

const signIn = api<
  z.infer<typeof SignInRequest>,
  z.infer<typeof SignInResponse>
>({
  method: "POST",
  path: SignInPath,
  requestSchema: SignInRequest,
  responseSchema: SignInResponse,
  type: "public",
});

export const SignInAPI = {
  signIn,
};
