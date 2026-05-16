"use client";
import { toast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  Loader2,
  Lock,
  Sparkles,
  XCircle,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

interface Question {
  id: string;
  questionText: string;
  options: string[];
  difficulty: "easy" | "medium" | "hard";
  failCount: number;
}

interface NextQuestionResponse {
  success: boolean;
  completed: boolean;
  message?: string;
  currentIndex?: number;
  totalQuestions?: number;
  remaining?: number;
  question?: Question;
}

interface SubmitAnswerResponse {
  success: boolean;
  correct: boolean;
  courseCompleted: boolean;
  failCount?: number;
  message: string;
  nextIndex?: number | null;
  reveal?: {
    correctAnswer: string;
    explanation: string | null;
  };
}

type AnswerState =
  | { status: "idle" }
  | { status: "correct" }
  | { status: "wrong"; failCount: number }
  | { status: "revealed"; correctAnswer: string; explanation: string | null };

type LimitType = "daily" | "total" | null;

const sessionService = {
  getNextQuestion: (sessionId: string) =>
    api.get<NextQuestionResponse>(
      `/courses/sessions/${sessionId}/next-question`,
    ),
  submitAnswer: (
    sessionId: string,
    questionId: string,
    selectedAnswer: string,
  ) =>
    api.post<SubmitAnswerResponse>(`/courses/sessions/${sessionId}/answer`, {
      questionId,
      selectedAnswer,
    }),
};

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Facile",
  medium: "Moyen",
  hard: "Difficile",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "text-teal-600 dark:text-teal-400 bg-teal-500/10",
  medium: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
  hard: "text-rose-600 dark:text-rose-400 bg-rose-500/10",
};

// ─── Upgrade Modal ────────────────────────────────────────────────────────────

function UpgradeModal({
  limitType,
  message,
  onBack,
  onUpgrade,
}: {
  limitType: LimitType;
  message: string;
  onBack: () => void;
  onUpgrade: () => void;
}) {
  const isDaily = limitType === "daily";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 px-6 pt-8 pb-4 text-center">
          <div
            className={cn(
              "flex size-14 items-center justify-center rounded-full",
              isDaily ? "bg-amber-500/10" : "bg-rose-500/10",
            )}
          >
            <Lock
              className={cn(
                "size-7",
                isDaily ? "text-amber-500" : "text-rose-500",
              )}
            />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-foreground">
              {isDaily ? "Limite quotidienne atteinte" : "Limite atteinte"}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
              {message}
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mx-6 mb-4 rounded-xl border border-border bg-muted/30 px-4 py-3 space-y-2">
          {[
            "Questions illimitées chaque jour",
            "Accès à tous les cours",
            "Suivi de progression avancé",
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-2">
              <CheckCircle2 className="size-3.5 text-teal-500 shrink-0" />
              <span className="text-xs text-foreground">{feature}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 px-6 pb-6">
          <button
            onClick={onUpgrade}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5",
              "text-sm font-semibold bg-primary text-primary-foreground",
              "hover:bg-primary/90 transition-all",
              "focus:outline-none focus:ring-2 focus:ring-primary/30",
            )}
          >
            <Sparkles className="size-4" />
            Passer au plan Pro
          </button>
          <button
            onClick={onBack}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            {isDaily ? "Revenir demain" : "Retour aux cours"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
      <div
        className="h-full bg-primary rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Option button ────────────────────────────────────────────────────────────

function OptionButton({
  label,
  selected,
  correct,
  wrong,
  disabled,
  onClick,
}: {
  label: string;
  selected: boolean;
  correct: boolean;
  wrong: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-primary/30",
        "disabled:cursor-not-allowed",
        !selected &&
          !correct &&
          !wrong &&
          "border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5",
        selected &&
          !correct &&
          !wrong &&
          "border-primary bg-primary/10 text-primary",
        correct &&
          "border-teal-500 bg-teal-500/10 text-teal-700 dark:text-teal-400",
        wrong &&
          "border-rose-400 bg-rose-500/10 text-rose-700 dark:text-rose-400",
      )}
    >
      <span className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold",
            !selected &&
              !correct &&
              !wrong &&
              "border-border text-muted-foreground",
            selected && !correct && !wrong && "border-primary text-primary",
            correct && "border-teal-500 text-teal-600 dark:text-teal-400",
            wrong && "border-rose-400 text-rose-600 dark:text-rose-400",
          )}
        >
          {correct ? "✓" : wrong ? "✗" : ""}
        </span>
        {label}
      </span>
    </button>
  );
}

// ─── Completion screen ────────────────────────────────────────────────────────

function CompletionScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center gap-6">
      <div className="flex size-20 items-center justify-center rounded-full bg-teal-500/10">
        <CheckCircle2 className="size-10 text-teal-500" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Cours terminé !
        </h1>
        <p className="text-sm text-muted-foreground max-w-xs">
          Félicitations, vous avez répondu à toutes les questions de ce cours.
        </p>
      </div>
      <button
        onClick={onBack}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl border border-border bg-card",
          "px-5 py-2.5 text-sm font-medium text-foreground",
          "hover:bg-muted/50 transition-all focus:outline-none focus:ring-2 focus:ring-primary/30",
        )}
      >
        <ArrowLeft className="size-4" />
        Retour aux cours
      </button>
    </div>
  );
}

