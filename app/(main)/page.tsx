"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
export const dynamic = "force-dynamic";

const HomePage = () => {
  const router = useRouter();

  return (
    <Button
      onClick={() => router.push("/auth/login")}
      className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
    >
      Login
    </Button>
  );
};

export default HomePage;
