"use client";

import api from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  ChevronRight,
  Clock,
  CreditCard,
  Download,
  FileText,
  Loader2,
  Phone,
  Receipt,
  RefreshCw,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type InvoiceType = "free" | "paid";

interface Invoice {
  id: string;
  invoiceNumber: string;
  type: InvoiceType;
  planName: string;
  amount: number;
  currency: string;
  paymentMethod: string | null;
  clientPhone: string | null;
  paidAt: string | null;
  expiresAt: string | null;
  pdfUrl: string | null;
  sentAt: string | null;
  createdAt: string;
}

interface InvoiceDetail extends Invoice {
  user: { id: string; name: string; email: string };
  subscription: { id: string; status: string; expiresAt: string } | null;
}

interface InvoicesResponse {
  total: number;
  page: number;
  limit: number;
  invoices: Invoice[];
}

// ─── Service ──────────────────────────────────────────────────────────────────

const invoiceService = {
  getMyInvoices: (page = 1, limit = 10) =>
    api.get<{ status: string; data: InvoicesResponse }>(
      `/invoices/my?page=${page}&limit=${limit}`,
    ),
  getInvoiceById: (id: string) =>
    api.get<{ status: string; data: { invoice: InvoiceDetail } }>(
      `/invoices/${id}`,
    ),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null, withTime = false) {
  if (!iso) return "—";
  const d = new Date(iso);
  const date = d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  if (!withTime) return date;
  const time = d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} à ${time}`;
}

function formatAmount(amount: number, currency: string) {
  if (currency === "USD")
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  return `${amount.toLocaleString("fr-FR")} ${currency}`;
}

function formatPhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("243") && digits.length === 12)
    return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  return raw;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: InvoiceType }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
        type === "paid"
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-primary/10 text-primary",
      )}
    >
      {type === "paid" ? "Payée" : "Gratuite"}
    </span>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/60 last:border-0 animate-pulse">
      <div className="size-8 rounded-lg bg-muted shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-28 rounded bg-muted" />
        <div className="h-2.5 w-20 rounded bg-muted/70" />
      </div>
      <div className="h-3 w-16 rounded bg-muted" />
    </div>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────

function InvoiceDrawer({
  invoiceId,
  onClose,
}: {
  invoiceId: string;
  onClose: () => void;
}) {
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await invoiceService.getInvoiceById(invoiceId);
        if (mountedRef.current) setInvoice(res.data.data.invoice);
      } catch {
        // silently fail — error shown in body
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();
  }, [invoiceId]);

  // ── Download — uses fetch directly to avoid axios interceptors breaking blob ──
  const handleDownload = async () => {
    if (!invoice?.pdfUrl || downloading) return;
    setDownloading(true);
    setDownloadError(false);

    try {
      const baseUrl = (api.defaults.baseURL ?? "").replace(/\/$/, "");

      const res = await fetch(`${baseUrl}/invoices/${invoice.id}/download`, {
        credentials: "include",
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const pdfUrl = data?.data?.url;

      if (!pdfUrl) throw new Error("No URL returned");

      // Open Cloudinary URL directly — browser handles the download
      const a = document.createElement("a");
      a.href = pdfUrl;
      a.download = `facture-${invoice.invoiceNumber}.pdf`;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error("[handleDownload]", err);
      if (mountedRef.current) setDownloadError(true);
    } finally {
      if (mountedRef.current) setDownloading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full max-w-md",
          "bg-background border-l border-border shadow-2xl",
          "flex flex-col overflow-hidden",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Receipt className="size-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              Détail de la facture
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : !invoice ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <AlertCircle className="size-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Impossible de charger la facture.
              </p>
            </div>
          ) : (
            <>
              {/* Invoice number + badge */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">N° de facture</p>
                  <p className="text-lg font-bold text-foreground tracking-tight mt-0.5">
                    #{invoice.invoiceNumber}
                  </p>
                </div>
                <TypeBadge type={invoice.type} />
              </div>

              {/* Amount highlight */}
              <div className="rounded-xl border border-border bg-card px-4 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Montant</p>
                  <p className="text-2xl font-bold text-foreground mt-0.5">
                    {formatAmount(invoice.amount, invoice.currency)}
                  </p>
                </div>
                <span className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                  <CreditCard className="size-5 text-primary" />
                </span>
              </div>

              {/* Details grid */}
              <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
                {[
                  { label: "Plan", value: invoice.planName, icon: FileText },
                  {
                    label: "Méthode de paiement",
                    value: invoice.paymentMethod ?? "—",
                    icon: CreditCard,
                  },
                  {
                    label: "Téléphone client",
                    value: invoice.clientPhone
                      ? formatPhone(invoice.clientPhone)
                      : "—",
                    icon: Phone,
                  },
                  {
                    label: "Payée le",
                    value: formatDate(invoice.paidAt, true),
                    icon: Calendar,
                  },
                  {
                    label: "Expire le",
                    value: formatDate(invoice.expiresAt),
                    icon: Clock,
                  },
                  {
                    label: "Créée le",
                    value: formatDate(invoice.createdAt, true),
                    icon: Calendar,
                  },
                ].map(({ label, value, icon: Icon }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Icon className="size-3.5 shrink-0" />
                      {label}
                    </div>
                    <span className="text-xs font-medium text-foreground text-right max-w-[55%] truncate">
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Subscription info */}
              {invoice.subscription && (
                <div className="rounded-xl border border-border bg-card px-4 py-3.5 space-y-2">
                  <p className="text-xs font-semibold text-foreground">
                    Abonnement lié
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Statut
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                        invoice.subscription.status === "active"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {invoice.subscription.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Expiration
                    </span>
                    <span className="text-xs font-medium text-foreground">
                      {formatDate(invoice.subscription.expiresAt)}
                    </span>
                  </div>
                </div>
              )}

              {/* Download error */}
              {downloadError && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-500/5 px-4 py-3">
                  <AlertCircle className="size-3.5 text-rose-500 shrink-0" />
                  <p className="text-xs text-rose-600 dark:text-rose-400">
                    Échec du téléchargement. Réessayez.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && invoice && (
          <div className="shrink-0 px-5 py-4 border-t border-border space-y-2">
            {invoice.pdfUrl ? (
              <button
                onClick={handleDownload}
                disabled={downloading}
                className={cn(
                  "w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3",
                  "text-sm font-semibold transition-all",
                  "focus:outline-none focus:ring-2 focus:ring-primary/30",
                  "disabled:cursor-not-allowed",
                  downloading
                    ? "bg-primary/70 text-primary-foreground"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.99]",
                )}
              >
                {downloading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Téléchargement…
                  </>
                ) : (
                  <>
                    <Download className="size-4" />
                    Télécharger le PDF
                  </>
                )}
              </button>
            ) : (
              <p className="text-center text-xs text-muted-foreground py-1">
                Aucun PDF disponible pour cette facture.
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

const InvoicesPage = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchInvoices = async (p: number) => {
    setLoading(true);
    setError(false);
    try {
      const res = await invoiceService.getMyInvoices(p, PAGE_SIZE);
      if (mountedRef.current) {
        setInvoices(res.data.data.invoices);
        setTotal(res.data.data.total);
      }
    } catch {
      if (mountedRef.current) setError(true);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-8">
      {/* Page header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Receipt className="size-5 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Mes factures
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Consultez et téléchargez l'historique de vos paiements et abonnements.
        </p>
      </div>

      {/* Summary pill */}
      {!loading && !error && total > 0 && (
        <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
          <FileText className="size-3" />
          {total} facture{total > 1 ? "s" : ""} au total
        </div>
      )}

      {/* Table card */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Table header — desktop only */}
        <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-2.5 border-b border-border bg-muted/30">
          {["Plan / N°", "Montant", "Date", ""].map((h) => (
            <span
              key={h}
              className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide"
            >
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-14 text-center px-4">
            <AlertCircle className="size-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Impossible de charger vos factures.
            </p>
            <button
              onClick={() => fetchInvoices(page)}
              className="inline-flex items-center gap-1.5 text-xs text-primary underline underline-offset-2"
            >
              <RefreshCw className="size-3" /> Réessayer
            </button>
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-14 text-center px-4">
            <span className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Receipt className="size-5 text-muted-foreground" />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">
                Aucune facture pour l'instant
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Vos factures apparaîtront ici après un paiement ou activation
                d'abonnement.
              </p>
            </div>
          </div>
        ) : (
          invoices.map((inv, idx) => (
            <button
              key={inv.id}
              onClick={() => setSelectedId(inv.id)}
              className={cn(
                "w-full text-left group",
                "grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-4 py-3.5",
                "hover:bg-muted/40 transition-colors",
                idx !== invoices.length - 1 && "border-b border-border/60",
              )}
            >
              {/* Plan + invoice number */}
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted border border-border text-muted-foreground group-hover:border-primary/30 group-hover:text-primary transition-colors">
                  <FileText className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {inv.planName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                    <span>#{inv.invoiceNumber}</span>
                    <span className="inline-block size-0.5 rounded-full bg-muted-foreground/40" />
                    <TypeBadge type={inv.type} />
                  </p>
                </div>
              </div>

              {/* Amount */}
              <span className="text-sm font-semibold text-foreground tabular-nums">
                {formatAmount(inv.amount, inv.currency)}
              </span>

              {/* Date — hidden on mobile */}
              <span className="hidden sm:block text-xs text-muted-foreground whitespace-nowrap">
                {formatDate(inv.paidAt ?? inv.createdAt)}
              </span>

              {/* Chevron */}
              <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2",
              "text-xs font-medium text-foreground transition-all",
              "hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed",
              "focus:outline-none focus:ring-2 focus:ring-primary/30",
            )}
          >
            <ArrowLeft className="size-3.5" /> Précédente
          </button>

          <span className="text-xs text-muted-foreground">
            Page {page} sur {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2",
              "text-xs font-medium text-foreground transition-all",
              "hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed",
              "focus:outline-none focus:ring-2 focus:ring-primary/30",
            )}
          >
            Suivante <ArrowRight className="size-3.5" />
          </button>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground pb-2">
        Cliquez sur une facture pour voir les détails et télécharger le PDF.
      </p>

      {/* Detail drawer */}
      {selectedId && (
        <InvoiceDrawer
          invoiceId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
};

export default InvoicesPage;
