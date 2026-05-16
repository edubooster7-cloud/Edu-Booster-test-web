import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { FieldDescription } from "@/components/ui/field";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mot de passe oublié | EduBooster",
  description:
    "Entrez votre adresse email pour recevoir un lien de réinitialisation de votre mot de passe.",
  robots: {
    index: false,
    follow: true,
  },
};

const ForgotPassword = () => {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex w-full justify-end p-6 md:p-10">
        <FieldDescription className="text-xs">
          Vous vous souvenez de votre mot de passe ?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-foreground underline-offset-4 hover:underline hover:text-primary transition-colors"
          >
            Se connecter
          </Link>
        </FieldDescription>
      </header>
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-xs">
          <ForgotPasswordForm />
        </div>
      </main>
      <footer className="flex w-full items-center justify-center p-6 pb-10">
        <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium tracking-tight">
          <Link href="/terms" className="hover:text-primary">
            Conditions d'utilisation
          </Link>
          <Link href="/terms" className="hover:text-primary">
            Politique de confidentialité
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default ForgotPassword;
