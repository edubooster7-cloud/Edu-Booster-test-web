"use client";

import { Switch } from "@/components/ui/switch";
import { userService } from "@/lib/auth/auth.service";
import { cn } from "@/lib/utils";
import {
  AlarmClock,
  BookOpen,
  CalendarDays,
  Clock,
  Loader2,
  RefreshCw,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

type StudyDay = "lun" | "mar" | "mer" | "jeu" | "ven" | "sam" | "dim";
type StudyFrequency = "daily" | "3h";

interface StudyRemindersData {
  studyHoursEnabled: boolean;
  studyTime: string;
  studyFrequency: StudyFrequency;
  selectedDays: StudyDay[];
  timezone: string;
  pushEnabled: boolean;
  isFullyConfigured: boolean;
}

const ALL_DAYS: { key: StudyDay; label: string; short: string }[] = [
  { key: "lun", label: "Lundi", short: "L" },
  { key: "mar", label: "Mardi", short: "M" },
  { key: "mer", label: "Mercredi", short: "M" },
  { key: "jeu", label: "Jeudi", short: "J" },
  { key: "ven", label: "Vendredi", short: "V" },
  { key: "sam", label: "Samedi", short: "S" },
  { key: "dim", label: "Dimanche", short: "D" },
];

const FREQUENCY_OPTIONS: {
  value: StudyFrequency;
  label: string;
  description: string;
}[] = [
  {
    value: "daily",
    label: "Une fois par jour",
    description: "Un rappel quotidien à l'heure choisie",
  },
  {
    value: "3h",
    label: "Toutes les 3 heures",
    description: "Rappels répétés les jours sélectionnés",
  },
];

function TimePicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}) {
  const [hh, mm] = value.split(":").map(Number);
  const pad = (n: number) => String(n).padStart(2, "0");
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 15, 30, 45];

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <select
          value={hh}
          onChange={(e) =>
            onChange(`${pad(Number(e.target.value))}:${pad(mm)}`)
          }
          disabled={disabled}
          className={cn(
            "appearance-none rounded-lg border border-border bg-muted/50 px-3 py-2 pr-8",
            "text-sm font-medium text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-primary/30",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          {hours.map((h) => (
            <option key={h} value={h}>
              {pad(h)}
            </option>
          ))}
        </select>
        <Clock className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
      </div>

      <span className="text-sm font-semibold text-muted-foreground">:</span>

      <div className="relative">
        <select
          value={mm}
          onChange={(e) =>
            onChange(`${pad(hh)}:${pad(Number(e.target.value))}`)
          }
          disabled={disabled}
          className={cn(
            "appearance-none rounded-lg border border-border bg-muted/50 px-3 py-2 pr-8",
            "text-sm font-medium text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-primary/30",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          {minutes.map((m) => (
            <option key={m} value={m}>
              {pad(m)}
            </option>
          ))}
        </select>
        <Clock className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
      </div>
    </div>
  );
}

const StudyRemindersPage = () => {
  const [data, setData] = useState<StudyRemindersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStep, setSaveStep] = useState("");

  const mountedRef = useRef(true);
  const savedDataRef = useRef<StudyRemindersData | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await userService.getStudyReminders();
        if (mountedRef.current) {
          setData(res.data.data);
          savedDataRef.current = res.data.data;
        }
      } catch {
        // silently fall back
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();
  }, []);

  const handleToggleEnabled = (enabled: boolean) => {
    if (!data) return;
    if (enabled && data.selectedDays.length === 0) return;
    setData((d) => d && { ...d, studyHoursEnabled: enabled });
  };

  const handleToggleDay = (day: StudyDay) => {
    if (!data) return;
    const current = data.selectedDays;
    const next = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day];
    if (next.length === 0) return;
    setData((d) => d && { ...d, selectedDays: next });
  };

  const handleTimeChange = (newTime: string) => {
    if (!data) return;
    setData((d) => d && { ...d, studyTime: newTime });
  };

  const handleFrequencyChange = (freq: StudyFrequency) => {
    if (!data) return;
    setData((d) => d && { ...d, studyFrequency: freq });
  };

  const handleSave = async () => {
    if (!data || saving) return;
    const prev = savedDataRef.current;
    setSaving(true);
    try {
      if (!prev || prev.studyHoursEnabled !== data.studyHoursEnabled) {
        setSaveStep("Activation des rappels...");
        await userService.toggleStudyReminders({
          enabled: data.studyHoursEnabled,
        });
      }

      if (
        !prev ||
        JSON.stringify(prev.selectedDays) !== JSON.stringify(data.selectedDays)
      ) {
        setSaveStep("Enregistrement des jours...");
        await userService.updateStudyDays({ selectedDays: data.selectedDays });
      }

      if (
        !prev ||
        prev.studyTime !== data.studyTime ||
        prev.studyFrequency !== data.studyFrequency
      ) {
        setSaveStep("Enregistrement de l'heure...");
        await userService.updateStudyTime({
          studyTime: data.studyTime,
          studyFrequency: data.studyFrequency,
        });
      }

      savedDataRef.current = { ...data };
      setSaveStep("Enregistré ✓");
      setTimeout(() => {
        if (mountedRef.current) setSaveStep("");
      }, 1500);
    } catch {
      setSaveStep("Erreur lors de l'enregistrement");
      setTimeout(() => {
        if (mountedRef.current) setSaveStep("");
      }, 2000);
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-8">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <BookOpen className="size-5 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Rappels d'étude
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Planifiez vos sessions d'étude et recevez des rappels aux moments qui
          vous conviennent.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : !data ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Impossible de charger vos paramètres.
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
          {/* ── Master toggle ── */}
          <div className="rounded-xl border border-border bg-card px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                  <AlarmClock className="size-4 text-primary" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Activer les rappels
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {data.studyHoursEnabled
                      ? `Rappels actifs à ${data.studyTime} (${data.timezone})`
                      : "Recevez des rappels push pour étudier"}
                  </p>
                </div>
              </div>
              <Switch
                checked={data.studyHoursEnabled}
                onCheckedChange={handleToggleEnabled}
                disabled={
                  saving ||
                  (!data.studyHoursEnabled && data.selectedDays.length === 0)
                }
                className="data-[state=checked]:bg-primary"
              />
            </div>
            {data.selectedDays.length === 0 && (
              <p className="mt-3 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-lg px-3 py-2">
                Sélectionnez au moins un jour d'étude pour activer les rappels.
              </p>
            )}
          </div>

          {/* ── Study days ── */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <CalendarDays className="size-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground leading-none">
                  Jours d'étude
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Choisissez les jours où vous souhaitez étudier
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card px-4 py-4">
              <div className="flex items-center gap-2 flex-wrap">
                {ALL_DAYS.map((day) => {
                  const active = data.selectedDays.includes(day.key);
                  const isLast = active && data.selectedDays.length === 1;
                  return (
                    <button
                      key={day.key}
                      onClick={() => handleToggleDay(day.key)}
                      disabled={saving || isLast}
                      title={day.label}
                      className={cn(
                        "flex size-10 flex-col items-center justify-center rounded-xl border text-xs font-semibold transition-all",
                        "focus:outline-none focus:ring-2 focus:ring-primary/30",
                        "disabled:opacity-40 disabled:cursor-not-allowed",
                        active
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border bg-muted/40 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                      )}
                    >
                      {day.short}
                      <span className="text-[9px] font-normal opacity-70 mt-0.5 hidden sm:block">
                        {day.label.slice(0, 3)}
                      </span>
                    </button>
                  );
                })}
              </div>
              {data.selectedDays.length > 0 && (
                <p className="mt-3 text-xs text-muted-foreground">
                  {data.selectedDays.length === 7
                    ? "Tous les jours"
                    : `${data.selectedDays.length} jour${data.selectedDays.length > 1 ? "s" : ""} sélectionné${data.selectedDays.length > 1 ? "s" : ""} : ${data.selectedDays
                        .map(
                          (d) => ALL_DAYS.find((x) => x.key === d)?.label ?? d,
                        )
                        .join(", ")}`}
                </p>
              )}
            </div>
          </section>

          {/* ── Time & Frequency ── */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Clock className="size-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground leading-none">
                  Heure et fréquence
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  À quelle heure et à quelle fréquence recevoir vos rappels
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
              <div className="flex items-center justify-between gap-4 px-4 py-3.5">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Heure du rappel
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Heure locale ({data.timezone})
                  </p>
                </div>
                <TimePicker
                  value={data.studyTime}
                  onChange={handleTimeChange}
                  disabled={saving}
                />
              </div>
              <div className="px-4 py-3.5">
                <div className="mb-3">
                  <p className="text-sm font-medium text-foreground">
                    Fréquence
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Combien de fois par jour
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {FREQUENCY_OPTIONS.map((opt) => {
                    const active = data.studyFrequency === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => handleFrequencyChange(opt.value)}
                        disabled={saving}
                        className={cn(
                          "flex items-start gap-3 rounded-xl border px-3 py-3 text-left transition-all",
                          "focus:outline-none focus:ring-2 focus:ring-primary/30",
                          "disabled:opacity-50 disabled:cursor-not-allowed",
                          active
                            ? "border-primary bg-primary/5"
                            : "border-border bg-muted/30 hover:border-primary/30",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                            active
                              ? "border-primary bg-primary"
                              : "border-muted-foreground/40",
                          )}
                        >
                          {active && (
                            <span className="size-1.5 rounded-full bg-white" />
                          )}
                        </span>
                        <div>
                          <p
                            className={cn(
                              "text-sm font-medium leading-none",
                              active
                                ? "text-foreground"
                                : "text-muted-foreground",
                            )}
                          >
                            {opt.label}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {opt.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* ── Status summary ── */}
          {data.isFullyConfigured && (
            <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3.5">
              <Zap className="mt-0.5 size-4 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Rappels configurés
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Vous recevrez un rappel{" "}
                  {data.studyFrequency === "3h"
                    ? "toutes les 3 heures"
                    : `à ${data.studyTime}`}{" "}
                  les jours sélectionnés.{" "}
                  {!data.pushEnabled && (
                    <span className="text-amber-600 dark:text-amber-400">
                      Activez les notifications push dans les paramètres pour
                      recevoir les alertes.
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* ── Save button ── */}
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              "w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3",
              "text-sm font-semibold transition-all",
              "focus:outline-none focus:ring-2 focus:ring-primary/30",
              "disabled:cursor-not-allowed",
              saving
                ? "bg-primary/70 text-primary-foreground"
                : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.99]",
            )}
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {saveStep}
              </>
            ) : saveStep === "Enregistré ✓" ? (
              saveStep
            ) : (
              "Enregistrer les modifications"
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

export default StudyRemindersPage;
