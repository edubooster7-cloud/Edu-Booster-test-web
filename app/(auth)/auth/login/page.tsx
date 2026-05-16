import { LoginForm } from "@/components/auth/login-form";
import { FieldDescription } from "@/components/ui/field";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Connexion - Connectez-vous à votre compte",
  description:
    "Connectez-vous à votre compte pour accéder à tous nos services.",
  robots: {
    index: false,
    follow: true,
  },
};

const LoginScreen = () => {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex w-full justify-end p-6 md:p-10">
        <FieldDescription className="text-xs">
          Vous n&apos;avez pas de compte ?{" "}
          <Link
            href="/auth/register"
            className="font-medium text-primary hover:underline"
          >
            S&apos;inscrire
          </Link>
        </FieldDescription>
      </header>
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-xs">
          <LoginForm />
        </div>
      </main>
      <footer className="flex w-full items-center justify-center p-6 pb-10">
        <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium tracking-tight">
          <Link href="/terms" className="hover:text-primary">
            Conditions d'utilisation
          </Link>
          <Link href="/privacy" className="hover:text-primary">
            Politique de confidentialité
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default LoginScreen;
