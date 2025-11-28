import { Button } from '../ui/button';
import { Icons } from '../icons';
import { signIn } from 'next-auth/react';

export function SocialLogin() {
  const handleSocialLogin = async (provider: 'google' | 'github') => {
    try {
      await signIn(provider, { callbackUrl: '/dashboard' });
    } catch (error) {
      console.error('Social login error:', error);
    }
  };

  return (
    <div className="grid gap-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          type="button"
          onClick={() => handleSocialLogin('google')}
          className="flex items-center justify-center gap-2"
        >
          <Icons.google className="h-4 w-4" />
          Google
        </Button>
        <Button
          variant="outline"
          type="button"
          onClick={() => handleSocialLogin('github')}
          className="flex items-center justify-center gap-2"
        >
          <Icons.github className="h-4 w-4" />
          GitHub
        </Button>
      </div>
    </div>
  );
}
