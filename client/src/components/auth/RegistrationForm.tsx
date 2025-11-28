import { type ReactElement } from 'react';
import { useForm, type UseFormReturn, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { CardContent, CardFooter } from '../components/ui/card';
import { type RegisterFormData, registerSchema } from '../lib/validations/schemas';
import { useToast } from '../hooks/use-toast';

interface RegistrationFormProps {
  onSubmit: (data: RegisterFormData) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function RegistrationForm({
  onSubmit,
  isLoading,
  error,
  clearError,
}: RegistrationFormProps): ReactElement {
  const { toast } = useToast();
  
  const methods = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onFormSubmit: SubmitHandler<RegisterFormData> = async (data) => {
    try {
      clearError();
      await onSubmit(data);
      toast({
        title: 'Registration successful!',
        description: 'Your account has been created.',
      });
    } catch (error) {
      // Error is handled by the parent component
      console.error('Registration error:', error);
    }
  };

  return (
    <form onSubmit={methods.handleSubmit(onFormSubmit)} className="space-y-4">
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Full Name
          </label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            data-testid="input-name"
            disabled={isLoading}
            {...methods.register('name')}
          />
          {methods.formState.errors.name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {methods.formState.errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Email Address
          </label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            data-testid="input-email"
            disabled={isLoading}
            {...methods.register('email')}
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
            placeholder="••••••••"
            data-testid="input-password"
            disabled={isLoading}
            {...methods.register('password')}
          />
          {methods.formState.errors.password && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {methods.formState.errors.password.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Confirm Password
          </label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            data-testid="input-confirm-password"
            disabled={isLoading}
            {...methods.register('confirmPassword')}
          />
          {methods.formState.errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {methods.formState.errors.confirmPassword.message}
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-4">
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || methods.formState.isSubmitting}
          data-testid="button-register"
        >
          {isLoading || methods.formState.isSubmitting
            ? 'Creating account...'
            : 'Create Account'}
        </Button>

        <p className="text-sm text-center text-muted-foreground">
          By creating an account, you agree to our{' '}
          <a href="#" className="text-primary hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="text-primary hover:underline">
            Privacy Policy
          </a>
          .
        </p>
      </CardFooter>
    </form>
  );
}
