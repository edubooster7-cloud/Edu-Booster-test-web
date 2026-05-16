"use client";

import Logo from "@/components/global/logo";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/api";
import { authService } from "@/lib/auth/auth.service";
import { cn } from "@/lib/utils";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

type Step = "verify" | "success";

export function VerifyEmailForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get("email") ?? "";

  const { verifyEmail } = useAuth();

  const [step, setStep] = React.useState<Step>("verify");
  const [value, setValue] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  // resend countdown
  const [countdown, setCountdown] = React.useState(60);

  React.useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (value.length !== 6) return;

    setIsLoading(true);

    try {
      await toast.promise(
        verifyEmail({
          email,
          code: value,
        }),
        {
          loading: "Vérification du code…",
          success: {
            title: "Email vérifié",
            description: "Votre compte a été confirmé avec succès.",
          },
          error: (err: unknown) => {
            if (err instanceof ApiError) {
              return {
                title: "Code invalide",
                description: err.message,
              };
            }

            return {
              title: "Erreur",
              description: "Impossible de vérifier votre email.",
            };
          },
        },
      );

      setStep("success");
    } catch {
      //
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;

    setIsLoading(true);

    try {
      await toast.promise(authService.resendCode({ email }), {
        loading: "Envoi du nouveau code…",
        success: {
          title: "Code envoyé",
          description: "Un nouveau code a été envoyé à votre email.",
        },
        error: {
          title: "Erreur",
          description: "Impossible d'envoyer un nouveau code.",
        },
      });

      setCountdown(60);
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "success") {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <FieldGroup className="items-center text-center">
          <div className="flex items-center justify-center size-12 rounded-full bg-primary/10 text-primary mb-2">
            <CheckCircle2 className="size-6" />
          </div>

          <h1 className="text-xl font-bold">Email vérifié !</h1>

          <FieldDescription>
            Votre adresse email a été confirmée avec succès.
          </FieldDescription>

          <Button asChild className="w-full mt-2">
            <Link href="/auth/login">Se connecter</Link>
          </Button>
        </FieldGroup>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="flex flex-col">
            <Logo />

            <div className="space-y-1">
              <h1 className="text-xl font-bold">Vérifiez votre email</h1>

              <FieldDescription>
                Un code de vérification à 6 chiffres a été envoyé à{" "}
                <span className="font-medium text-foreground">{email}</span>
              </FieldDescription>
            </div>
          </div>

          <Field>
            <FieldLabel htmlFor="otp" className="block w-full">
              Code de vérification
            </FieldLabel>

            <InputOTP
              id="otp"
              maxLength={6}
              value={value}
              onChange={setValue}
              autoFocus
              disabled={isLoading}
            >
              <InputOTPGroup className="w-full justify-between gap-2">
                <InputOTPSlot index={0} className="flex-1 h-9" />
                <InputOTPSlot index={1} className="flex-1 h-9" />
                <InputOTPSlot index={2} className="flex-1 h-9" />
                <InputOTPSlot index={3} className="flex-1 h-9" />
                <InputOTPSlot index={4} className="flex-1 h-9" />
                <InputOTPSlot index={5} className="flex-1 h-9" />
              </InputOTPGroup>
            </InputOTP>

            <FieldDescription className="text-xs mt-2">
              Vous pouvez coller le code reçu par email.
            </FieldDescription>
          </Field>

          <Field>
            <Button
              type="submit"
              className="w-full"
              disabled={value.length !== 6 || isLoading}
            >
              Vérifier l'email
            </Button>
          </Field>

          <div className="flex flex-col gap-4 text-xs">
            <p className="text-muted-foreground">
              Vous n'avez pas reçu de code ?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={countdown > 0 || isLoading}
                className="text-primary font-medium hover:underline disabled:opacity-50 disabled:no-underline"
              >
                {countdown > 0 ? `Renvoyer dans ${countdown}s` : "Renvoyer"}
              </button>
            </p>

            <Link
              href="/auth/register"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-3" />
              Changer d'adresse email
            </Link>
          </div>
        </FieldGroup>
      </form>
    </div>
  );
}
