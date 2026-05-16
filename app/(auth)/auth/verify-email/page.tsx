import { VerifyEmailForm } from "@/components/auth/verify-email-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vérification de l'email | EduBooster",
  description:
    "Veuillez saisir le code reçu par email pour confirmer votre inscription et activer votre compte.",
  robots: {
    index: false,
    follow: false,
  },
};

const VerifyEmailPage = () => {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6">
      <div className="w-full max-w-xs">
        <VerifyEmailForm />
      </div>
    </div>
  );
};

export default VerifyEmailPage;
