"use client";

import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import * as React from "react";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  React.useEffect(() => {
    if (isLoading || !user) return;

    if (!user.hasActiveSubscription) {
      router.replace(`/accounts/${user.id}/plans/`);
      return;
    }

    if (!user.provinceId || !user.sectionId) {
      router.replace(`/accounts/${user.id}/onboarding`);
      return;
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <main className="flex min-h-svh items-center justify-center">
        <Spinner />
      </main>
    );
  }

  return <>{children}</>;
}
