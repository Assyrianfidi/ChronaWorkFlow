import React from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/components/ui/card";
import { Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/auth-store";
import { loginSchema, type LoginFormData } from "@/lib/validations/schemas";
import {
  useForm,
  type UseFormReturn,
  type SubmitHandler,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/components/ui/input";
import { type ReactElement } from "react";

interface LoginFormProps {
  methods: UseFormReturn<LoginFormData>;
  onSubmit: SubmitHandler<LoginFormData>;
}

const LoginForm = ({ methods, onSubmit }: LoginFormProps): ReactElement => (
  <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Email
        </label>
        <Input
          id="email"
          type="email"
          placeholder="demo@accubooks.com"
          data-testid="input-email"
          {...methods.register("email")}
        />
        {methods.formState.errors.email && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {methods.formState.errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Password
        </label>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          data-testid="input-password"
          {...methods.register("password")}
        />
        {methods.formState.errors.password && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {methods.formState.errors.password.message}
          </p>
        )}
      </div>

      <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
        <p className="font-medium mb-1">Demo Credentials:</p>
        <p>Email: demo@accubooks.com</p>
        <p>Password: Demo123!</p>
      </div>
    </CardContent>

    <CardFooter className="flex flex-col gap-4">
      <Button
        type="submit"
        className="w-full"
        disabled={methods.formState.isSubmitting}
        data-testid="button-login"
      >
        {methods.formState.isSubmitting ? "Signing in..." : "Sign In"}
      </Button>

      <p className="text-sm text-center text-muted-foreground">
        Don&apos;t have an account?{" "}
        <a
          href="/register"
          className="text-primary hover:underline"
          data-testid="link-register"
        >
          Register
        </a>
      </p>
    </CardFooter>
  </form>
);

export default function Login() {
  const { login } = useAuthStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const methods = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    try {
      await login(data.email, data.password);
      toast({
        title: "Success",
        description: "You have been logged in successfully!",
        variant: "default",
      });
      setLocation("/dashboard");
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to log in",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <div className="h-14 w-14 rounded-lg bg-primary flex items-center justify-center">
              <Wallet className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <div className="text-center">
            <CardTitle className="text-2xl">Welcome to AccuBooks</CardTitle>
            <CardDescription className="mt-2">
              Professional accounting software for your business
            </CardDescription>
          </div>
        </CardHeader>

        <LoginForm methods={methods} onSubmit={onSubmit} />
      </Card>
    </div>
  );
}
