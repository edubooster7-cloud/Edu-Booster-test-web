"use client";

import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/use-auth";
import { APP_PAGES } from "@/lib/auth/auth.constants";
import { AuthProvider } from "@/lib/auth/auth.context";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";

const AUTH_TERMINAL_PAGES = ["/auth/session-expired", "/auth/account-deleted"];

function AuthLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuth();

  const isTerminal = AUTH_TERMINAL_PAGES.some((p) => pathname.startsWith(p));

  React.useEffect(() => {
    if (isTerminal) return;
    if (!isLoading && isAuthenticated && user) {
      router.replace(APP_PAGES.DASHBOARD(user.id));
    }
  }, [isLoading, isAuthenticated, user, router, isTerminal]);

  if (!isTerminal && (isLoading || isAuthenticated)) {
    return (
      <main className="flex min-h-svh items-center justify-center animate-pulse">
        <Spinner />
      </main>
    );
  }

  return <main>{children}</main>;
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AuthLayoutInner>{children}</AuthLayoutInner>
    </AuthProvider>
  );
}
