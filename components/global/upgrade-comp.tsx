"use client";

import { toast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/api";
import { paymentService, plansService } from "@/lib/auth/auth.service";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  CheckCircle2,
  Crown,
  Loader2,
  Lock,
  Phone,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Telecom = "AM" | "OM" | "MP" | "AF" | "";
type ModalStep = "payment" | "polling" | "success";

interface PlanPrice {
  id: string;
  planId: string;
  currency: string;
  price: number;
}

interface Plan {
  id: string;
  type: string;
  name: string;
  description: string | null;
  price: number;
  questionsPerDay: number | null;
  totalQuestions: number | null;
  isActive: boolean;
  prices: PlanPrice[];
}

interface UpgradeModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

function telecomLabel(t: Telecom): string {
  return (
    {
      AM: "Airtel Money",
      OM: "Orange Money",
      MP: "M-Pesa",
      AF: "Afrimoney",
      "": "Détection auto",
    }[t] ?? t
  );
}

export function UpgradeModal({ onClose, onSuccess }: UpgradeModalProps) {
  const [step, setStep] = useState<ModalStep>("payment");
  const [currency, setCurrency] = useState<"USD" | "CDF">("USD");
  const [phone, setPhone] = useState("");
  const [telecom, setTelecom] = useState<Telecom>("");
  const [submitting, setSubmitting] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [successData, setSuccessData] = useState<{
    expires: string;
    amount: string;
  } | null>(null);

  // ── Plan fetching ──────────────────────────────────────────────────────────
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [planError, setPlanError] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Fetch the paid plan on mount
  useEffect(() => {
    const fetchPaidPlan = async () => {
      setLoadingPlan(true);
      setPlanError(false);
      try {
        const res = await plansService.getPlans();
        const plans: Plan[] = res.data.data.plans;
        const paid = plans.find((p) => p.type === "paid" && p.isActive);
        if (!paid) throw new Error("No paid plan found");
        if (mountedRef.current) setPlan(paid);
      } catch {
        if (mountedRef.current) setPlanError(true);
      } finally {
        if (mountedRef.current) setLoadingPlan(false);
      }
    };

    fetchPaidPlan();
  }, []);

  const priceObj = plan?.prices.find((p) => p.currency === currency);

  const currentPrice = priceObj
    ? currency === "USD"
      ? `${priceObj.price.toFixed(2)} USD`
      : `${priceObj.price.toLocaleString("fr-FR")} CDF`
    : "—";

  // ── Payment ────────────────────────────────────────────────────────────────
  const handlePay = async () => {
    if (!plan || !phone.trim()) return;
    setSubmitting(true);

    try {
      const chargeResult = await toast.promise(
        paymentService.initiateCharge({
          planId: plan.id,
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
          error: (err: unknown) => ({
            title: "Erreur",
            description:
              err instanceof ApiError
                ? err.message
                : "Une erreur est survenue.",
          }),
        },
      );

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
          .catch(() => {});
      }

      setStep("polling");
      startPolling();
    } catch {
      // handled by toast
    } finally {
      if (mountedRef.current) setSubmitting(false);
    }
  };

  // ── Polling ────────────────────────────────────────────────────────────────
  const startPolling = () => {
    let attempts = 0;

    pollRef.current = setInterval(async () => {
      attempts++;
      if (mountedRef.current) setPollCount(attempts);

      if (attempts > 20) {
        clearInterval(pollRef.current!);
        toast.error({
          title: "Délai dépassé",
          description: "Le paiement n'a pas été confirmé.",
        });
        if (mountedRef.current) setStep("payment");
        return;
      }

      try {
        const data = await paymentService.getMySubscription();
        const sub = data.data.data.subscription;

        if (sub?.status === "active") {
          clearInterval(pollRef.current!);
          const activePriceObj = plan?.prices.find(
            (p) => p.currency === currency,
          );
          if (mountedRef.current) {
            setSuccessData({
              amount: activePriceObj
                ? `${activePriceObj.price.toFixed(2)} ${currency}`
                : "—",
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
        }
      } catch {
        //
      }
    }, 4000);
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  const renderLoadingOrError = () => (
    <div className="px-5 py-8 flex flex-col items-center gap-4 text-center">
      {loadingPlan ? (
        <>
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Chargement du plan…</p>
        </>
      ) : (
        <>
          <p className="text-sm font-semibold text-foreground">
            Plan introuvable
          </p>
          <p className="text-xs text-muted-foreground">
            Impossible de charger le plan Premium.
          </p>
          <button
            onClick={onClose}
            className="text-xs text-primary underline underline-offset-2"
          >
            Fermer
          </button>
        </>
      )}
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
        {/* SUCCESS */}
        {step === "success" && (
          <div className="p-6 text-center space-y-5">
            <div className="mx-auto size-16 rounded-full bg-teal-500/10 flex items-center justify-center">
              <CheckCircle2 className="size-8 text-teal-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Abonnement activé !
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Vous avez maintenant accès à toutes les questions.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-4 text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-medium text-foreground">
                  {plan?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Montant</span>
                <span className="font-medium text-foreground">
                  {successData?.amount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valide jusqu'au</span>
                <span className="font-medium text-foreground">
                  {successData?.expires}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                onSuccess?.();
                onClose();
              }}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
            >
              Continuer
              <ArrowRight className="size-4" />
            </button>
          </div>
        )}

        {/* POLLING */}
        {step === "polling" && (
          <div className="p-6 text-center space-y-5">
            <div className="mx-auto size-16 rounded-full border-2 border-primary/30 flex items-center justify-center animate-pulse">
              <Phone className="size-8 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                En attente de confirmation
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Confirmez le paiement sur votre téléphone
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-4 text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Numéro</span>
                <span className="font-medium text-foreground">{phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Opérateur</span>
                <span className="font-medium text-foreground">
                  {telecomLabel(telecom)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Montant</span>
                <span className="font-medium text-foreground">
                  {currentPrice}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Vérification {pollCount}/20…
            </p>
            <button
              onClick={() => {
                if (pollRef.current) clearInterval(pollRef.current);
                setStep("payment");
              }}
              className="text-xs text-muted-foreground underline underline-offset-2"
            >
              Annuler
            </button>
          </div>
        )}

        {/* PAYMENT */}
        {step === "payment" && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                  <Crown className="size-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    Passer à Premium
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Questions illimitées
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Loading / error state */}
            {(loadingPlan || planError) && renderLoadingOrError()}

            {/* Plan loaded */}
            {!loadingPlan && !planError && plan && (
              <>
                {/* Plan summary */}
                <div className="px-5 py-3 border-b border-border bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      {[
                        "Questions illimitées chaque jour",
                        "Accès à tous les cours",
                        "Suivi de progression avancé",
                      ].map((f) => (
                        <div key={f} className="flex items-center gap-2">
                          <Sparkles className="size-3 text-primary shrink-0" />
                          <span className="text-[11px] text-muted-foreground">
                            {f}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xl font-bold text-foreground tabular-nums">
                        {plan.prices
                          .find((p) => p.currency === "USD")
                          ?.price.toFixed(2) ?? "—"}
                        $
                      </p>
                      <p className="text-[11px] text-muted-foreground">/ an</p>
                    </div>
                  </div>
                </div>

                {/* Form */}
                <div className="px-5 py-4 space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">
                      Devise
                    </label>
                    <select
                      value={currency}
                      onChange={(e) =>
                        setCurrency(e.target.value as "USD" | "CDF")
                      }
                      className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="USD">USD — Dollar américain</option>
                      <option value="CDF">CDF — Franc congolais</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">
                      Numéro Mobile Money
                    </label>
                    <input
                      type="tel"
                      placeholder="+243 8X XXX XXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">
                      Opérateur
                    </label>
                    <select
                      value={telecom}
                      onChange={(e) => setTelecom(e.target.value as Telecom)}
                      className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">Détection automatique</option>
                      <option value="AM">Airtel Money</option>
                      <option value="OM">Orange Money</option>
                      <option value="MP">M-Pesa</option>
                      <option value="AF">Afrimoney</option>
                    </select>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/20 px-3 py-2.5 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-semibold text-foreground">
                      {currentPrice}
                    </span>
                  </div>

                  <button
                    onClick={handlePay}
                    disabled={!phone.trim() || submitting}
                    className={cn(
                      "w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5",
                      "text-sm font-semibold transition-all",
                      "focus:outline-none focus:ring-2 focus:ring-primary/30",
                      phone.trim() && !submitting
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-muted text-muted-foreground cursor-not-allowed",
                    )}
                  >
                    {submitting ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Lock className="size-3.5" />
                    )}
                    {submitting ? "Initiation…" : "Payer maintenant"}
                  </button>

                  <p className="text-center text-[10px] text-muted-foreground">
                    Paiement sécurisé via SerdiPay · Mobile Money
                  </p>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
