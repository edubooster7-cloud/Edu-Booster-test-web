"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/api";
import { APP_PAGES } from "@/lib/auth/auth.constants";
import { paymentService, plansService } from "@/lib/auth/auth.service";
import { cn } from "@/lib/utils";
import { Plan } from "@/types/plans.types";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Lock,
  Phone,
  RefreshCw,
  Star,
  WifiOff,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";

type Step = "plans" | "payment" | "polling" | "success";
type Telecom = "AM" | "OM" | "MP" | "AF" | "";

export default function PlansPage() {
  const router = useRouter();
  const params = useParams();
  const { refreshUser } = useAuth();

  const [step, setStep] = React.useState<Step>("plans");
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = React.useState(true);
  const [plansError, setPlansError] = React.useState(false);
  const [selectedPlan, setSelectedPlan] = React.useState<Plan | null>(null);
  const [currency, setCurrency] = React.useState<"USD" | "CDF">("USD");
  const [phone, setPhone] = React.useState("");
  const [telecom, setTelecom] = React.useState<Telecom>("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [pollCount, setPollCount] = React.useState(0);
  const [successData, setSuccessData] = React.useState<{
    expires: string;
    amount: string;
  } | null>(null);

  const pollRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load plans ─────────────────────────────────────────────────────────────
  const loadPlans = React.useCallback(async () => {
    setIsLoadingPlans(true);
    setPlansError(false);

    try {
      const data = await plansService.getPlans();
      setPlans(data.data.data.plans.filter((p: Plan) => p.isActive));
    } catch {
      setPlansError(true);
    } finally {
      setIsLoadingPlans(false);
    }
  }, []);

  React.useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  // ── Handle plan selection & continue ──────────────────────────────────────
  const handleContinue = async () => {
    if (!selectedPlan) return;

    if (selectedPlan.type === "free") {
      setIsSubmitting(true);

      try {
        await toast.promise(paymentService.activateFreePlan(), {
          loading: "Activation en cours…",
          success: {
            title: "Plan activé !",
            description: "Bienvenue sur EduBooster.",
          },
          error: (err: unknown) => ({
            title: "Erreur",
            description:
              err instanceof ApiError
                ? err.message
                : "Une erreur est survenue.",
          }),
        });

        router.push(`/accounts/${params.userId}/onboarding`);
      } catch {
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    setStep("payment");
  };

  // ── Payment ────────────────────────────────────────────────────────────────
  // const handlePay = async () => {
  //   if (!selectedPlan || !phone) return;

  //   setIsSubmitting(true);

  //   try {
  //     await toast.promise(
  //       paymentService.initiateCharge({
  //         planId: selectedPlan.id,
  //         clientPhone: phone,
  //         currency,
  //         ...(telecom && { telecom }),
  //       }),
  //       {
  //         loading: "Initiation du paiement…",
  //         success: {
  //           title: "Demande envoyée !",
  //           description: "Confirmez sur votre téléphone.",
  //         },
  //         error: (err: unknown) => {
  //           if (err instanceof ApiError) {
  //             return {
  //               title: "Erreur",
  //               description: err.message,
  //             };
  //           }

  //           return {
  //             title: "Erreur",
  //             description: "Une erreur inattendue est survenue.",
  //           };
  //         },
  //       },
  //     );

  //     setStep("polling");
  //     startPolling();
  //   } catch {
  //     // handled by toast
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

  // ── Payment ────────────────────────────────────────────────────────────────
  const handlePay = async () => {
    if (!selectedPlan || !phone) return;

    setIsSubmitting(true);

    try {
      const chargeResult = await toast.promise(
        paymentService.initiateCharge({
          planId: selectedPlan.id,
          clientPhone: phone,
          currency,
          ...(telecom && { telecom }),
        }),
        {
          loading: "Initiation du paiement…",
          success: {
            title: "Demande envoyée !",
            description: "Confirmez sur votre téléphone.",
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

      // 🔧 DEV ONLY — simulate SerdiPay callback since payment is mocked
      const sessionId = chargeResult?.data?.data?.payment?.sessionId;
      if (sessionId) {
        await paymentService
          .simulateCallback({
            payment: {
              sessionId,
              status: "success",
              transactionId: `mock-txn-${Date.now()}`,
            },
          })
          .catch(() => {}); // fire and forget — don't block polling
      }

      setStep("polling");
      startPolling();
    } catch {
      // handled by toast
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Polling ────────────────────────────────────────────────────────────────
  const startPolling = () => {
    let attempts = 0;

    pollRef.current = setInterval(async () => {
      attempts++;
      setPollCount(attempts);

      if (attempts > 20) {
        if (pollRef.current) {
          clearInterval(pollRef.current);
        }

        toast.error({
          title: "Délai dépassé",
          description: "Le paiement n'a pas été confirmé.",
        });

        setStep("payment");
        return;
      }

      try {
        const data = await paymentService.getMySubscription();
        const sub = data.data.data.subscription;

        if (sub?.status === "active") {
          if (pollRef.current) {
            clearInterval(pollRef.current);
          }

          const priceObj = selectedPlan?.prices?.find(
            (p) => p.currency === currency,
          );

          setSuccessData({
            amount: priceObj ? `${priceObj.price.toFixed(2)} ${currency}` : "—",
            expires: sub.expiresAt
              ? new Date(sub.expiresAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "—",
          });

          setStep("success");
        }
      } catch {
        //
      }
    }, 4000);
  };

  React.useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, []);

  const priceObj = selectedPlan?.prices?.find((p) => p.currency === currency);

  // ── Go to dashboard ────────────────────────────────────────────────────────
  const handleDashboard = async () => {
    await refreshUser();
    router.push(APP_PAGES.DASHBOARD(params.userId as string));
  };

  // ── STEP: SUCCESS ──────────────────────────────────────────────────────────
  if (step === "success")
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="mx-auto size-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="size-8 text-green-600" />
          </div>

          <div>
            <h1 className="text-xl font-semibold">Paiement confirmé !</h1>

            <p className="text-sm text-muted-foreground mt-1">
              Votre abonnement est maintenant actif.
            </p>
          </div>

          <div className="bg-muted/40 rounded-xl p-4 text-sm text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan</span>
              <span>{selectedPlan?.name}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Montant</span>
              <span>{successData?.amount}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Valide jusqu'au</span>

              <span>{successData?.expires}</span>
            </div>
          </div>

          <Button className="w-full" onClick={handleDashboard}>
            Accéder au tableau de bord
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    );

  // ── STEP: POLLING ──────────────────────────────────────────────────────────
  if (step === "polling")
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="mx-auto size-16 rounded-full border-2 border-primary/30 flex items-center justify-center animate-pulse">
            <Phone className="size-8 text-primary" />
          </div>

          <div>
            <h1 className="text-xl font-semibold">
              En attente de confirmation
            </h1>

            <p className="text-sm text-muted-foreground mt-1">
              Confirmez le paiement sur votre téléphone
            </p>
          </div>

          <div className="bg-muted/40 rounded-xl p-4 text-sm text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Numéro</span>
              <span>{phone}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Opérateur</span>

              <span>
                {telecom
                  ? {
                      AM: "Airtel Money",
                      OM: "Orange Money",
                      MP: "M-Pesa",
                      AF: "Afrimoney",
                    }[telecom]
                  : "Détection auto"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Montant</span>

              <span>
                {priceObj ? `${priceObj.price.toFixed(2)} ${currency}` : "—"}
              </span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Vérification {pollCount}/20…
          </p>

          <button
            className="text-xs text-muted-foreground underline underline-offset-4"
            onClick={() => {
              if (pollRef.current) {
                clearInterval(pollRef.current);
              }

              setStep("payment");
            }}
          >
            Annuler
          </button>
        </div>
      </div>
    );

  // ── STEP: PAYMENT ──────────────────────────────────────────────────────────
  if (step === "payment")
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-5">
          <button
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setStep("plans")}
          >
            <ArrowLeft className="size-4" />
            Changer de plan
          </button>

          <h1 className="text-xl font-semibold">Paiement</h1>

          <div className="bg-muted/40 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{selectedPlan?.name}</p>

                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedPlan?.description}
                </p>
              </div>

              <p className="font-semibold">
                {priceObj ? `${priceObj.price.toFixed(2)} ${currency}` : "—"}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Devise
              </label>

              <select
                className="w-full h-10 rounded-lg border px-3 text-sm bg-background"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as "USD" | "CDF")}
              >
                <option value="USD">USD — Dollar américain</option>

                <option value="CDF">CDF — Franc congolais</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Numéro Mobile Money
              </label>

              <input
                className="w-full h-10 rounded-lg border px-3 text-sm bg-background"
                type="tel"
                placeholder="+243 8X XXX XXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Opérateur Mobile Money
              </label>

              <select
                className="w-full h-10 rounded-lg border px-3 text-sm bg-background"
                value={telecom}
                onChange={(e) => setTelecom(e.target.value as Telecom)}
              >
                <option value="">Détection automatique</option>

                <option value="AM">Airtel Money</option>
                <option value="OM">Orange Money</option>
                <option value="MP">M-Pesa</option>
                <option value="AF">Afrimoney</option>
              </select>
            </div>
          </div>

          <div className="border-t pt-4 space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Plan</span>
              <span>{selectedPlan?.name}</span>
            </div>

            <div className="flex justify-between text-muted-foreground">
              <span>Devise</span>
              <span>{currency}</span>
            </div>

            <div className="flex justify-between font-medium pt-2 border-t">
              <span>Total</span>

              <span>
                {priceObj ? `${priceObj.price.toFixed(2)} ${currency}` : "—"}
              </span>
            </div>
          </div>

          <Button
            className="w-full h-11"
            disabled={!phone || isSubmitting}
            onClick={handlePay}
          >
            <Lock className="size-4" />

            {isSubmitting ? "Initiation…" : "Payer maintenant"}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Paiement sécurisé via SerdiPay · Mobile Money
          </p>
        </div>
      </div>
    );

  // ── STEP: PLANS (DEFAULT) ──────────────────────────────────────────────────
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-5">
        <div>
          <h1 className="text-xl font-semibold">Choisissez votre plan</h1>

          <p className="text-sm text-muted-foreground mt-1">
            Accédez à tous les cours et questions de révision
          </p>
        </div>

        {isLoadingPlans && (
          <div className="flex items-center justify-center gap-3 py-8 text-muted-foreground text-sm">
            <RefreshCw className="size-4 animate-spin" />
            Chargement…
          </div>
        )}

        {plansError && (
          <div className="text-center py-8 space-y-3">
            <WifiOff className="size-9 mx-auto text-muted-foreground/40" />

            <p className="text-sm text-muted-foreground">
              Impossible de charger les plans
            </p>

            <Button variant="outline" size="sm" onClick={loadPlans}>
              <RefreshCw className="size-3.5" />
              Réessayer
            </Button>
          </div>
        )}

        {!isLoadingPlans && !plansError && plans.length === 0 && (
          <div className="text-center py-8 space-y-2">
            <p className="text-sm text-muted-foreground">
              Aucun plan disponible pour le moment
            </p>

            <p className="text-xs text-muted-foreground/60">
              Revenez plus tard ou contactez le support
            </p>
          </div>
        )}

        <div className="space-y-3">
          {plans.map((plan) => {
            const usdPrice = plan.prices?.find((p) => p.currency === "USD");

            const isPaid = plan.type === "paid";

            return (
              <div
                key={plan.id}
                className={cn(
                  "rounded-xl border p-4 cursor-pointer transition-all",
                  selectedPlan?.id === plan.id
                    ? "border-2 border-primary"
                    : "border hover:border-border/60",
                )}
                onClick={() => setSelectedPlan(plan)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    {isPaid && (
                      <span className="inline-flex items-center gap-1 text-[11px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full mb-1.5">
                        <Star className="size-2.5" />
                        Recommandé
                      </span>
                    )}

                    <p className="font-medium text-sm">{plan.name}</p>
                  </div>

                  <p className="font-semibold text-base">
                    {isPaid && usdPrice ? (
                      `$${usdPrice.price.toFixed(2)}`
                    ) : (
                      <span className="text-green-600 text-sm font-medium">
                        Gratuit
                      </span>
                    )}
                  </p>
                </div>

                {plan.description && (
                  <p className="text-xs text-muted-foreground mb-2">
                    {plan.description}
                  </p>
                )}

                <div className="border-t pt-2 space-y-1">
                  {plan.questionsPerDay && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="size-3.5 text-green-500" />
                      {plan.questionsPerDay} questions / jour
                    </div>
                  )}

                  {plan.totalQuestions && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="size-3.5 text-green-500" />
                      {plan.totalQuestions} questions au total
                    </div>
                  )}

                  {isPaid && (
                    <>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="size-3.5 text-green-500" />
                        Accès illimité
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="size-3.5 text-green-500" />
                        Toutes les matières
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {plans.length > 0 && (
          <Button
            className="w-full"
            disabled={!selectedPlan || isSubmitting}
            onClick={handleContinue}
          >
            Continuer
            <ArrowRight className="size-4" />
          </Button>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Paiement sécurisé via SerdiPay · Mobile Money
        </p>
      </div>
    </div>
  );
}
