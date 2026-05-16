"use client";

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
import { userService } from "@/lib/auth/auth.service";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  MailCheck,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import Logo from "../global/logo";

type Step = "email" | "code" | "reset" | "success";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [step, setStep] = React.useState<Step>("email");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [code, setCode] = React.useState("");

  // ── STEP: EMAIL ──────────────────────────────────────────────────────────────
  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const emailValue = (form.elements.namedItem("email") as HTMLInputElement)
      .value;

    setIsLoading(true);
    try {
      await toast.promise(userService.forgotPassword({ email: emailValue }), {
        loading: "Envoi du code…",
        success: {
          title: "Code envoyé !",
          description: "Vérifiez votre boîte mail.",
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
      setEmail(emailValue);
      setStep("code");
    } catch {
      // handled by toast
    } finally {
      setIsLoading(false);
    }
  };

  // ── STEP: RESEND ─────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (!email) return;
    setIsLoading(true);
    try {
      await toast.promise(userService.forgotPassword({ email }), {
        loading: "Renvoi du code…",
        success: {
          title: "Code renvoyé !",
          description: "Vérifiez votre boîte mail.",
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
      // handled by toast
    } finally {
      setIsLoading(false);
    }
  };

  // ── STEP: RESET ───────────────────────────────────────────────────────────────
  const handleResetSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const password = (form.elements.namedItem("password") as HTMLInputElement)
      .value;
    const confirmPassword = (
      form.elements.namedItem("confirmPassword") as HTMLInputElement
    ).value;

    if (password !== confirmPassword) {
      toast.error({
        title: "Mots de passe différents",
        description: "Les deux mots de passe ne correspondent pas.",
      });
      return;
    }

    setIsLoading(true);
    try {
      await toast.promise(
        userService.resetPassword({ email, code, password }),
        {
          loading: "Réinitialisation…",
          success: {
            title: "Mot de passe mis à jour !",
            description: "Vous pouvez maintenant vous connecter.",
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
        },
      );
      setStep("success");
    } catch {
      // handled by toast
    } finally {
      setIsLoading(false);
    }
  };

  // ── STEP: SUCCESS ─────────────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <FieldGroup className="items-center text-center">
          <div className="flex items-center justify-center size-12 rounded-full bg-primary/10 text-primary mb-2">
            <CheckCircle2 className="size-6" />
          </div>
          <h1 className="text-xl font-bold">Mot de passe réinitialisé</h1>
          <FieldDescription>
            Votre mot de passe a été mis à jour. Vous pouvez maintenant vous
            connecter.
          </FieldDescription>
          <Button asChild className="w-full mt-2">
            <Link href="/auth/login">Se connecter</Link>
          </Button>
        </FieldGroup>
      </div>
    );
  }

  // ── STEP: NEW PASSWORD ────────────────────────────────────────────────────────
  if (step === "reset") {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <form onSubmit={handleResetSubmit}>
          <FieldGroup>
            <div className="flex flex-col items-center gap-4 text-center">
              <Logo />
              <div className="space-y-1">
                <h1 className="text-xl font-bold">Nouveau mot de passe</h1>
                <FieldDescription className="text-center">
                  Choisissez un mot de passe robuste pour protéger votre compte.
                </FieldDescription>
              </div>
            </div>

            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={isLoading}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:pointer-events-none"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                disabled={isLoading}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="confirmPassword">
                Confirmer le mot de passe
              </FieldLabel>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                disabled={isLoading}
                required
              />
            </Field>

            <Field>
              <Button type="submit" className="w-full" disabled={isLoading}>
                Enregistrer le mot de passe
              </Button>
            </Field>

            <div className="rounded-lg border bg-muted/40 p-3">
              <div className="flex items-start gap-2">
                <ShieldCheck className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Votre nouveau mot de passe doit comporter au moins 8
                  caractères.
                </p>
              </div>
            </div>
          </FieldGroup>
        </form>
      </div>
    );
  }

  // ── STEP: VERIFICATION CODE ───────────────────────────────────────────────────
  if (step === "code") {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <FieldGroup className="items-center text-center">
          <div className="flex items-center justify-center size-12 rounded-full bg-primary/10 text-primary mb-2">
            <MailCheck className="size-6" />
          </div>
          <h1 className="text-xl font-bold">Vérifiez votre boîte mail</h1>
          <FieldDescription>
            Nous avons envoyé un code de réinitialisation à votre adresse email.
          </FieldDescription>
        </FieldGroup>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const tokenValue = (
              form.elements.namedItem("code") as HTMLInputElement
            ).value;
            setCode(tokenValue);
            setStep("reset");
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="code">Code de vérification</FieldLabel>
              <Input
                id="code"
                name="code"
                type="text"
                placeholder="Ex: A1B2C3"
                required
                disabled={isLoading}
                className="tracking-widest text-center font-mono uppercase"
              />
            </Field>

            <Field>
              <Button type="submit" className="w-full" disabled={isLoading}>
                Continuer
              </Button>
            </Field>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <button
                type="button"
                onClick={handleResend}
                disabled={isLoading}
                className="hover:text-foreground transition-colors underline underline-offset-4 disabled:pointer-events-none disabled:opacity-50"
              >
                Renvoyer le code
              </button>
              <button
                type="button"
                onClick={() => setStep("email")}
                disabled={isLoading}
                className="hover:text-foreground transition-colors underline underline-offset-4 disabled:pointer-events-none disabled:opacity-50"
              >
                Changer d'adresse
              </button>
            </div>
          </FieldGroup>
        </form>
      </div>
    );
  }

  // ── STEP: EMAIL (DEFAULT) ─────────────────────────────────────────────────────
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleEmailSubmit}>
        <FieldGroup>
          <div className="flex flex-col justify-between">
            <Logo />
            <h1 className="text-xl font-bold">Récupération</h1>
          </div>

          <FieldDescription>
            Entrez votre adresse email pour recevoir un code de
            réinitialisation.
          </FieldDescription>

          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="vous@exemple.com"
              disabled={isLoading}
              required
            />
          </Field>

          <Field>
            <Button type="submit" className="w-full" disabled={isLoading}>
              Réinitialiser le mot de passe
            </Button>
          </Field>

          <FieldDescription className="text-xs mt-2">
            Un code sécurisé vous sera envoyé pour réinitialiser votre compte.
          </FieldDescription>
        </FieldGroup>
      </form>
    </div>
  );
}
