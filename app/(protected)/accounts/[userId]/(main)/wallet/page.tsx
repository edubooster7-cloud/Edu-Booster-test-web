"use client";

import { useAuth } from "@/hooks/use-auth";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  Clock,
  Copy,
  Gift,
  Loader2,
  Phone,
  RefreshCw,
  Share2,
  Trophy,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type TxType = "referral_reward" | "withdrawal" | "adjustment";
type TxStatus = "pending" | "completed" | "failed";

interface WalletTransaction {
  id: string;
  type: TxType;
  amount: number;
  currency: string;
  status: TxStatus;
  note: string | null;
  createdAt: string;
}

interface WalletData {
  id: string;
  balance: number;
  transactions: WalletTransaction[];
}

interface ReferralEntry {
  id: string;
  rewardPaid: boolean;
  rewardPaidAt: string | null;
  createdAt: string;
  referred: { name: string; createdAt: string };
}

interface ReferralInfo {
  referralCode: string;
  referralLink: string;
  stats: {
    totalReferred: number;
    totalRewarded: number;
    totalEarnedUSD: number;
  };
  referrals: ReferralEntry[];
}

// ─── Service ──────────────────────────────────────────────────────────────────

const walletService = {
  getWallet: () =>
    api.get<{
      status: string;
      data: {
        wallet: WalletData | { balance: 0; currency: string; transactions: [] };
      };
    }>("/wallet"),
  getReferrals: () =>
    api.get<{ status: string; data: ReferralInfo }>("/wallet/referrals"),
  withdraw: (body: {
    clientPhone: string;
    currency: string;
    telecom?: string;
  }) =>
    api.post<{
      status: string;
      message: string;
      data: { reference: string; amountToWithdraw: number };
    }>("/wallet/withdraw", body),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatAmount(amount: number, currency = "USD") {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(
    amount,
  );
}

const TX_META: Record<
  TxType,
  { label: string; color: string; icon: React.ReactNode; sign: string }
> = {
  referral_reward: {
    label: "Récompense parrainage",
    color: "text-emerald-600 dark:text-emerald-400",
    icon: <Gift className="size-3.5" />,
    sign: "+",
  },
  withdrawal: {
    label: "Retrait",
    color: "text-rose-600 dark:text-rose-400",
    icon: <ArrowUpRight className="size-3.5" />,
    sign: "-",
  },
  adjustment: {
    label: "Ajustement",
    color: "text-amber-600 dark:text-amber-400",
    icon: <Zap className="size-3.5" />,
    sign: "±",
  },
};

const STATUS_META: Record<TxStatus, { label: string; className: string }> = {
  completed: {
    label: "Confirmé",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  pending: {
    label: "En attente",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  failed: {
    label: "Échoué",
    className: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
};

// ─── Withdraw Modal ───────────────────────────────────────────────────────────

function WithdrawModal({
  balance,
  onClose,
  onSuccess,
}: {
  balance: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [phone, setPhone] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!phone.trim()) return setError("Numéro de téléphone requis.");
    setError(null);
    setLoading(true);
    try {
      await walletService.withdraw({ clientPhone: phone.trim(), currency });
      setDone(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err?.payload?.message ?? "Le retrait a échoué. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl bg-card border border-border shadow-2xl p-6 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Retirer vos gains
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Solde disponible :{" "}
                <span className="font-semibold text-foreground">
                  {formatAmount(balance)}
                </span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex size-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </div>

          {done ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
                <Check className="size-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                Retrait initié avec succès !
              </p>
              <p className="text-xs text-muted-foreground">
                {formatAmount(balance)} seront transférés vers votre numéro.
              </p>
            </div>
          ) : (
            <>
              {/* Amount display */}
              <div className="rounded-xl border border-border bg-muted/40 px-4 py-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  Montant à retirer
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {formatAmount(balance)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Tout votre solde disponible
                </p>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Numéro Mobile Money
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+243 8X XXX XXXX"
                    className={cn(
                      "w-full rounded-xl border border-border bg-muted/30 pl-9 pr-4 py-2.5",
                      "text-sm text-foreground placeholder:text-muted-foreground/60",
                      "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
                      "transition-all",
                    )}
                  />
                </div>
              </div>

              {/* Currency */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Devise
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["USD", "CDF"].map((c) => (
                    <button
                      key={c}
                      onClick={() => setCurrency(c)}
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-sm font-medium transition-all",
                        currency === c
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-muted/30 text-muted-foreground hover:border-border/80",
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-500/5 px-3 py-2.5">
                  <AlertCircle className="size-3.5 text-rose-500 shrink-0" />
                  <p className="text-xs text-rose-600 dark:text-rose-400">
                    {error}
                  </p>
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={loading || balance < 5}
                className={cn(
                  "w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3",
                  "text-sm font-semibold transition-all",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  "bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.99]",
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Traitement…
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="size-4" />
                    Retirer {formatAmount(balance)}
                  </>
                )}
              </button>

              <p className="text-center text-[11px] text-muted-foreground">
                Le montant sera transféré via Mobile Money (Airtel, Orange,
                M-Pesa ou Afrimoney).
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Copy Button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all",
        copied
          ? "border-emerald-300 dark:border-emerald-800 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "border-border bg-muted/40 text-muted-foreground hover:text-foreground",
      )}
    >
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      {copied ? "Copié !" : "Copier"}
    </button>
  );
}

// ─── Share Button ─────────────────────────────────────────────────────────────

function ShareButton({ link, code }: { link: string; code: string }) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "EduBooster — Rejoins-moi !",
          text: `Utilise mon code de parrainage ${code} pour t'inscrire sur EduBooster et accède à des cours de qualité.`,
          url: link,
        });
      } catch {}
    } else {
      await navigator.clipboard.writeText(link);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-all"
    >
      <Share2 className="size-3" />
      Partager
    </button>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function WalletSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-36 rounded-2xl bg-muted" />
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-4 w-32 rounded bg-muted" />
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const WalletPage = () => {
  const { user } = useAuth();
  const router = useRouter();

  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [activeTab, setActiveTab] = useState<"transactions" | "referrals">(
    "transactions",
  );

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [walletRes, referralRes] = await Promise.allSettled([
        walletService.getWallet(),
        walletService.getReferrals(),
      ]);

      if (!mountedRef.current) return;

      if (walletRes.status === "fulfilled") {
        const w = walletRes.value.data.data.wallet;
        setWallet(
          "id" in w
            ? (w as WalletData)
            : ({ id: "", balance: 0, transactions: [] } as any),
        );
      }
      if (referralRes.status === "fulfilled") {
        setReferralInfo(referralRes.value.data.data);
      }
    } catch {
      if (mountedRef.current) setError(true);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const balance = wallet?.balance ?? 0;
  const canWithdraw = balance >= 5;
  const transactions = wallet?.transactions ?? [];
  const referrals = referralInfo?.referrals ?? [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-8">
      {/* ── Page header ── */}
      <div className="flex items-center gap-2">
        <Wallet className="size-5 text-primary" />
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Mon Wallet
        </h1>
      </div>

      {loading ? (
        <WalletSkeleton />
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertCircle className="size-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Impossible de charger votre wallet.
          </p>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-1.5 text-xs text-primary underline underline-offset-2"
          >
            <RefreshCw className="size-3" /> Réessayer
          </button>
        </div>
      ) : (
        <>
          {/* ── Balance card ── */}
          <div className="relative rounded-2xl border border-border bg-card overflow-hidden p-6">
            {/* Decorative background */}
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 80% 20%, hsl(var(--primary)) 0%, transparent 60%)",
              }}
            />

            <div className="relative space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">
                  Solde disponible
                </p>
                <p className="text-4xl font-bold text-foreground mt-1 tracking-tight">
                  {formatAmount(balance)}
                </p>
                {!canWithdraw && balance > 0 && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Encore{" "}
                    <span className="font-medium text-foreground">
                      {formatAmount(5 - balance)}
                    </span>{" "}
                    avant de pouvoir retirer
                  </p>
                )}
                {balance === 0 && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Parrainez des amis pour commencer à gagner
                  </p>
                )}
              </div>

              {/* Progress to threshold */}
              {balance < 5 && balance > 0 && (
                <div className="space-y-1">
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-700"
                      style={{ width: `${(balance / 5) * 100}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {Math.round((balance / 5) * 100)}% du seuil de retrait ($5)
                  </p>
                </div>
              )}

              <button
                onClick={() => setShowWithdraw(true)}
                disabled={!canWithdraw}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
                  canWithdraw
                    ? "bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.99]"
                    : "bg-muted text-muted-foreground cursor-not-allowed",
                )}
              >
                <ArrowUpRight className="size-4" />
                {canWithdraw ? "Retirer" : `Minimum $5 requis`}
              </button>
            </div>
          </div>

          {/* ── Stats row ── */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: "Parrainages",
                value: referralInfo?.stats.totalReferred ?? 0,
                sub: "au total",
                icon: <Users className="size-3.5" />,
                color: "text-blue-600 dark:text-blue-400",
                bg: "bg-blue-500/10",
              },
              {
                label: "Récompensés",
                value: referralInfo?.stats.totalRewarded ?? 0,
                sub: "abonnés",
                icon: <Trophy className="size-3.5" />,
                color: "text-violet-600 dark:text-violet-400",
                bg: "bg-violet-500/10",
              },
              {
                label: "Total gagné",
                value: `$${referralInfo?.stats.totalEarnedUSD ?? 0}`,
                sub: "depuis le début",
                icon: <Gift className="size-3.5" />,
                color: "text-emerald-600 dark:text-emerald-400",
                bg: "bg-emerald-500/10",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-border bg-card px-3 py-3 space-y-2"
              >
                <div
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full",
                    s.bg,
                    s.color,
                  )}
                >
                  {s.icon}
                </div>
                <div>
                  <p className="text-base font-bold text-foreground leading-none">
                    {s.value}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {s.label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Referral code card ── */}
          {referralInfo && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Gift className="size-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">
                  Votre code de parrainage
                </p>
              </div>

              {/* Code display */}
              <div className="flex items-center gap-3">
                <div className="flex-1 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-center">
                  <span className="text-2xl font-bold tracking-[0.2em] text-primary">
                    {referralInfo.referralCode}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <CopyButton text={referralInfo.referralLink} />
                  <ShareButton
                    link={referralInfo.referralLink}
                    code={referralInfo.referralCode}
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Gagnez{" "}
                <span className="font-semibold text-foreground">
                  1$ par ami
                </span>{" "}
                qui s'abonne au plan Premium grâce à votre lien.
              </p>
            </div>
          )}

          {/* ── Tabs ── */}
          <div>
            <div className="flex gap-1 rounded-xl border border-border bg-muted/40 p-1 mb-5">
              {(["transactions", "referrals"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all",
                    activeTab === tab
                      ? "bg-card text-foreground shadow-sm border border-border"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab === "transactions"
                    ? "Transactions"
                    : `Parrainages (${referrals.length})`}
                </button>
              ))}
            </div>

            {/* Transactions tab */}
            {activeTab === "transactions" && (
              <div>
                {transactions.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-14 text-center rounded-xl border border-border bg-card">
                    <ArrowDownLeft className="size-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Aucune transaction
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Vos gains et retraits apparaîtront ici.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    {transactions.map((tx, idx) => {
                      const meta = TX_META[tx.type];
                      const statusMeta = STATUS_META[tx.status];
                      return (
                        <div
                          key={tx.id}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3.5",
                            idx !== transactions.length - 1 &&
                              "border-b border-border/60",
                          )}
                        >
                          <div
                            className={cn(
                              "flex size-8 shrink-0 items-center justify-center rounded-full",
                              tx.type === "referral_reward"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : tx.type === "withdrawal"
                                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                            )}
                          >
                            {meta.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground">
                              {meta.label}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                              {tx.note ?? formatDate(tx.createdAt)}
                            </p>
                          </div>
                          <div className="text-right shrink-0 space-y-1">
                            <p
                              className={cn(
                                "text-sm font-semibold tabular-nums",
                                meta.color,
                              )}
                            >
                              {meta.sign}
                              {formatAmount(tx.amount, tx.currency)}
                            </p>
                            <span
                              className={cn(
                                "inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                                statusMeta.className,
                              )}
                            >
                              {statusMeta.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Referrals tab */}
            {activeTab === "referrals" && (
              <div>
                {referrals.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-14 text-center rounded-xl border border-border bg-card">
                    <Users className="size-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Aucun parrainage encore
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                        Partagez votre code avec vos amis. Vous gagnerez 1$ pour
                        chaque ami qui s'abonne.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    {referrals.map((r, idx) => (
                      <div
                        key={r.id}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3.5",
                          idx !== referrals.length - 1 &&
                            "border-b border-border/60",
                        )}
                      >
                        <div
                          className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                            r.rewardPaid
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {r.referred.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground">
                            {r.referred.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Inscrit le {formatDate(r.referred.createdAt)}
                          </p>
                        </div>
                        <div className="shrink-0">
                          {r.rewardPaid ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                              <Check className="size-2.5" /> +$1 gagné
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                              <Clock className="size-2.5" /> En attente
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {referrals.some((r) => !r.rewardPaid) && (
                  <p className="text-center text-xs text-muted-foreground mt-3">
                    Les amis en attente n'ont pas encore souscrit au plan
                    Premium.
                  </p>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Withdraw modal ── */}
      {showWithdraw && (
        <WithdrawModal
          balance={balance}
          onClose={() => setShowWithdraw(false)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
};

export default WalletPage;
