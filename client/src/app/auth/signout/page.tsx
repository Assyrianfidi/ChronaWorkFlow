"use client";

import { LoadingState } from "@/components/ui/LoadingState";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

export default function SignOutPage() {
  const router = useRouter();
  const { logout } = useAuthStore();

  useEffect(() => {
    const handleSignOut = async () => {
      logout();
      router.push("/auth/signin");
    };

    handleSignOut();
  }, [router]);

  return <LoadingState size="sm" />;
}
