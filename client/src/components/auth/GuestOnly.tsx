"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface GuestOnlyProps {
  children: React.ReactNode;
}

export default function GuestOnly({ children }: GuestOnlyProps) {
  const { user, loading, initialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && initialized && user) {
      router.replace("/dashboard");
    }
  }, [initialized, loading, router, user]);

  if (!initialized || loading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-6">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Checking authentication...
        </p>
      </main>
    );
  }

  if (user) {
    return null;
  }

  return <>{children}</>;
}
