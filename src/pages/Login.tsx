import { FC } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSignIn } from "@/queries/api/login";
import { SignInFormSchema, SignInFormType } from "@/schemas/signInSchema";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto mt-16 px-4"
    >
      <FormProvider {...methods}>
        <Card className="w-full">
          <CardHeader className="space-y-1">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-center mb-2">შესვლა</h2>
              <p className="text-sm text-muted-foreground text-center">
                შეიყვანეთ თქვენი მონაცემები სისტემაში შესასვლელად
              </p>
            </motion.div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">ელ. ფოსტა</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    className="pl-10"
                    placeholder="mail@example.com"
                  />
                </div>
                {errors.email && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-destructive"
                  >
                    {errors.email.message}
                  </motion.span>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">პაროლი</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    {...register("password")}
                    className="pl-10"
                    placeholder="••••••••"
                  />
                </div>
                {errors.password && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-destructive"
                  >
                    {errors.password.message}
                  </motion.span>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || signIn.isPending}
              >
                {signIn.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    დაელოდეთ...
                  </>
                ) : (
                  "შესვლა"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </FormProvider>
    </motion.div>
  );
};
