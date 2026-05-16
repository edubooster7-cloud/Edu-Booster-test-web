"use client";

import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/use-auth";
import { AUTH_PAGES } from "@/lib/auth/auth.constants";
import { AuthProvider } from "@/lib/auth/auth.context";
import { SocketProvider } from "@/providers/SocketProvider";
import { useRouter } from "next/navigation";
import * as React from "react";

function ProtectedLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(AUTH_PAGES.LOGIN);
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <main className="flex min-h-svh items-center justify-center">
        <Spinner />
      </main>
    );
  }

  return <>{children}</>;
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <SocketProvider getToken={() => null}>
        <ProtectedLayoutInner>{children}</ProtectedLayoutInner>
      </SocketProvider>
    </AuthProvider>
  );
}
