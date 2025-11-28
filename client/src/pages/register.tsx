import { useRouter } from 'next/router';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { useAuthStore } from '../store/auth-store';
import { RegistrationForm } from '../components/auth/RegistrationForm';
import { Wallet } from 'lucide-react';

export default function Register() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = async (data: { name: string; email: string; password: string }) => {
    try {
      await register({ name: data.name, email: data.email, password: data.password });
      router.push('/dashboard');
    } catch (err) {
      // Error is handled by the auth store and displayed in the form
      console.error('Registration error:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-14 w-14 rounded-lg bg-primary flex items-center justify-center">
              <Wallet className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link 
              href="/login" 
              className="font-medium text-primary hover:underline"
              data-testid="link-login"
            >
              Sign in here
            </Link>
          </p>
        </div>

        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>
              Enter your information to get started with AccuBooks
            </CardDescription>
          </CardHeader>

          <RegistrationForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
            clearError={clearError}
          />
        </Card>
      </div>
    </div>
  );
}
