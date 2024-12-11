import { FC } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSignIn } from "@/queries/api/login";
import { SignInFormSchema, SignInFormType } from "@/schemas/signInSchema";

export const SignInForm: FC = () => {
  const methods = useForm<SignInFormType>({
    resolver: zodResolver(SignInFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = methods;

  const signIn = useSignIn();

  const onSubmit: SubmitHandler<SignInFormType> = async (data) => {
    try {
      await signIn.mutateAsync(data);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  return (
    <FormProvider {...methods}>
      <form
        className="flex flex-col gap-4 w-full max-w-sm"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="flex flex-col gap-2">
          <Input type="email" {...register("email")} placeholder="ელ. ფოსტა" />
          {errors.email && (
            <span className="text-sm text-destructive">
              {errors.email.message}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Input
            type="password"
            {...register("password")}
            placeholder="პაროლი"
          />
          {errors.password && (
            <span className="text-sm text-destructive">
              {errors.password.message}
            </span>
          )}
        </div>

        <Button type="submit" disabled={isSubmitting || signIn.isPending}>
          {signIn.isPending ? "დაელოდეთ..." : "შესვლა"}
        </Button>
      </form>
    </FormProvider>
  );
};
