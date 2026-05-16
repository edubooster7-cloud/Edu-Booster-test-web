"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import api from "@/lib/api";
import { APP_PAGES } from "@/lib/auth/auth.constants";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Province {
  id: string;
  name: string;
  country: string;
}

interface Section {
  id: string;
  name: string;
  _count: { users: number };
}

// ─── Services ─────────────────────────────────────────────────────────────────

const onboardingService = {
  getProvinces: () =>
    api.get<{ status: string; data: { provinces: Province[]; total: number } }>(
      "/provinces?limit=100",
    ),

  getSectionsByProvince: (provinceId: string) =>
    api.get<{ status: string; data: { sections: Section[] } }>(
      `/sections/by-province/${provinceId}`,
    ),

  selectSection: (payload: { sectionId: string; provinceId: string }) =>
    api.post<{
      status: string;
      message: string;
      data: { user: { id: string; name: string; email: string } };
    }>("/sections/select", payload),
};

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS = [
  { label: "Province" },
  { label: "Section" },
  { label: "Révision" },
  { label: "Terminé" },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((step, i) => {
        const n = i + 1;
        const active = current === n;
        const done = current > n;

        return (
          <div key={step.label} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 border",
                  done
                    ? "bg-primary border-primary text-primary-foreground"
                    : active
                      ? "bg-primary border-primary text-primary-foreground shadow-sm"
                      : "bg-background border-border text-muted-foreground",
                )}
              >
                {done ? <Check className="w-4 h-4" /> : <span>{n}</span>}
              </div>
              <span
                className={cn(
                  "text-[11px] font-medium whitespace-nowrap transition-colors",
                  active || done ? "text-primary" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-px w-12 sm:w-20 mx-1 mb-5 transition-colors duration-500",
                  done ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Option card ──────────────────────────────────────────────────────────────

function OptionCard({
  label,
  meta,
  selected,
  onClick,
}: {
  label: string;
  meta?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left flex items-center justify-between rounded-lg px-4 py-3 border transition-all duration-150",
        "hover:border-primary/50 hover:bg-accent/30",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
          : "border-border bg-secondary/30",
      )}
    >
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {meta && <p className="text-xs text-muted-foreground mt-0.5">{meta}</p>}
      </div>
      <div
        className={cn(
          "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-3 transition-all",
          selected
            ? "bg-primary border-primary"
            : "border-border bg-background",
        )}
      >
        {selected && <Check className="w-3 h-3 text-primary-foreground" />}
      </div>
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const OnboardingPage = () => {
  const router = useRouter();

  const [step, setStep] = useState(1);

  // Data
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  // Selections
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(
    null,
  );
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);

  // Search
  const [provinceSearch, setProvinceSearch] = useState("");
  const [sectionSearch, setSectionSearch] = useState("");

  // UI states
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingSections, setLoadingSections] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();

  // ── Fetch provinces on mount ─────────────────────────────────────────────
  useEffect(() => {
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      setError(null);
      try {
        const res = await onboardingService.getProvinces();
        setProvinces(res.data.data.provinces ?? []);
      } catch {
        setError("Impossible de charger les provinces.");
      } finally {
        setLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, []);

  // ── Fetch sections when province changes ─────────────────────────────────
  useEffect(() => {
    if (!selectedProvince) return;
    const fetchSections = async () => {
      setLoadingSections(true);
      setSections([]);
      setSelectedSection(null);
      setSectionSearch("");
      setError(null);
      try {
        const res = await onboardingService.getSectionsByProvince(
          selectedProvince.id,
        );
        setSections(res.data.data.sections ?? []);
      } catch {
        setError("Impossible de charger les sections.");
      } finally {
        setLoadingSections(false);
      }
    };
    fetchSections();
  }, [selectedProvince]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSelectProvince = useCallback((p: Province) => {
    setSelectedProvince(p);
  }, []);

  const handleSelectSection = useCallback((s: Section) => {
    setSelectedSection(s);
  }, []);

  const goNext = () => setStep((s) => s + 1);
  const goBack = () => {
    setError(null);
    setStep((s) => s - 1);
  };

  const handleConfirm = async () => {
    if (!selectedSection || !selectedProvince) return;
    setSubmitting(true);
    setError(null);
    try {
      await onboardingService.selectSection({
        sectionId: selectedSection.id,
        provinceId: selectedProvince.id,
      });
      setStep(4);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Une erreur est survenue. Veuillez réessayer.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Filtered lists ────────────────────────────────────────────────────────
  const filteredProvinces = provinces.filter((p) =>
    p.name.toLowerCase().includes(provinceSearch.toLowerCase()),
  );

  const filteredSections = sections.filter((s) =>
    s.name.toLowerCase().includes(sectionSearch.toLowerCase()),
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Bienvenue sur EduBooster
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configurez votre profil en quelques étapes
          </p>
        </div>

        <StepIndicator current={step} />

        {/* Card */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          {/* ── Step 1: Province ── */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Choisissez votre province
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Sélectionnez la province dans laquelle vous étudiez.
                </p>
              </div>

              <Input
                placeholder="Rechercher une province…"
                value={provinceSearch}
                onChange={(e) => setProvinceSearch(e.target.value)}
                className="h-9"
              />

              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                {loadingProvinces ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Chargement…
                  </div>
                ) : filteredProvinces.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Aucune province trouvée.
                  </p>
                ) : (
                  filteredProvinces.map((p) => (
                    <OptionCard
                      key={p.id}
                      label={p.name}
                      meta={p.country}
                      selected={selectedProvince?.id === p.id}
                      onClick={() => handleSelectProvince(p)}
                    />
                  ))
                )}
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex justify-end pt-2">
                <Button
                  onClick={goNext}
                  disabled={!selectedProvince}
                  className="gap-1.5"
                >
                  Continuer
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 2: Section ── */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Choisissez votre section
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Sections disponibles dans la province de{" "}
                  <span className="font-medium text-foreground">
                    {selectedProvince?.name}
                  </span>
                  .
                </p>
              </div>

              <Input
                placeholder="Rechercher une section…"
                value={sectionSearch}
                onChange={(e) => setSectionSearch(e.target.value)}
                className="h-9"
              />

              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                {loadingSections ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Chargement des sections…
                  </div>
                ) : filteredSections.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Aucune section trouvée.
                  </p>
                ) : (
                  filteredSections.map((s) => (
                    <OptionCard
                      key={s.id}
                      label={s.name}
                      meta={`${s._count.users.toLocaleString()} élèves inscrits`}
                      selected={selectedSection?.id === s.id}
                      onClick={() => handleSelectSection(s)}
                    />
                  ))
                )}
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={goBack} className="gap-1.5">
                  <ChevronLeft className="w-4 h-4" />
                  Retour
                </Button>
                <Button
                  onClick={goNext}
                  disabled={!selectedSection}
                  className="gap-1.5"
                >
                  Continuer
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 3: Review ── */}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Vérifiez vos informations
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Confirmez vos choix avant de finaliser votre inscription.
                </p>
              </div>

              <div className="rounded-lg border border-border divide-y divide-border">
                {/* Province row */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">
                      Province
                    </p>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                      <p className="text-sm font-medium text-foreground">
                        {selectedProvince?.name}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        · {selectedProvince?.country}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setStep(1);
                    }}
                    className="text-xs text-primary font-medium hover:underline px-2 py-1 rounded"
                  >
                    Modifier
                  </button>
                </div>

                {/* Section row */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">
                      Section
                    </p>
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                      <p className="text-sm font-medium text-foreground">
                        {selectedSection?.name}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        · {selectedSection?._count.users.toLocaleString()}{" "}
                        élèves
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setStep(2);
                    }}
                    className="text-xs text-primary font-medium hover:underline px-2 py-1 rounded"
                  >
                    Modifier
                  </button>
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={goBack} className="gap-1.5">
                  <ChevronLeft className="w-4 h-4" />
                  Retour
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={submitting}
                  className="gap-1.5"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enregistrement…
                    </>
                  ) : (
                    <>
                      Confirmer
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 4: Success ── */}
          {step === 4 && (
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              </div>

              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Inscription finalisée !
                </h2>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                  Vous êtes inscrit(e) dans la section{" "}
                  <span className="font-medium text-foreground">
                    {selectedSection?.name}
                  </span>{" "}
                  — province de{" "}
                  <span className="font-medium text-foreground">
                    {selectedProvince?.name}
                  </span>
                  .
                </p>
              </div>

              <div className="flex gap-2 flex-wrap justify-center mt-1">
                <span className="inline-flex items-center gap-1.5 text-xs bg-secondary text-secondary-foreground rounded-full px-3 py-1 border border-border">
                  <MapPin className="w-3 h-3" />
                  {selectedProvince?.name}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs bg-secondary text-secondary-foreground rounded-full px-3 py-1 border border-border">
                  <BookOpen className="w-3 h-3" />
                  {selectedSection?.name}
                </span>
              </div>

              <Button
                className="mt-2 w-full"
                onClick={() => router.push(APP_PAGES.DASHBOARD(`${user?.id}`))}
              >
                Accéder à mon espace
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
