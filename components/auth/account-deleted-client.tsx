"use client";

import Logo from "@/components/global/logo";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/api";
import { AUTH_PAGES } from "@/lib/auth/auth.constants";
import { restoreService } from "@/lib/auth/auth.service";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as React from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "deleted" | "request" | "verify" | "success";

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepDeleted({
  daysRemaining,
  onRestore,
}: {
  daysRemaining: number;
  onRestore: () => void;
}) {
  const urgency = daysRemaining <= 7;

  return (
    <FieldGroup>
      <div className="flex flex-col">
        <Logo />
        <div
          className={cn(
            "mt-2 flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
            urgency
              ? "border-destructive/30 bg-destructive/5 text-destructive"
              : "border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400",
          )}
        >
          <Clock className="size-4 shrink-0" />
          <span>
            {urgency ? (
              <>
                <strong>Urgent —</strong> plus que{" "}
                <strong>
                  {daysRemaining} jour{daysRemaining > 1 ? "s" : ""}
                </strong>{" "}
                avant la suppression définitive.
              </>
            ) : (
              <>
                Votre compte sera définitivement supprimé dans{" "}
                <strong>
                  {daysRemaining} jour{daysRemaining > 1 ? "s" : ""}
                </strong>
                .
              </>
            )}
          </span>
        </div>

        <h1 className="mt-4 text-xl font-bold">Compte supprimé</h1>
        <FieldDescription>
          Votre compte EduBooster a été marqué pour suppression. Vous pouvez
          annuler cette action et restaurer votre compte avant l&apos;expiration
          du délai.
        </FieldDescription>
      </div>

      <div className="rounded-md border bg-muted/40 px-4 py-3 text-sm text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">Ce qui sera perdu :</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Votre historique de cours et scores</li>
          <li>Vos abonnements et factures</li>
          <li>Toutes vos données personnelles</li>
        </ul>
      </div>

      <Field>
        <Button className="w-full gap-2" onClick={onRestore}>
          <RefreshCw className="size-4" />
          Restaurer mon compte
        </Button>
      </Field>

      <Field>
        <p className="text-center text-xs text-muted-foreground">
          Vous avez changé d&apos;avis ?{" "}
          <Link
            href={AUTH_PAGES.LOGIN}
            className="text-foreground underline-offset-4 hover:underline transition-colors"
          >
            Retour à la connexion
          </Link>
        </p>
      </Field>
    </FieldGroup>
  );
}

function StepRequest({
  defaultEmail,
  onSuccess,
  onBack,
}: {
  defaultEmail: string;
  onSuccess: (email: string) => void;
  onBack: () => void;
}) {
  const [email, setEmail] = React.useState(defaultEmail);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await toast.promise(restoreService.requestRestore({ email }), {
        loading: "Envoi du code…",
        success: () => {
          onSuccess(email);
          return {
            title: "Code envoyé !",
            description: "Vérifiez votre boîte mail.",
          };
        },
        error: (err: unknown) => {
          setIsLoading(false);
          if (err instanceof ApiError) {
            return { title: "Erreur", description: err.message };
          }
          return {
            title: "Erreur",
            description: "Une erreur inattendue est survenue.",
          };
        },
      });
    } catch {
      // handled above
    }
  };

  return (
    <FieldGroup>
      <div className="flex flex-col">
        <Logo />
        <h1 className="text-xl font-bold">Restaurer le compte</h1>
        <FieldDescription>
          Saisissez l&apos;adresse email associée à votre compte. Nous vous
          enverrons un code de restauration.
        </FieldDescription>
      </div>

      <form onSubmit={handleSubmit} className="contents">
        <Field>
          <FieldLabel htmlFor="restore-email">Email</FieldLabel>
          <Input
            id="restore-email"
            name="email"
            type="email"
            placeholder="vous@exemple.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
          />
        </Field>

        <Field>
          <Button type="submit" className="w-full" disabled={isLoading}>
            Envoyer le code
          </Button>
        </Field>
      </form>

      <Field>
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors disabled:pointer-events-none disabled:opacity-50"
        >
          ← Retour
        </button>
      </Field>
    </FieldGroup>
  );
}

