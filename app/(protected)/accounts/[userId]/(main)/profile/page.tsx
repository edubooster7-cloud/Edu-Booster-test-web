"use client";

import { userService } from "@/lib/auth/auth.service";
import { cn } from "@/lib/utils";
import {
  Camera,
  Check,
  Globe,
  Loader2,
  Phone,
  RefreshCw,
  Save,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileData {
  id: string;
  name: string;
  phone: string | null;
  isPhoneVerified: boolean;
  timezone: string;
  expoPushToken: string | null;
  updatedAt: string;
}

interface FieldState {
  value: string;
  dirty: boolean;
  error: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function formatPhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("243") && digits.length === 12)
    return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  return raw;
}

const COMMON_TIMEZONES = [
  "Africa/Kinshasa",
  "Africa/Lubumbashi",
  "Africa/Lagos",
  "Africa/Nairobi",
  "Africa/Johannesburg",
  "Europe/Paris",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Dubai",
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-6 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <div>
        <p className="text-sm font-semibold text-foreground leading-none">
          {title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

function FieldInput({
  label,
  hint,
  value,
  onChange,
  error,
  disabled,
  type = "text",
  placeholder,
  suffix,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string | null;
  disabled?: boolean;
  type?: string;
  placeholder?: string;
  suffix?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
        <div className="mt-2 flex items-center gap-2">
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder={placeholder}
            className={cn(
              "flex-1 rounded-lg border bg-muted/50 px-3 py-2",
              "text-sm font-medium text-foreground placeholder:text-muted-foreground/50",
              "focus:outline-none focus:ring-2 focus:ring-primary/30",
              "disabled:opacity-50 disabled:cursor-not-allowed transition-all",
              error ? "border-destructive/60" : "border-border",
            )}
          />
          {suffix}
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-destructive flex items-center gap-1">
            <X className="size-3 shrink-0" />
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name }: { name: string }) {
  const initials = getInitials(name || "?");
  return (
    <div className="relative group w-fit">
      <div
        className={cn(
          "flex size-20 items-center justify-center rounded-2xl",
          "bg-primary/10 border-2 border-primary/20",
          "text-2xl font-bold text-primary select-none",
          "transition-all group-hover:border-primary/40",
        )}
      >
        {initials}
      </div>
      <button
        className={cn(
          "absolute -bottom-1.5 -right-1.5 flex size-7 items-center justify-center",
          "rounded-full border-2 border-background bg-muted shadow-sm",
          "text-muted-foreground hover:text-foreground transition-colors",
        )}
        title="Changer la photo"
      >
        <Camera className="size-3.5" />
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const ProfilePage = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"" | "success" | "error">("");

  const savedRef = useRef<ProfileData | null>(null);

  const [name, setName] = useState<FieldState>({
    value: "",
    dirty: false,
    error: null,
  });
  const [phone, setPhone] = useState<FieldState>({
    value: "",
    dirty: false,
    error: null,
  });
  const [timezone, setTimezone] = useState<FieldState>({
    value: "",
    dirty: false,
    error: null,
  });

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        const res = await userService.getMe();
        const user = res.data.data.user as unknown as ProfileData;
        if (mountedRef.current) {
          setProfile(user);
          savedRef.current = user;
          setName({ value: user.name ?? "", dirty: false, error: null });
          setPhone({
            value: user.phone ?? "",
            dirty: false,
            error: null,
          });
          setTimezone({
            value: user.timezone ?? "",
            dirty: false,
            error: null,
          });
        }
      } catch {
        // fall through
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();
  }, []);

  // ── Validation ─────────────────────────────────────────────────────────────

  const validateName = (v: string) => {
    if (!v.trim()) return "Le nom est requis.";
    if (v.trim().length < 2) return "Au moins 2 caractères.";
    if (v.trim().length > 100) return "100 caractères maximum.";
    return null;
  };

  const validatePhone = (v: string) => {
    if (!v) return null; // optional
    const digits = v.replace(/\D/g, "");
    if (!/^(243\d{9}|0\d{9})$/.test(digits))
      return "Numéro invalide. Ex : 0812345678 ou +243812345678";
    return null;
  };

  const validateTimezone = (v: string) => {
    if (!v.trim()) return "Le fuseau horaire est requis.";
    try {
      Intl.DateTimeFormat(undefined, { timeZone: v });
      return null;
    } catch {
      return `Fuseau invalide. Ex : "Africa/Kinshasa"`;
    }
  };

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleName = (v: string) =>
    setName({ value: v, dirty: true, error: validateName(v) });

  const handlePhone = (v: string) =>
    setPhone({ value: v, dirty: true, error: validatePhone(v) });

  const handleTimezone = (v: string) =>
    setTimezone({ value: v, dirty: true, error: validateTimezone(v) });

  const isDirty =
    name.value !== (savedRef.current?.name ?? "") ||
    phone.value !== (savedRef.current?.phone ?? "") ||
    timezone.value !== (savedRef.current?.timezone ?? "");

  const hasErrors = !!(name.error || phone.error || timezone.error);

  const handleSave = async () => {
    if (!profile || saving || hasErrors || !isDirty) return;

    // Final validation pass
    const nameErr = validateName(name.value);
    const phoneErr = validatePhone(phone.value);
    const tzErr = validateTimezone(timezone.value);

    if (nameErr || phoneErr || tzErr) {
      setName((s) => ({ ...s, error: nameErr, dirty: true }));
      setPhone((s) => ({ ...s, error: phoneErr, dirty: true }));
      setTimezone((s) => ({ ...s, error: tzErr, dirty: true }));
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, string> = {};
      if (name.value !== savedRef.current?.name)
        payload.name = name.value.trim();
      if (phone.value !== (savedRef.current?.phone ?? ""))
        payload.phone = phone.value;
      if (timezone.value !== savedRef.current?.timezone)
        payload.timezone = timezone.value.trim();

      const res = await userService.updateProfile(payload);
      const updated = res.data.data.user as unknown as ProfileData;

      if (mountedRef.current) {
        setProfile(updated);
        savedRef.current = updated;
        setName({ value: updated.name ?? "", dirty: false, error: null });
        setPhone({ value: updated.phone ?? "", dirty: false, error: null });
        setTimezone({
          value: updated.timezone ?? "",
          dirty: false,
          error: null,
        });
        setSaveStatus("success");
        setTimeout(() => {
          if (mountedRef.current) setSaveStatus("");
        }, 2000);
      }
    } catch {
      if (mountedRef.current) {
        setSaveStatus("error");
        setTimeout(() => {
          if (mountedRef.current) setSaveStatus("");
        }, 2500);
      }
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-8">
      {/* Page header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <User className="size-5 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Mon profil
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Gérez vos informations personnelles et vos préférences de compte.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : !profile ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Impossible de charger votre profil.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 text-xs text-primary underline underline-offset-2"
          >
            <RefreshCw className="size-3" /> Réessayer
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── Avatar card ── */}
          <div className="rounded-xl border border-border bg-card px-4 py-4">
            <div className="flex items-center gap-4">
              <Avatar name={name.value || profile.name} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {profile.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {profile.phone
                    ? formatPhone(profile.phone)
                    : "Aucun numéro associé"}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                      profile.isPhoneVerified
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                    )}
                  >
                    <ShieldCheck className="size-2.5" />
                    {profile.isPhoneVerified ? "Vérifié" : "Non vérifié"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Identity section ── */}
          <section className="space-y-3">
            <SectionHeader
              icon={User}
              title="Identité"
              subtitle="Votre nom tel qu'il apparaît dans l'application"
            />
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <FieldInput
                label="Nom complet"
                hint="Entre 2 et 100 caractères"
                value={name.value}
                onChange={handleName}
                error={name.dirty ? name.error : null}
                disabled={saving}
                placeholder="Ex : Jean Kabila"
              />
            </div>
          </section>

          {/* ── Contact section ── */}
          <section className="space-y-3">
            <SectionHeader
              icon={Phone}
              title="Coordonnées"
              subtitle="Votre numéro de téléphone pour la connexion et les alertes"
            />
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <FieldInput
                label="Numéro de téléphone"
                hint="Format RDC : 0812345678 ou +243812345678"
                value={phone.value}
                onChange={handlePhone}
                error={phone.dirty ? phone.error : null}
                disabled={saving}
                type="tel"
                placeholder="+243 8X XXX XXXX"
                suffix={
                  profile.isPhoneVerified && !phone.dirty ? (
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                      <Check className="size-3.5 text-emerald-500" />
                    </span>
                  ) : null
                }
              />
              {phone.dirty && phone.value && !phone.error && (
                <div className="px-4 pb-3.5">
                  <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-lg px-3 py-2">
                    Changer le numéro réinitialisera la vérification de votre
                    téléphone.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* ── Timezone section ── */}
          <section className="space-y-3">
            <SectionHeader
              icon={Globe}
              title="Fuseau horaire"
              subtitle="Utilisé pour vos rappels et plannings d'étude"
            />
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-start justify-between gap-4 px-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Fuseau horaire
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Format IANA — ex :{" "}
                    <code className="rounded bg-muted px-1 text-[10px]">
                      Africa/Kinshasa
                    </code>
                  </p>
                  <div className="mt-2 space-y-2">
                    {/* Quick-select chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {COMMON_TIMEZONES.map((tz) => (
                        <button
                          key={tz}
                          onClick={() => handleTimezone(tz)}
                          disabled={saving}
                          className={cn(
                            "rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-all",
                            "focus:outline-none focus:ring-2 focus:ring-primary/30",
                            "disabled:opacity-50 disabled:cursor-not-allowed",
                            timezone.value === tz
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-border bg-muted/40 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                          )}
                        >
                          {tz.split("/")[1].replace(/_/g, " ")}
                        </button>
                      ))}
                    </div>
                    {/* Manual input */}
                    <input
                      type="text"
                      value={timezone.value}
                      onChange={(e) => handleTimezone(e.target.value)}
                      disabled={saving}
                      placeholder="Africa/Kinshasa"
                      className={cn(
                        "w-full rounded-lg border bg-muted/50 px-3 py-2",
                        "text-sm font-medium text-foreground placeholder:text-muted-foreground/50",
                        "focus:outline-none focus:ring-2 focus:ring-primary/30",
                        "disabled:opacity-50 disabled:cursor-not-allowed transition-all",
                        timezone.dirty && timezone.error
                          ? "border-destructive/60"
                          : "border-border",
                      )}
                    />
                    {timezone.dirty && timezone.error && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <X className="size-3 shrink-0" />
                        {timezone.error}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Success / error banner ── */}
          {saveStatus === "success" && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3.5">
              <Check className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Profil mis à jour avec succès.
              </p>
            </div>
          )}
          {saveStatus === "error" && (
            <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3.5">
              <X className="size-4 shrink-0 text-destructive" />
              <p className="text-sm font-medium text-destructive">
                Une erreur est survenue. Veuillez réessayer.
              </p>
            </div>
          )}

          {/* ── Save button ── */}
          <button
            onClick={handleSave}
            disabled={saving || hasErrors || !isDirty}
            className={cn(
              "w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3",
              "text-sm font-semibold transition-all",
              "focus:outline-none focus:ring-2 focus:ring-primary/30",
              "disabled:cursor-not-allowed disabled:opacity-60",
              saving
                ? "bg-primary/70 text-primary-foreground"
                : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.99]",
            )}
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Enregistrement…
              </>
            ) : (
              <>
                <Save className="size-4" />
                Enregistrer les modifications
              </>
            )}
          </button>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground pb-2">
        Cliquez sur "Enregistrer" pour appliquer vos modifications.
      </p>
    </div>
  );
};

export default ProfilePage;
