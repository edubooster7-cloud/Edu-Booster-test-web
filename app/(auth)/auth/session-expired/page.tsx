import { Button } from "@/components/ui/button";
import { AUTH_PAGES } from "@/lib/auth/auth.constants";
import { Home, LogIn, ShieldOff } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Session expirée | EduBooster",
  description:
    "Votre session a expiré pour des raisons de sécurité. Veuillez vous reconnecter pour accéder à votre espace.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SessionExpiredPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="flex flex-col items-center gap-6 text-center max-w-xs w-full">
        <div className="rounded-full bg-destructive/10 p-5 text-destructive">
          <ShieldOff className="size-8" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold tracking-tight">Session expirée</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Votre session a expiré ou n&apos;est plus valide. Veuillez vous
            reconnecter pour continuer.
          </p>
        </div>

        <Button asChild className="w-full gap-2">
          <Link href={AUTH_PAGES.LOGIN}>
            <LogIn className="size-4" />
            Se reconnecter
          </Link>
        </Button>

        <Button asChild variant="ghost" className="w-full gap-2">
          <Link href="/">
            <Home className="size-4 -mt-1" />
            Retour à l'accueil
          </Link>
        </Button>
      </div>
    </main>
  );
}