function StepVerify({
  email,
  onSuccess,
  onBack,
}: {
  email: string;
  onSuccess: () => void;
  onBack: () => void;
}) {
  const [code, setCode] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [resendCooldown, setResendCooldown] = React.useState(0);

  // Cooldown timer
  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(
      () => setResendCooldown((v) => Math.max(0, v - 1)),
      1000,
    );
    return () => clearInterval(t);
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await toast.promise(
        restoreService.restoreAccount({ email, code: code.trim() }),
        {
          loading: "Vérification du code…",
          success: () => {
            onSuccess();
            return {
              title: "Compte restauré !",
              description: "Vous pouvez maintenant vous reconnecter.",
            };
          },
          error: (err: unknown) => {
            setIsLoading(false);
            if (err instanceof ApiError) {
              return { title: "Erreur", description: err.message };
            }
            return {
              title: "Erreur",
              description: "Une erreur inattendue est survenue.",
            };
          },
        },
      );
    } catch {
      // handled above
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await toast.promise(restoreService.requestRestore({ email }), {
        loading: "Renvoi du code…",
        success: () => {
          setResendCooldown(60);
          return {
            title: "Code renvoyé !",
            description: "Vérifiez votre boîte mail.",
          };
        },
        error: (err: unknown) => {
          if (err instanceof ApiError) {
            return { title: "Erreur", description: err.message };
          }
          return {
            title: "Erreur",
            description: "Une erreur inattendue est survenue.",
          };
        },
      });
    } catch {
      // handled above
    }
  };

  return (
    <FieldGroup>
      <div className="flex flex-col">
        <Logo />
        <h1 className="text-xl font-bold">Vérification du code</h1>
        <FieldDescription>
          Un code à 6 caractères a été envoyé à{" "}
          <strong className="text-foreground">{email}</strong>. Saisissez-le
          ci-dessous pour confirmer la restauration.
        </FieldDescription>
      </div>

      <form onSubmit={handleSubmit} className="contents">
        <Field>
          <FieldLabel htmlFor="restore-code">Code de restauration</FieldLabel>
          <Input
            id="restore-code"
            name="code"
            type="text"
            placeholder="XXXXXX"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={6}
            disabled={isLoading}
            required
            className="tracking-widest text-center font-mono text-base"
            autoComplete="one-time-code"
          />
        </Field>

        <Field>
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || code.trim().length < 6}
          >
            Confirmer la restauration
          </Button>
        </Field>
      </form>

      <Field>
        <p className="text-center text-xs text-muted-foreground">
          Vous n&apos;avez pas reçu le code ?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || isLoading}
            className="text-foreground underline-offset-4 hover:underline transition-colors disabled:pointer-events-none disabled:opacity-50"
          >
            {resendCooldown > 0
              ? `Renvoyer dans ${resendCooldown}s`
              : "Renvoyer le code"}
          </button>
        </p>
      </Field>

      <Field>
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors disabled:pointer-events-none disabled:opacity-50"
        >
          ← Modifier l&apos;adresse email
        </button>
      </Field>
    </FieldGroup>
  );
}

function StepSuccess() {
  return (
    <FieldGroup>
      <div className="flex flex-col items-center text-center gap-3">
        <div className="flex size-14 items-center justify-center rounded-full bg-green-500/10 text-green-500">
          <CheckCircle2 className="size-7" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Compte restauré !</h1>
          <FieldDescription className="mt-1">
            Votre compte EduBooster a été restauré avec succès. Toutes vos
            données sont à nouveau accessibles.
          </FieldDescription>
        </div>
      </div>

      <Field>
        <Button asChild className="w-full">
          <Link href={AUTH_PAGES.LOGIN}>Se connecter</Link>
        </Button>
      </Field>
    </FieldGroup>
  );
}

// ─── Main Component (Client) ──────────────────────────────────────────────────

export function AccountDeletedClient({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const searchParams = useSearchParams();

  const rawDays = parseInt(searchParams.get("daysRemaining") ?? "", 10);
  const daysRemaining = Math.max(0, isNaN(rawDays) ? 30 : rawDays);
  const prefillEmail = searchParams.get("email") ?? "";

  const [step, setStep] = React.useState<Step>("deleted");
  const [restoreEmail, setRestoreEmail] = React.useState(prefillEmail);

  return (
    <div
      className={cn(
        "flex min-h-screen w-full items-center justify-center p-4",
        className,
      )}
      {...props}
    >
      <div className="w-full max-w-md">
        {step === "deleted" && (
          <StepDeleted
            daysRemaining={daysRemaining}
            onRestore={() => setStep("request")}
          />
        )}

        {step === "request" && (
          <StepRequest
            defaultEmail={restoreEmail}
            onSuccess={(email) => {
              setRestoreEmail(email);
              setStep("verify");
            }}
            onBack={() => setStep("deleted")}
          />
        )}

        {step === "verify" && (
          <StepVerify
            email={restoreEmail}
            onSuccess={() => setStep("success")}
            onBack={() => setStep("request")}
          />
        )}

        {step === "success" && <StepSuccess />}
      </div>
    </div>
  );
}
