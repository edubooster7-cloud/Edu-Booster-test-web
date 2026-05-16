"use client";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/api";
import { APP_PAGES, AUTH_PAGES } from "@/lib/auth/auth.constants";
import { cn } from "@/lib/utils";
import { useGoogleLogin } from "@react-oauth/google";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import Logo from "../global/logo";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const { login, googleLogin } = useAuth();

  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement)
      .value;

    setIsLoading(true);

    // Wrap in try/catch so the rejection is always within a caught async
    // context — prevents Next.js / Turbopack from surfacing it as an
    // unhandledRejection in the dev overlay before toast.promise catches it.
    try {
      await toast.promise(login({ email, password }), {
        loading: "Connexion en cours…",
        success: (user) => {
          // Navigation will unmount the component, so we intentionally
          // leave isLoading=true to keep the button disabled while redirecting.
          if (!user.isEmailVerified) {
            router.push(
              `${AUTH_PAGES.VERIFY_EMAIL}?email=${encodeURIComponent(email)}`,
            );
          } else {
            router.push(APP_PAGES.DASHBOARD(user.id));
          }
          return {
            title: "Connecté !",
            description: `Bienvenue, ${user.name}.`,
          };
        },
        error: (err: unknown) => {
          // Only reset loading on failure — the form stays usable.
          setIsLoading(false);

          if (err instanceof ApiError) {
            if (err.payload.requiresVerification) {
              router.push(
                `${AUTH_PAGES.VERIFY_EMAIL}?email=${encodeURIComponent(email)}`,
              );
            }
            return {
              title: "Échec de la connexion",
              description: err.message,
            };
          }
          return {
            title: "Échec de la connexion",
            description: "Une erreur inattendue est survenue.",
          };
        },
      });
    } catch {
      // Errors are already handled inside toast.promise's error callback.
      // This catch exists solely to prevent unhandledRejection in dev mode.
    }
  };

  const handleGoogle = useGoogleLogin({
    flow: "auth-code",
    onSuccess: async ({ code }) => {
      setIsLoading(true);
      try {
        await toast.promise(googleLogin(code), {
          loading: "Connexion avec Google…",
          success: (user) => {
            if (!user.isEmailVerified) {
              router.push(
                `${AUTH_PAGES.VERIFY_EMAIL}?email=${encodeURIComponent(user.email)}`,
              );
            } else {
              router.push(APP_PAGES.DASHBOARD(user.id));
            }
            return {
              title: "Connecté !",
              description: `Bienvenue, ${user.name}.`,
            };
          },
          error: (err: unknown) => {
            setIsLoading(false);
            if (err instanceof ApiError) {
              if (err.payload?.errorType === "ACCOUNT_DELETED") {
                router.push(err.payload.redirectTo ?? "/");
              }
              return {
                title: "Échec de la connexion",
                description: err.message,
              };
            }
            return {
              title: "Échec de la connexion",
              description: "Une erreur inattendue est survenue.",
            };
          },
        });
      } catch {
        // handled above
      }
    },
    onError: () => {
      toast.error({
        title: "Échec de la connexion",
        description: "Impossible de se connecter avec Google.",
      });
      setIsLoading(false);
    },
  });

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="flex flex-col">
            <Logo />
            <h1 className="text-xl font-bold">Connexion</h1>
            <FieldDescription>
              Bienvenue sur EduBooster. Connectez-vous pour continuer.
            </FieldDescription>
          </div>

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
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
              <Link
                href={AUTH_PAGES.FORGOT_PASSWORD}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Mot de passe oublié ?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="pr-10"
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                disabled={isLoading}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors disabled:pointer-events-none disabled:opacity-50"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </Field>

          <Field>
            <Button type="submit" className="w-full" disabled={isLoading}>
              Se connecter
            </Button>
          </Field>

          <FieldSeparator>Ou continuer avec</FieldSeparator>

          <Field>
            <Button
              variant="outline"
              type="button"
              className="w-full gap-2"
              disabled={isLoading}
              onClick={() => handleGoogle()}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="size-3 shrink-0"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Se connecter avec Google
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
}
