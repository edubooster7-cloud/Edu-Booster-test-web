"use client";

import { Switch } from "@/components/ui/switch";
import { useWebPush } from "@/hooks/use-web-push";
import { notificationService } from "@/lib/notification.service";
import { cn } from "@/lib/utils";
import type {
  NotificationChannel,
  NotificationType,
} from "@/types/notifications.types";
import {
  Bell,
  BellOff,
  BellRing,
  CreditCard,
  GraduationCap,
  Laptop,
  Loader2,
  Lock,
  Megaphone,
  ShieldAlert,
  Smartphone,
  UserCog,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

// ─── Config ───────────────────────────────────────────────────────────────────

interface NotifGroup {
  label: string;
  description: string;
  icon: React.ReactNode;
  types: {
    type: NotificationType;
    label: string;
    description: string;
  }[];
}

const GROUPS: NotifGroup[] = [
  {
    label: "Compte",
    description: "Activité et sécurité de votre compte",
    icon: <UserCog className="size-4" />,
    types: [
      {
        type: "account_created",
        label: "Création de compte",
        description: "Confirmation lors de la création de votre compte",
      },
      {
        type: "account_deleted",
        label: "Suppression de compte",
        description: "Notification quand votre compte est désactivé",
      },
      {
        type: "account_restored",
        label: "Restauration de compte",
        description: "Confirmation de restauration réussie",
      },
    ],
  },
  {
    label: "Sécurité",
    description: "Mots de passe et connexions",
    icon: <Lock className="size-4" />,
    types: [
      {
        type: "password_changed",
        label: "Modification du mot de passe",
        description: "Alerte quand votre mot de passe change",
      },
      {
        type: "password_reset",
        label: "Réinitialisation du mot de passe",
        description: "Confirmation de réinitialisation",
      },
      {
        type: "login_new_device",
        label: "Nouvel appareil connecté",
        description: "Alerte lors d'une connexion depuis un nouvel appareil",
      },
    ],
  },
  {
    label: "Cours",
    description: "Progression et nouveautés pédagogiques",
    icon: <GraduationCap className="size-4" />,
    types: [
      {
        type: "new_course",
        label: "Nouveau cours",
        description: "Soyez informé des nouveaux cours disponibles",
      },
      {
        type: "course_completed",
        label: "Cours terminé",
        description: "Félicitations à chaque cours complété",
      },
    ],
  },
  {
    label: "Paiements",
    description: "Transactions et abonnements",
    icon: <CreditCard className="size-4" />,
    types: [
      {
        type: "payment_initiated",
        label: "Paiement en cours",
        description: "Notification quand un paiement est initié",
      },
      {
        type: "payment_success",
        label: "Paiement confirmé",
        description: "Confirmation de paiement réussi",
      },
      {
        type: "payment_failed",
        label: "Paiement échoué",
        description: "Alerte en cas d'échec de paiement",
      },
    ],
  },
  {
    label: "Système",
    description: "Alertes et communications générales",
    icon: <ShieldAlert className="size-4" />,
    types: [
      {
        type: "system_alert",
        label: "Alertes système",
        description: "Notifications importantes de la plateforme",
      },
      {
        type: "promo",
        label: "Offres et promotions",
        description: "Découvrez nos offres spéciales",
      },
    ],
  },
];

const CHANNELS: {
  key: NotificationChannel;
  label: string;
  icon: React.ReactNode;
}[] = [
  { key: "in_app", label: "In-app", icon: <Laptop className="size-3.5" /> },
  { key: "push", label: "Push", icon: <Smartphone className="size-3.5" /> },
  { key: "email", label: "Email", icon: <Megaphone className="size-3.5" /> },
];

// ─── Preference key helper ────────────────────────────────────────────────────

const prefKey = (channel: NotificationChannel, type: NotificationType) =>
  `${channel}::${type}`;

// ─── Push Banner ─────────────────────────────────────────────────────────────

function PushBanner() {
  const {
    permission,
    isSubscribed,
    isLoading,
    isSupported,
    subscribe,
    unsubscribe,
  } = useWebPush();

  if (!isSupported) return null;

  if (permission === "denied") {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3.5">
        <BellOff className="mt-0.5 size-4 shrink-0 text-destructive" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            Notifications bloquées
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Vous avez bloqué les notifications dans votre navigateur.
            Autorisez-les dans les paramètres du navigateur pour les réactiver.
          </p>
        </div>
      </div>
    );
  }

  if (isSubscribed) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3.5">
        <div className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary/10">
            <BellRing className="size-4 text-primary" />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">
              Notifications push activées
            </p>
            <p className="text-xs text-muted-foreground">
              Vous recevez des notifications même quand l'onglet est fermé.
            </p>
          </div>
        </div>
        <button
          onClick={unsubscribe}
          disabled={isLoading}
          className="shrink-0 text-xs text-muted-foreground underline underline-offset-2 hover:text-destructive transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            "Désactiver"
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3.5">
      <div className="flex items-center gap-3">
        <span className="flex size-8 items-center justify-center rounded-full bg-primary/10">
          <Bell className="size-4 text-primary" />
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">
            Activer les notifications push
          </p>
          <p className="text-xs text-muted-foreground">
            Recevez des alertes instantanées, même fenêtre fermée.
          </p>
        </div>
      </div>
      <button
        onClick={subscribe}
        disabled={isLoading}
        className={cn(
          "shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5",
          "text-xs font-semibold text-primary-foreground",
          "transition-all hover:opacity-90 active:scale-95 disabled:opacity-60",
        )}
      >
        {isLoading ? (
          <Loader2 className="size-3 animate-spin" />
        ) : (
          <Zap className="size-3" />
        )}
        Activer
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const NotificationPreferencesPage = () => {
  const [prefs, setPrefs] = useState<Map<string, boolean>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Set<string>>(new Set());

  // Prevent state updates after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const res = await notificationService.getPreferences();
        if (!mountedRef.current) return;
        const map = new Map<string, boolean>();
        for (const p of res.data.data.preferences) {
          map.set(prefKey(p.channel, p.type), p.enabled);
        }
        setPrefs(map);
      } catch (err: unknown) {
        if (!mountedRef.current) return;
        // AbortError is expected on unmount — ignore silently
        if (err instanceof Error && err.name === "AbortError") return;
        // Otherwise silently fall back to all-enabled defaults
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  const isEnabled = (channel: NotificationChannel, type: NotificationType) => {
    const key = prefKey(channel, type);
    return prefs.get(key) ?? true;
  };

  const toggle = async (
    channel: NotificationChannel,
    type: NotificationType,
  ) => {
    const key = prefKey(channel, type);
    const next = !(prefs.get(key) ?? true);

    // Optimistic update
    setPrefs((prev) => new Map(prev).set(key, next));
    setSaving((s) => new Set(s).add(key));

    try {
      await notificationService.updatePreference({
        channel,
        type,
        enabled: next,
      });
    } catch {
      // Rollback on failure
      if (mountedRef.current) {
        setPrefs((prev) => new Map(prev).set(key, !next));
      }
    } finally {
      if (mountedRef.current) {
        setSaving((s) => {
          const n = new Set(s);
          n.delete(key);
          return n;
        });
      }
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-8">
      {/* Page header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Bell className="size-5 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Préférences de notifications
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Choisissez comment et quand vous souhaitez être notifié.
        </p>
      </div>

      {/* Push banner */}
      <PushBanner />

      {/* Channel legend */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-muted-foreground">Canaux :</span>
        {CHANNELS.map((ch) => (
          <span
            key={ch.key}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground"
          >
            {ch.icon}
            {ch.label}
          </span>
        ))}
      </div>

      {/* Groups */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          {GROUPS.map((group) => (
            <section key={group.label} className="space-y-3">
              {/* Group header */}
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  {group.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground leading-none">
                    {group.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {group.description}
                  </p>
                </div>
              </div>

              {/* Preference rows */}
              <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
                {group.types.map((item) => (
                  <div key={item.type} className="px-4 py-3.5">
                    {/* Row label */}
                    <div className="mb-3">
                      <p className="text-sm font-medium text-foreground">
                        {item.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Channel toggles */}
                    <div className="flex items-center gap-4 flex-wrap">
                      {CHANNELS.map((ch) => {
                        const key = prefKey(ch.key, item.type);
                        const enabled = isEnabled(ch.key, item.type);
                        const isSaving = saving.has(key);

                        return (
                          <label
                            key={ch.key}
                            className="flex items-center gap-2 cursor-pointer select-none"
                          >
                            <Switch
                              checked={enabled}
                              onCheckedChange={() => toggle(ch.key, item.type)}
                              disabled={isSaving}
                              className="data-[state=checked]:bg-primary"
                            />
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 text-xs",
                                enabled
                                  ? "text-foreground"
                                  : "text-muted-foreground",
                              )}
                            >
                              {isSaving ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                ch.icon
                              )}
                              {ch.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Footer note */}
      <p className="text-center text-xs text-muted-foreground pb-2">
        Les modifications sont enregistrées automatiquement.
      </p>
    </div>
  );
};

export default NotificationPreferencesPage;
