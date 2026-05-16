"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
export const dynamic = "force-dynamic";

const HomePage = () => {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      {user ? (
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-2xl font-semibold">{user.name}</h1>
          <p className="text-gray-500">{user.email}</p>
          <div className="flex gap-3">
            <Button
              onClick={() => router.push(`/accounts/${user.id}`)}
              className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              Tableau de bord
            </Button>
            <Button
              onClick={logout}
              className="px-5 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
            >
              Logout
            </Button>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => router.push("/auth/login")}
          className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          Login
        </Button>
      )}
    </div>
  );
};

export default HomePage;
