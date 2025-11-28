'use client';

import { signOut } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignOutPage() {
  const router = useRouter();

  useEffect(() => {
    const handleSignOut = async () => {
      await signOut({
        redirect: false,
        callbackUrl: '/auth/signin',
      });
      router.push('/auth/signin');
    };

    handleSignOut();
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="animate-pulse text-lg">Signing out...</div>
    </div>
  );
}
