import { AuthCarousel } from "@/components/auth/register-carousel";
import { SignupForm } from "@/components/auth/register-form";
import { Metadata } from "next";
import { Suspense } from "react";

import Link from "next/link";

export const metadata: Metadata = {
  title: "Créer un compte | EduBooster",
  description:
    "Rejoignez EduBooster dès aujourd'hui pour accéder à vos cours et booster vos compétences.",
  openGraph: {
    title: "Créer un compte | EduBooster",
    description:
      "Rejoignez EduBooster dès aujourd'hui pour accéder à vos cours et booster vos compétences.",
  },
};

const RegisterScreen = () => {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <Suspense fallback={null}>
              <SignupForm />
            </Suspense>
          </div>
        </div>
        <footer className="flex w-full items-center justify-center pt-6 pb-2">
          <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium tracking-tight">
            <Link
              href="/terms"
              className="hover:text-primary transition-colors"
            >
              Conditions d&apos;utilisation
            </Link>
            <Link
              href="/privacy"
              className="hover:text-primary transition-colors"
            >
              Politique de confidentialité
            </Link>
          </div>
        </footer>
      </div>

      <AuthCarousel />
    </div>
  );
};

export default RegisterScreen;
