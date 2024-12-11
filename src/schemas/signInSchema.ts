import { z } from "zod";

export const SignInFormSchema = z.object({
  email: z.string().min(1, "Email is required").toLowerCase(),
  password: z.string().trim(),
});

export type SignInFormType = z.infer<typeof SignInFormSchema>;

export type SignInFieldName = keyof SignInFormType;

export const SignInAPIResponseSchema = z.object({
  status: z.boolean(),
  message: z.string(),
  payload: z.object({
    accessToken: z.string(),
    role: z.string(),
  }),
});