// ─── Error screen ─────────────────────────────────────────────────────────────

function ErrorScreen({
  message,
  onRetry,
  onBack,
}: {
  message: string;
  onRetry: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center gap-4">
      <AlertCircle className="size-8 text-muted-foreground" />
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">
          Une erreur est survenue
        </p>
        <p className="text-xs text-muted-foreground max-w-xs">{message}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-xs text-muted-foreground underline underline-offset-2"
        >
          Retour aux cours
        </button>
        <button
          onClick={onRetry}
          className="text-xs text-primary underline underline-offset-2"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}

// ─── Main Session Page ────────────────────────────────────────────────────────

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.sessionId as string;

  const [question, setQuestion] = useState<Question | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>({
    status: "idle",
  });
  const [submitting, setSubmitting] = useState(false);
  const [loadingQuestion, setLoadingQuestion] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState<{
    type: LimitType;
    message: string;
  } | null>(null);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ─── Detect limit type from error message ─────────────────────────────────
  const detectLimitType = (message: string): LimitType => {
    if (
      message.includes("aujourd'hui") ||
      message.includes("quotidienne") ||
      message.includes("par jour")
    ) {
      return "daily";
    }
    if (
      message.includes("totale") ||
      message.includes("limite de") ||
      message.includes("plan gratuit")
    ) {
      return "total";
    }
    return "total";
  };

  const loadNextQuestion = useCallback(async () => {
    if (!sessionId) return;

    setLoadingQuestion(true);
    setErrorMessage(null);
    setSelectedOption(null);
    setAnswerState({ status: "idle" });

    try {
      const res = await sessionService.getNextQuestion(sessionId);
      if (!mountedRef.current) return;

      if (res.data.completed) {
        toast({
          variant: "success",
          title: "Cours terminé",
          description: "Félicitations, vous avez terminé ce cours.",
        });
        setCompleted(true);
        return;
      }

      setQuestion(res.data.question!);
      setCurrentIndex(res.data.currentIndex!);
      setTotalQuestions(res.data.totalQuestions!);
    } catch (err: any) {
      if (!mountedRef.current) return;

      const status = err?.statusCode ?? err?.response?.status;
      const msg =
        err?.payload?.message ??
        err?.response?.data?.message ??
        "Impossible de charger la question.";

      // ✅ Handle 402 — show upgrade modal instead of error screen
      if (status === 402) {
        setLimitReached({
          type: detectLimitType(msg),
          message: msg,
        });
        return;
      }

      toast({ variant: "error", title: "Erreur", description: msg });
      setErrorMessage(msg);
    } finally {
      if (mountedRef.current) setLoadingQuestion(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadNextQuestion();
  }, [loadNextQuestion]);

  const handleSubmit = async () => {
    if (!question || !selectedOption || submitting) return;
    if (answerState.status !== "idle") return;

    setSubmitting(true);

    try {
      const res = await sessionService.submitAnswer(
        sessionId,
        question.id,
        selectedOption,
      );
      if (!mountedRef.current) return;

      const data = res.data;

      if (data.courseCompleted) {
        toast({
          variant: "success",
          title: "Cours terminé",
          description: "Félicitations, vous avez terminé ce cours.",
        });
        setCompleted(true);
        return;
      }

      if (data.correct) {
        toast({
          variant: "success",
          title: "Bonne réponse",
          description: "Vous avez trouvé la bonne réponse.",
        });
        setAnswerState({ status: "correct" });
      } else if (data.reveal) {
        toast({
          variant: "info",
          title: "Réponse révélée",
          description: `Bonne réponse : ${data.reveal.correctAnswer}`,
        });
        setAnswerState({
          status: "revealed",
          correctAnswer: data.reveal.correctAnswer,
          explanation: data.reveal.explanation,
        });
      } else {
        toast({
          variant: "warning",
          title: "Mauvaise réponse",
          description:
            "Il vous reste encore une tentative avant de voir la réponse.",
        });
        setAnswerState({ status: "wrong", failCount: data.failCount ?? 1 });
      }
    } catch (err: any) {
      if (!mountedRef.current) return;

      const status = err?.statusCode ?? err?.response?.status;
      const msg =
        err?.payload?.message ??
        err?.response?.data?.message ??
        "Erreur lors de la soumission.";

      if (status === 402) {
        setLimitReached({ type: detectLimitType(msg), message: msg });
        return;
      }

      toast({ variant: "error", title: "Erreur", description: msg });
      setErrorMessage(msg);
    } finally {
      if (mountedRef.current) setSubmitting(false);
    }
  };

  const handleBack = () => router.back();
  const handleUpgrade = () => router.push("/accounts/subscription");

  // ─── Upgrade modal overlay ────────────────────────────────────────────────
  if (limitReached) {
    return (
      <UpgradeModal
        limitType={limitReached.type}
        message={limitReached.message}
        onBack={handleBack}
        onUpgrade={handleUpgrade}
      />
    );
  }

  if (completed) return <CompletionScreen onBack={handleBack} />;

  if (errorMessage && !loadingQuestion) {
    return (
      <ErrorScreen
        message={errorMessage}
        onRetry={loadNextQuestion}
        onBack={handleBack}
      />
    );
  }

  const isAnswered =
    answerState.status === "correct" || answerState.status === "revealed";
  const isWrong = answerState.status === "wrong";
  const canSubmit =
    selectedOption !== null && answerState.status === "idle" && !submitting;
  const canRetry = isWrong && !submitting;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-4 h-14 flex items-center gap-4">
          <button
            onClick={handleBack}
            className={cn(
              "flex items-center gap-1.5 text-xs text-muted-foreground",
              "hover:text-foreground transition-colors focus:outline-none",
            )}
          >
            <ArrowLeft className="size-3.5" />
            Quitter
          </button>
          <div className="flex-1">
            <ProgressBar current={currentIndex} total={totalQuestions} />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums shrink-0">
            {currentIndex + 1} / {totalQuestions || "—"}
          </span>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-8">
        {loadingQuestion ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : question ? (
          <div className="space-y-6">
            {question.difficulty && (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full px-2.5 py-1",
                  DIFFICULTY_COLORS[question.difficulty],
                )}
              >
                <HelpCircle className="size-3" />
                {DIFFICULTY_LABELS[question.difficulty]}
              </span>
            )}

            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm font-semibold text-foreground leading-relaxed">
                {question.questionText}
              </p>
            </div>

            {isWrong && (
              <div className="flex items-start gap-3 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-500/5 px-4 py-3">
                <XCircle className="size-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                    Mauvaise réponse
                  </p>
                  <p className="text-xs text-rose-600/80 dark:text-rose-400/70 mt-0.5">
                    Il vous reste encore une tentative avant de voir la réponse.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2.5">
              {question.options.map((opt) => {
                const isSelected = selectedOption === opt;
                const isCorrectReveal =
                  answerState.status === "revealed" &&
                  opt === answerState.correctAnswer;
                const isWrongSelected =
                  (answerState.status === "wrong" ||
                    answerState.status === "revealed") &&
                  isSelected &&
                  opt !==
                    (answerState.status === "revealed"
                      ? answerState.correctAnswer
                      : "");
                const isCorrectAnswer =
                  answerState.status === "correct" && isSelected;

                return (
                  <OptionButton
                    key={opt}
                    label={opt}
                    selected={isSelected && answerState.status === "idle"}
                    correct={isCorrectReveal || isCorrectAnswer}
                    wrong={isWrongSelected}
                    disabled={isAnswered || submitting}
                    onClick={() => {
                      if (isAnswered || submitting) return;
                      setSelectedOption(opt);
                      if (answerState.status === "wrong")
                        setAnswerState({ status: "idle" });
                    }}
                  />
                );
              })}
            </div>

            {answerState.status === "revealed" && (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
                  <Lightbulb className="size-3.5 text-amber-500" />
                  <span className="text-xs font-semibold text-foreground">
                    Explication
                  </span>
                </div>
                <div className="px-4 py-4 space-y-2">
                  <p className="text-xs font-medium text-foreground">
                    Bonne réponse :{" "}
                    <span className="text-teal-600 dark:text-teal-400">
                      {answerState.correctAnswer}
                    </span>
                  </p>
                  {answerState.explanation && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {answerState.explanation}
                    </p>
                  )}
                </div>
              </div>
            )}

            {answerState.status === "correct" && (
              <div className="flex items-center gap-3 rounded-xl border border-teal-200 dark:border-teal-900 bg-teal-500/5 px-4 py-3">
                <CheckCircle2 className="size-4 text-teal-500 shrink-0" />
                <p className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                  Bonne réponse !
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              {answerState.status === "idle" && (
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl px-5 py-2.5",
                    "text-sm font-medium transition-all",
                    "focus:outline-none focus:ring-2 focus:ring-primary/30",
                    canSubmit
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-muted-foreground cursor-not-allowed",
                  )}
                >
                  {submitting && <Loader2 className="size-3.5 animate-spin" />}
                  Valider
                </button>
              )}

              {isAnswered && (
                <button
                  onClick={() => loadNextQuestion()}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl px-5 py-2.5",
                    "text-sm font-medium bg-primary text-primary-foreground",
                    "hover:bg-primary/90 transition-all",
                    "focus:outline-none focus:ring-2 focus:ring-primary/30",
                  )}
                >
                  Question suivante →
                </button>
              )}

              {isWrong && selectedOption && (
                <button
                  onClick={handleSubmit}
                  disabled={!canRetry}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl px-5 py-2.5",
                    "text-sm font-medium transition-all",
                    "focus:outline-none focus:ring-2 focus:ring-primary/30",
                    canRetry
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-muted-foreground cursor-not-allowed",
                  )}
                >
                  {submitting && <Loader2 className="size-3.5 animate-spin" />}
                  Valider
                </button>
              )}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
