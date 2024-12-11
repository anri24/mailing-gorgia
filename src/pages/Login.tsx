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
  });

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = methods;

  const signIn = useSignIn();

  const onSubmit: SubmitHandler<SignInFormType> = (data) => {
    signIn.mutate(data);
  };

  console.log(errors);

  return (
    <FormProvider {...methods}>
      <form className="form" onSubmit={handleSubmit(onSubmit)}>
        <Input type="email" {...register("email")} placeholder="Email" />
        {errors.email && (
          <span className="text-sm text-destructive">
            {errors.email.message}
          </span>
        )}
        <Input
          type="password"
          {...register("password")}
          placeholder="Password"
        />
        {errors.password && (
          <span className="text-sm text-destructive">
            {errors.password.message}
          </span>
        )}
        <Button type="submit">Sign In</Button>
      </form>
    </FormProvider>
  );
};
