"use client";

import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/api";
import { authService, userService } from "@/lib/auth/auth.service";
import {
  AlertTriangle,
  Clock,
  Eye,
  EyeOff,
  Key,
  KeyRound,
  LifeBuoy,
  Lock,
  Mail,
  MoreHorizontal,
  Shield,
  ShieldOff,
  Smartphone,
  Trash2,
} from "lucide-react";
import * as React from "react";

// ─── Base Dialog Shell ────────────────────────────────────────────────────────

function Dialog({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Coming Soon Dialog ───────────────────────────────────────────────────────

function ComingSoonDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose}>
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Clock className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Bientôt disponible
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cette fonctionnalité est en cours de développement et sera
            disponible très prochainement.
          </p>
        </div>
        <button
          onClick={onClose}
          className="mt-2 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Compris
        </button>
      </div>
    </Dialog>
  );
}

// ─── Password Dialog ──────────────────────────────────────────────────────────

function PasswordDialog({
  open,
  onClose,
  hasPassword,
}: {
  open: boolean;
  onClose: () => void;
  hasPassword: boolean;
}) {
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const { refreshUser } = useAuth();

  React.useEffect(() => {
    if (!open) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (newPassword !== confirmPassword) {
      toast.error({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas.",
      });
      return;
    }
    if (newPassword.length < 8) {
      toast.error({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 8 caractères.",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (hasPassword) {
        await userService.updatePassword({
          currentPassword,
          newPassword,
        });
      } else {
        await userService.createPassword({ password: newPassword });
      }
      toast({
        title: "Mot de passe mis à jour",
        description: hasPassword
          ? "Votre mot de passe a été modifié avec succès."
          : "Votre mot de passe a été créé avec succès.",
      });
      await refreshUser();
      onClose();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Une erreur inattendue est survenue.";
      toast.error({ title: "Erreur", description: message });
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled =
    isLoading ||
    (hasPassword && !currentPassword) ||
    !newPassword ||
    !confirmPassword;

  return (
    <Dialog open={open} onClose={onClose}>
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {hasPassword
                ? "Modifier le mot de passe"
                : "Créer un mot de passe"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {hasPassword
                ? "Saisissez votre mot de passe actuel puis définissez-en un nouveau."
                : "Vous vous connectez via Google. Définissez un mot de passe pour vous connecter aussi par email."}
            </p>
          </div>
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-3">
          {hasPassword && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Mot de passe actuel
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  disabled={isLoading}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors disabled:pointer-events-none"
                >
                  {showCurrent ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              {hasPassword ? "Nouveau mot de passe" : "Mot de passe"}
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                disabled={isLoading}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors disabled:pointer-events-none"
              >
                {showNew ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                disabled={isLoading}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors disabled:pointer-events-none"
              >
                {showConfirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={isDisabled}
            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? "Enregistrement…" : hasPassword ? "Modifier" : "Créer"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

// ─── Disconnect Google Dialog ─────────────────────────────────────────────────

function DisconnectGoogleDialog({
  open,
  onClose,
  userEmail,
}: {
  open: boolean;
  onClose: () => void;
  userEmail: string;
}) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const { refreshUser } = useAuth();

  React.useEffect(() => {
    if (!open) {
      setEmail("");
      setPassword("");
      setShowPassword(false);
    }
  }, [open]);

  const handleDisconnect = async () => {
    if (email.trim().toLowerCase() !== userEmail.toLowerCase()) {
      toast.error({
        title: "Email incorrect",
        description: "L'adresse e-mail ne correspond pas à votre compte.",
      });
      return;
    }

    setIsLoading(true);
    try {
      await authService.disconnectGoogle({ email: email.trim(), password });
      toast({
        title: "Google délié",
        description: "Votre compte Google a été délié avec succès.",
      });
      await refreshUser();
      onClose();
    } catch (err) {
      toast.error({
        title: "Erreur",
        description:
          err instanceof ApiError
            ? err.message
            : "Une erreur inattendue est survenue.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = isLoading || !email || !password;

  return (
    <Dialog open={open} onClose={onClose}>
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
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
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Délier Google
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Confirmez avec votre adresse e-mail{" "}
              <span className="font-medium text-foreground">{userEmail}</span>{" "}
              et votre mot de passe.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Adresse e-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={userEmail}
              disabled={isLoading}
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:opacity-50"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                disabled={isLoading}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors disabled:pointer-events-none"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleDisconnect}
            disabled={isDisabled}
            className="flex-1 rounded-xl bg-amber-500 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? "Déliaison…" : "Délier"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

function DeleteAccountDialog({
  open,
  onClose,
  userEmail,
}: {
  open: boolean;
  onClose: () => void;
  userEmail: string;
}) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const { refreshUser } = useAuth();

  // Reset all fields when dialog closes
  React.useEffect(() => {
    if (!open) {
      setEmail("");
      setPassword("");
      setShowPassword(false);
    }
  }, [open]);

  const handleDelete = async () => {
    if (email.trim().toLowerCase() !== userEmail.toLowerCase()) {
      toast.error({
        title: "Email incorrect",
        description: "L'adresse e-mail ne correspond pas à votre compte.",
      });
      return;
    }

    if (!password) {
      toast.error({
        title: "Mot de passe requis",
        description: "Veuillez saisir votre mot de passe pour confirmer.",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Backend expects: { email, password }
      await userService.deleteAccount({ email: email.trim(), password });
      toast({
        title: "Compte supprimé",
        description:
          "Votre compte a été supprimé. Vous avez 30 jours pour le restaurer.",
      });
      await refreshUser();
      onClose();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Une erreur inattendue est survenue.";
      toast.error({ title: "Erreur", description: message });
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = isLoading || !email || !password;

  return (
    <Dialog open={open} onClose={onClose}>
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
            <Trash2 className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Supprimer le compte
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Cette action est irréversible. Confirmez avec votre adresse e-mail{" "}
              <span className="font-medium text-foreground">{userEmail}</span>{" "}
              et votre mot de passe.
            </p>
          </div>
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-3">
          {/* Email confirmation */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Adresse e-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={userEmail}
              disabled={isLoading}
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-destructive focus:ring-2 focus:ring-destructive/20 disabled:opacity-50"
            />
          </div>

          {/* Password confirmation */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-destructive focus:ring-2 focus:ring-destructive/20 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                disabled={isLoading}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors disabled:pointer-events-none"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleDelete}
            disabled={isDisabled}
            className="flex-1 rounded-xl bg-destructive py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? "Suppression…" : "Supprimer"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

// ─── Shared UI Primitives ─────────────────────────────────────────────────────

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative rounded-2xl border border-border bg-card">
      {children}
    </div>
  );
}

function SectionHeader({
  title,
  description,
  badge,
}: {
  title: string;
  description: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="border-b border-border px-6 py-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
        {badge}
      </div>
    </div>
  );
}

function Row({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 px-6 py-4 not-last:border-b not-last:border-border">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

function OutlineButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground shadow-sm transition hover:bg-muted"
    >
      {children}
    </button>
  );
}

function PrimaryButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
    >
      {children}
    </button>
  );
}

function IconButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
    >
      <MoreHorizontal className="h-4 w-4" />
    </button>
  );
}

function GoogleMoreMenu({ onDisconnect }: { onDisconnect: () => void }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-60 mt-1 min-w-40 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          <button
            onClick={() => {
              setOpen(false);
              onDisconnect();
            }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-destructive transition hover:bg-destructive/10"
          >
            <ShieldOff className="h-4 w-4" />
            Délier Google
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const SecurityPage = () => {
  const { user, refreshUser } = useAuth();
  const userEmail = user?.email ?? "utilisateur@exemple.com";
  const hasPassword = user?.hasPassword ?? false;
  const [disconnectGoogleOpen, setDisconnectGoogleOpen] = React.useState(false);

  const [comingSoon, setComingSoon] = React.useState(false);
  const [passwordOpen, setPasswordOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const soon = () => setComingSoon(true);

  const handleDeleteClick = () => {
    if (!hasPassword) {
      toast({
        title: "Mot de passe requis",
        description:
          "Veuillez d'abord créer un mot de passe pour confirmer la suppression de votre compte.",
      });
      setPasswordOpen(true);
    } else {
      setDeleteOpen(true);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      {/* ── Page Header ── */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
          <Shield className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Sécurité</h1>
          <p className="text-sm text-muted-foreground">
            Gérez vos méthodes de connexion et protégez votre compte.
          </p>
        </div>
      </div>

      {/* ── Sign-in Methods ── */}
      <SectionCard>
        <SectionHeader
          title="Méthodes de connexion"
          description="Personnalisez comment vous accédez à votre compte. Liez vos profils et configurez des passkeys."
        />

        <Row
          icon={<Mail className="h-4 w-4" />}
          title="Email"
          description={userEmail}
        />

        <Row
          icon={<Lock className="h-4 w-4" />}
          title="Mot de passe"
          description={
            hasPassword
              ? "Dernière modification inconnue"
              : "Aucun mot de passe — vous utilisez Google"
          }
          action={
            <OutlineButton onClick={() => setPasswordOpen(true)}>
              {hasPassword ? "Modifier" : "Créer"}
            </OutlineButton>
          }
        />

        <Row
          icon={<KeyRound className="h-4 w-4" />}
          title="Passkeys"
          description="0 passkey enregistré"
          action={<PrimaryButton onClick={soon}>Ajouter</PrimaryButton>}
        />

        {user?.googleId && (
          <Row
            icon={
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
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
            }
            title="Google"
            description={userEmail}
            action={
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Connecté</span>
                <GoogleMoreMenu
                  onDisconnect={() => setDisconnectGoogleOpen(true)}
                />
              </div>
            }
          />
        )}
      </SectionCard>

      {/* ── Two-Factor Authentication ── */}
      <SectionCard>
        <SectionHeader
          title="Authentification à deux facteurs"
          description="Protège votre compte en exigeant un second facteur lors de la connexion."
          badge={
            <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-600 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-400">
              Incomplet
            </span>
          }
        />

        <div className="mx-6 mt-5 flex items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/50 dark:bg-amber-900/20">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Votre configuration multi-facteurs est presque terminée. Ajoutez
              une passkey pour garder l&apos;accès à votre compte si vous perdez
              votre appareil.
            </p>
          </div>
          <button
            onClick={soon}
            className="shrink-0 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-700 shadow-sm transition hover:bg-amber-50 dark:border-amber-700 dark:bg-card dark:text-amber-400"
          >
            Ajouter
          </button>
        </div>

        <div className="mb-2 mt-2">
          <Row
            icon={<Smartphone className="h-4 w-4" />}
            title="Application Authentificateur (TOTP)"
            description="Inscrit"
            action={<OutlineButton onClick={soon}>Remplacer</OutlineButton>}
          />
          <Row
            icon={<Key className="h-4 w-4" />}
            title="Passkeys"
            description="Connectez-vous avec la biométrie. Plus rapide et plus sûr qu'un mot de passe."
            action={
              <PrimaryButton onClick={soon}>Ajouter une passkey</PrimaryButton>
            }
          />
          <Row
            icon={<LifeBuoy className="h-4 w-4" />}
            title="Codes de récupération"
            description="Codes à usage unique en cas de perte d'accès à vos autres facteurs."
            action={<OutlineButton onClick={soon}>Regénérer</OutlineButton>}
          />
          <Row
            icon={<ShieldOff className="h-4 w-4" />}
            title="Désactiver l'authentification à deux facteurs"
            description="Arrête d'exiger un second facteur. Vos codes de récupération ne fonctionneront plus."
            action={<OutlineButton onClick={soon}>Désactiver</OutlineButton>}
          />
        </div>
      </SectionCard>

      {/* ── Danger Zone ── */}
      <SectionCard>
        <div className="border-b border-destructive/20 px-6 py-5">
          <h2 className="text-base font-semibold text-destructive">
            Zone de danger
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Ces actions sont irréversibles. Procédez avec prudence.
          </p>
        </div>
        <div className="flex items-center gap-4 px-6 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <Trash2 className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              Supprimer le compte
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Supprime définitivement votre compte et toutes vos données.
            </p>
          </div>
          <button
            onClick={handleDeleteClick}
            className="shrink-0 rounded-lg border border-destructive/30 bg-card px-3.5 py-1.5 text-xs font-medium text-destructive shadow-sm transition hover:bg-destructive/10"
          >
            Supprimer
          </button>
        </div>
      </SectionCard>

      {/* ── Dialogs ── */}
      <ComingSoonDialog
        open={comingSoon}
        onClose={() => setComingSoon(false)}
      />
      <PasswordDialog
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        hasPassword={hasPassword}
      />
      <DeleteAccountDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        userEmail={userEmail}
      />

      <DisconnectGoogleDialog
        open={disconnectGoogleOpen}
        onClose={() => setDisconnectGoogleOpen(false)}
        userEmail={userEmail}
      />
    </div>
  );
};

export default SecurityPage;
