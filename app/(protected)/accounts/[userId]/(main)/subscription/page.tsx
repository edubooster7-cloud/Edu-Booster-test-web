"use client";

import { UpgradeModal } from "@/components/global/upgrade-comp";
import { useAuth } from "@/hooks/use-auth";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  Crown,
  Gift,
  Infinity,
  Phone,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  XCircle,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type SubscriptionStatus = "active" | "expired" | "cancelled" | "pending";
type PlanType = "free" | "paid";
type Currency = "USD" | "CDF";

interface PlanPrice {
  id: string;
  planId: string;
  currency: Currency;
  price: number;
}

interface Plan {
  id: string;
  type: PlanType;
  name: string;
  description: string | null;
  price: number;
  questionsPerDay: number | null;
  totalQuestions: number | null;
  isActive: boolean;
  prices: PlanPrice[];
}

interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  startedAt: string;
  expiresAt: string | null;
  cancelledAt: string | null;
  renewedAt: string | null;
  paymentRef: string | null;
  paymentMethod: string | null;
  clientPhone: string | null;
  currency: string | null;
  createdAt: string;
  updatedAt: string;
  plan: Plan;
}

// ─── Service ──────────────────────────────────────────────────────────────────

const subscriptionService = {
  getMySubscription: () =>
    api.get<{ status: string; data: { subscription: Subscription | null } }>(
      "/payments/my-subscription",
    ),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null, withTime = false): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const date = d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  if (!withTime) return date;
  const time = d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} à ${time}`;
}

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("243") && digits.length === 12)
    return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  return raw;
}

function formatAmount(amount: number, currency: string): string {
  if (currency === "USD")
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  return `${amount.toLocaleString("fr-FR")} ${currency}`;
}

function getDaysRemaining(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function getProgressPercent(
  startedAt: string,
  expiresAt: string | null,
): number {
  if (!expiresAt) return 100;
  const start = new Date(startedAt).getTime();
  const end = new Date(expiresAt).getTime();
  const now = Date.now();
  const elapsed = now - start;
  const total = end - start;
  if (total <= 0) return 100;
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  SubscriptionStatus,
  { label: string; color: string; bg: string; icon: typeof CheckCircle2 }
> = {
  active: {
    label: "Actif",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    icon: CheckCircle2,
  },
  expired: {
    label: "Expiré",
    color: "text-red-500 dark:text-red-400",
    bg: "bg-red-500/10",
    icon: XCircle,
  },
  cancelled: {
    label: "Annulé",
    color: "text-orange-500 dark:text-orange-400",
    bg: "bg-orange-500/10",
    icon: XCircle,
  },
  pending: {
    label: "En attente",
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-500/10",
    icon: Clock,
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: SubscriptionStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        cfg.bg,
        cfg.color,
      )}
    >
      <Icon className="size-3.5" />
      {cfg.label}
    </span>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  valueClass,
}: {
  icon: typeof CreditCard;
  label: string;
  value: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-border/60 last:border-0">
      <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
        <Icon className="size-3.5 shrink-0" />
        {label}
      </div>
      <span
        className={cn(
          "text-xs font-medium text-foreground text-right",
          valueClass,
        )}
      >
        {value}
      </span>
    </div>
  );
}

function ProgressBar({
  percent,
  urgent,
}: {
  percent: number;
  urgent?: boolean;
}) {
  return (
    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
      <div
        className={cn(
          "h-full rounded-full transition-all duration-700",
          urgent
            ? "bg-orange-500"
            : percent > 60
              ? "bg-emerald-500"
              : "bg-primary",
        )}
        style={{ width: `${100 - percent}%` }}
      />
    </div>
  );
}

// ─── Free Plan Card ───────────────────────────────────────────────────────────

function FreePlanCard({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border bg-muted/20">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-muted border border-border">
              <Gift className="size-5 text-muted-foreground" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Plan Gratuit
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Aucun abonnement actif
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-muted text-muted-foreground">
            Gratuit
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5 space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Vous utilisez actuellement le plan gratuit. Passez à un abonnement
          Premium pour débloquer l'accès complet à toutes les questions et
          fonctionnalités.
        </p>

        <div className="rounded-xl border border-border bg-muted/20 divide-y divide-border overflow-hidden">
          {[
            { icon: Zap, text: "Questions limitées par jour" },
            { icon: ShieldCheck, text: "Accès aux cours de base" },
            { icon: BadgeCheck, text: "Suivi de progression standard" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 px-4 py-2.5">
              <Icon className="size-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">{text}</span>
            </div>
          ))}
        </div>

        <button
          onClick={onUpgrade}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.99] transition-all focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <Crown className="size-4" />
          Passer à Premium
        </button>
      </div>
    </div>
  );
}

// ─── Main Subscription Card ───────────────────────────────────────────────────

function SubscriptionCard({
  sub,
  onUpgrade,
}: {
  sub: Subscription;
  onUpgrade: () => void;
}) {
  const daysLeft = getDaysRemaining(sub.expiresAt);
  const progress = getProgressPercent(sub.startedAt, sub.expiresAt);
  const isActive = sub.status === "active";
  const isPaid = sub.plan.type === "paid";
  const isUrgent = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;
  const { user } = useAuth();
  const router = useRouter();

  const planPrice =
    sub.currency && sub.plan.prices.length > 0
      ? sub.plan.prices.find((p) => p.currency === sub.currency)
      : (sub.plan.prices[0] ?? null);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Hero header */}
      <div
        className={cn(
          "relative px-6 py-5 border-b border-border",
          isPaid ? "bg-primary/5" : "bg-muted/20",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-11 items-center justify-center rounded-xl border",
                isPaid
                  ? "bg-primary/10 border-primary/20 text-primary"
                  : "bg-muted border-border text-muted-foreground",
              )}
            >
              {isPaid ? (
                <Crown className="size-5" />
              ) : (
                <Gift className="size-5" />
              )}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-base font-bold text-foreground">
                  {sub.plan.name}
                </p>
                {isPaid && <Sparkles className="size-3.5 text-primary" />}
              </div>
              {sub.plan.description && (
                <p className="text-xs text-muted-foreground mt-0.5 max-w-55 truncate">
                  {sub.plan.description}
                </p>
              )}
            </div>
          </div>
          <StatusBadge status={sub.status} />
        </div>

        {/* Price — only for paid plans */}
        {isPaid && planPrice && (
          <div className="mt-4">
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {formatAmount(planPrice.price, planPrice.currency)}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                / an
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Expiry progress */}
      {isActive && sub.expiresAt && (
        <div className="px-6 py-4 border-b border-border bg-muted/10 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Clock className="size-3.5" />
              Temps restant
            </span>
            <span
              className={cn(
                "text-xs font-semibold tabular-nums",
                isUrgent
                  ? "text-orange-500"
                  : daysLeft === 0
                    ? "text-red-500"
                    : "text-foreground",
              )}
            >
              {daysLeft === null
                ? "Illimité"
                : daysLeft === 0
                  ? "Expiré aujourd'hui"
                  : `${daysLeft} jour${daysLeft > 1 ? "s" : ""} restant${daysLeft > 1 ? "s" : ""}`}
            </span>
          </div>
          <ProgressBar percent={progress} urgent={isUrgent} />
          <div className="flex items-center justify-between text-[10px] text-muted-foreground/70">
            <span>{formatDate(sub.startedAt)}</span>
            <span>{formatDate(sub.expiresAt)}</span>
          </div>
        </div>
      )}

      {/* Details */}
      <div className="px-6 py-4">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Détails
        </p>
        <div>
          <DetailRow
            icon={CalendarDays}
            label="Début"
            value={formatDate(sub.startedAt)}
          />
          <DetailRow
            icon={CalendarDays}
            label="Expiration"
            value={sub.expiresAt ? formatDate(sub.expiresAt) : "Illimité"}
          />
          {sub.paymentMethod && (
            <DetailRow
              icon={CreditCard}
              label="Paiement"
              value={sub.paymentMethod}
            />
          )}
          {sub.clientPhone && (
            <DetailRow
              icon={Phone}
              label="Téléphone"
              value={formatPhone(sub.clientPhone)}
            />
          )}
          {sub.paymentRef && (
            <DetailRow
              icon={BadgeCheck}
              label="Référence"
              value={
                <span className="font-mono text-[11px]">{sub.paymentRef}</span>
              }
            />
          )}
          {sub.renewedAt && (
            <DetailRow
              icon={RefreshCw}
              label="Dernier renouvellement"
              value={formatDate(sub.renewedAt)}
            />
          )}
          {sub.cancelledAt && (
            <DetailRow
              icon={XCircle}
              label="Annulé le"
              value={formatDate(sub.cancelledAt)}
              valueClass="text-red-500"
            />
          )}
        </div>
      </div>

      {/* Plan features */}
      <div className="px-6 py-4 border-t border-border bg-muted/10">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Inclus dans ce plan
        </p>
        <div className="space-y-2">
          {[
            {
              icon: Zap,
              label: sub.plan.questionsPerDay
                ? `${sub.plan.questionsPerDay} questions / jour`
                : "Questions illimitées / jour",
              highlight: !sub.plan.questionsPerDay,
            },
            {
              icon: sub.plan.totalQuestions ? Zap : Infinity,
              label: sub.plan.totalQuestions
                ? `${sub.plan.totalQuestions.toLocaleString("fr-FR")} questions au total`
                : "Accès illimité à toutes les questions",
              highlight: !sub.plan.totalQuestions,
            },
            {
              icon: ShieldCheck,
              label: isPaid
                ? "Accès Premium à tous les cours"
                : "Accès aux cours de base",
              highlight: isPaid,
            },
            {
              icon: BadgeCheck,
              label: isPaid
                ? "Suivi de progression avancé"
                : "Suivi de progression standard",
              highlight: isPaid,
            },
          ].map(({ icon: Icon, label, highlight }) => (
            <div key={label} className="flex items-center gap-2.5">
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full",
                  highlight
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="size-3" />
              </span>
              <span
                className={cn(
                  "text-xs",
                  highlight
                    ? "text-foreground font-medium"
                    : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      {isActive && (
        <div className="px-6 py-4 border-t border-border space-y-2">
          {/* Free plan → upgrade */}
          {!isPaid && (
            <button
              onClick={onUpgrade}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.99] transition-all focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <Crown className="size-4" />
              Passer à Premium
            </button>
          )}

          {/* Paid plan expiring soon → renew */}
          {isPaid && isUrgent && (
            <button
              onClick={onUpgrade}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.99] transition-all focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <RefreshCw className="size-4" />
              Renouveler l'abonnement
            </button>
          )}

          <button
            onClick={() => router.push(`/accounts/${user?.id}/factures`)}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 active:scale-[0.99] transition-all focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            Voir mes factures
          </button>
        </div>
      )}

      {(sub.status === "expired" || sub.status === "cancelled") && (
        <div className="px-6 py-4 border-t border-border">
          <button
            onClick={onUpgrade}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.99] transition-all focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <Crown className="size-4" />
            Se réabonner
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function SubscriptionSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse">
      <div className="px-6 py-5 border-b border-border bg-muted/20 space-y-3">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-xl bg-muted" />
          <div className="space-y-2">
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="h-3 w-24 rounded bg-muted/70" />
          </div>
        </div>
        <div className="h-7 w-28 rounded bg-muted" />
      </div>
      <div className="px-6 py-5 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex justify-between py-1">
            <div className="h-3 w-24 rounded bg-muted" />
            <div className="h-3 w-32 rounded bg-muted/70" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const SubscriptionPage = () => {
  const [subscription, setSubscription] = useState<
    Subscription | null | undefined
  >(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [paidPlan, setPaidPlan] = useState<Plan | null>(null);
  const mountedRef = useRef(true);
  const router = useRouter();

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchSubscription = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await subscriptionService.getMySubscription();
      if (mountedRef.current) {
        const sub = res.data.data.subscription;
        setSubscription(sub);
        if (sub?.plan?.type === "paid") setPaidPlan(sub.plan);
      }
    } catch {
      if (mountedRef.current) setError(true);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      {/* Page header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Crown className="size-5 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Mon abonnement
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Gérez votre plan, suivez l'expiration et accédez à vos avantages.
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <SubscriptionSkeleton />
      ) : error ? (
        <div className="rounded-2xl border border-border bg-card px-6 py-14 flex flex-col items-center gap-3 text-center">
          <AlertCircle className="size-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Impossible de charger votre abonnement.
          </p>
          <button
            onClick={fetchSubscription}
            className="inline-flex items-center gap-1.5 text-xs text-primary underline underline-offset-2"
          >
            <RefreshCw className="size-3" /> Réessayer
          </button>
        </div>
      ) : subscription === null ? (
        <FreePlanCard onUpgrade={() => setShowUpgrade(true)} />
      ) : subscription ? (
        <SubscriptionCard
          sub={subscription}
          onUpgrade={() => setShowUpgrade(true)}
        />
      ) : null}

      {/* Footer hint */}
      {!loading && !error && (
        <p className="text-center text-xs text-muted-foreground pb-2">
          Pour toute question sur votre abonnement, contactez le support.
        </p>
      )}

      {showUpgrade && (
        <UpgradeModal
          onClose={() => setShowUpgrade(false)}
          onSuccess={() => router.refresh()}
        />
      )}
    </div>
  );
};

export default SubscriptionPage;
