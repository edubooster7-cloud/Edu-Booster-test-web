"use client";

import { useAuth } from "@/hooks/use-auth";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  BookOpen,
  ChevronRight,
  Clock,
  CreditCard,
  Flame,
  Gift,
  Layers,
  RefreshCw,
  Star,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CourseSection {
  id: string;
  name: string;
}

interface CourseSession {
  id: string;
  courseId: string;
  status: "in_progress" | "completed";
  currentIndex: number;
  correctAnswers: number;
  totalQuestions: number;
}

interface UserStreak {
  currentStreak: number;
  longestStreak: number;
  lastActivityAt: string | null;
}

interface UserBadge {
  key: string;
  name: string;
  description: string;
  imageUrl: string | null;
  earnedAt: string;
}

interface RankingEntry {
  rank: number;
  userId: string;
  name: string;
  totalAnswered: number;
  isCurrentUser: boolean;
}

interface UserRanking {
  rank: number | null;
  totalAnswered: number;
  entries: RankingEntry[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  status: string;
  totalQuestions: number | null;
  publishedAt: string | null;
  sections: CourseSection[];
  _count: { questions: number };
}

interface ActiveSubscription {
  id: string;
  status: string;
  expiresAt: string | null;
  plan: {
    type: "free" | "pro";
    name: string;
    questionsPerDay: number | null;
    totalQuestions: number | null;
  };
}

interface QuestionUsage {
  totalAnswered: number;
  periodCount: number;
  periodStart: string | null;
}

interface DashboardData {
  inProgressSessions: Array<{ session: CourseSession; course: Course }>;
  completedSessions: Array<{ session: CourseSession; course: Course }>;
  activeSubscription: ActiveSubscription | null;
  questionUsage: QuestionUsage | null;
  streak: UserStreak | null;
  badges: UserBadge[];
  ranking: UserRanking | null;
}

// ─── Service ──────────────────────────────────────────────────────────────────

const dashboardService = {
  getSessions: (userId: string) =>
    api.get<{
      success: boolean;
      data: Array<{
        id: string;
        courseId: string;
        status: string;
        currentIndex: number;
        correctAnswers: number;
        totalQuestions: number;
        course: Course;
      }>;
    }>(`/users/${userId}/sessions`),

  getActiveSubscription: () =>
    api.get<{
      status: string;
      data: { subscription: ActiveSubscription | null };
    }>(`/users/subscription/active`),

  getQuestionUsage: () =>
    api.get<{ status: string; data: { usage: QuestionUsage | null } }>(
      `/users/me/question-usage`,
    ),

  getCoursesBySection: (sectionId: string) =>
    api.get<{ success: boolean; total: number; data: Course[] }>(
      `/courses/section/${sectionId}?status=published&limit=50`,
    ),

  getStreak: (userId: string) =>
    api.get<UserStreak>(`/badges/users/${userId}/streak`),

  getBadges: (userId: string) =>
    api.get<UserBadge[]>(`/badges/users/${userId}/badges`),

  getRanking: (userId: string) =>
    api.get<{ success: boolean; data: UserRanking }>(
      `/badges/users/${userId}/ranking`,
    ),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(title: string): string {
  return title
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatExpiry(iso: string | null): string {
  if (!iso) return "Jamais";
  return formatDate(iso);
}

const ACCENT_PALETTE = [
  { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400" },
  { bg: "bg-violet-500/10", text: "text-violet-600 dark:text-violet-400" },
  { bg: "bg-teal-500/10", text: "text-teal-600 dark:text-teal-400" },
  { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400" },
  { bg: "bg-rose-500/10", text: "text-rose-600 dark:text-rose-400" },
] as const;

function getAccent(id: string) {
  const sum = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return ACCENT_PALETTE[sum % ACCENT_PALETTE.length];
}

// ─── Coming Soon Dialog ───────────────────────────────────────────────────────

interface ComingSoonConfig {
  title: string;
  body: string;
  icon: React.ReactNode;
  iconBg: string;
  isLive?: boolean;
  children?: React.ReactNode;
}

function ComingSoonDialog({
  open,
  onClose,
  config,
}: {
  open: boolean;
  onClose: () => void;
  config: ComingSoonConfig | null;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open || !config) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl bg-card border border-border p-6 shadow-2xl text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex size-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="size-3.5" />
        </button>

        <div
          className={cn(
            "flex size-14 items-center justify-center rounded-full mx-auto mb-4",
            config.iconBg,
          )}
        >
          {config.icon}
        </div>

        {config.isLive ? (
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
              Actif
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 mb-1">
            <Clock className="size-3.5 text-amber-500" />
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
              Bientôt disponible
            </span>
          </div>
        )}

        <h2 className="text-base font-semibold text-foreground mt-1 mb-2">
          {config.title}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          {config.body}
        </p>

        {/* Contenu enrichi (classement, badges…) */}
        {config.children && (
          <div className="mb-5 text-left">{config.children}</div>
        )}

        <button
          onClick={onClose}
          className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Compris
        </button>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-6 w-48 rounded bg-muted" />
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-muted" />
        ))}
      </div>
      <div className="space-y-3">
        <div className="h-4 w-28 rounded bg-muted" />
        <div className="h-24 rounded-xl bg-muted" />
        <div className="h-24 rounded-xl bg-muted" />
      </div>
      <div className="h-36 rounded-xl bg-muted" />
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionTitle({
  icon,
  label,
  action,
}: {
  icon: React.ReactNode;
  label: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <span className="text-muted-foreground">{icon}</span>
        {label}
      </div>
      {action}
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mt-2">
      <div
        className="h-full rounded-full bg-primary transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

// ─── Course Item ──────────────────────────────────────────────────────────────

function CourseItem({
  course,
  session,
  onClick,
}: {
  course: Course;
  session: CourseSession;
  onClick?: () => void;
}) {
  const accent = getAccent(course.id);
  const total = session.totalQuestions || course._count.questions || 1;
  const pct = Math.round((session.currentIndex / total) * 100);
  const isCompleted = session.status === "completed";

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "w-full text-left flex items-center gap-3 px-4 py-3.5",
        "border-b border-border/60 last:border-0",
        onClick &&
          "hover:bg-muted/40 transition-colors focus:outline-none focus:bg-muted/40",
        !onClick && "cursor-default",
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold",
          accent.bg,
          accent.text,
        )}
      >
        {getInitials(course.title)}
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground leading-snug line-clamp-1">
          {course.title}
        </p>
        {isCompleted ? (
          <p className="text-xs text-muted-foreground mt-0.5">
            {total} questions · terminé
          </p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mt-0.5">
              Question {session.currentIndex} sur {total}
            </p>
            <ProgressBar value={pct} />
          </>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isCompleted ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            Terminé
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
            {pct}%
          </span>
        )}
        {onClick && <ChevronRight className="size-4 text-muted-foreground" />}
      </div>
    </button>
  );
}

// ─── Ranking Preview (affiché dans le dialog) ─────────────────────────────────

function RankingPreview({ ranking }: { ranking: UserRanking }) {
  const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      {ranking.entries.map((entry) => (
        <div
          key={entry.userId}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 border-b border-border/60 last:border-0",
            entry.isCurrentUser && "bg-primary/5",
          )}
        >
          <span className="w-6 text-center text-sm font-semibold text-muted-foreground">
            {MEDAL[entry.rank] ?? `#${entry.rank}`}
          </span>
          <span
            className={cn(
              "flex-1 text-xs truncate",
              entry.isCurrentUser
                ? "font-semibold text-foreground"
                : "text-muted-foreground",
            )}
          >
            {entry.isCurrentUser ? "Vous" : entry.name}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {entry.totalAnswered} réussies
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Badge Preview (affiché dans le dialog) ───────────────────────────────────

function BadgePreview({ badges }: { badges: UserBadge[] }) {
  return (
    <div className="space-y-2">
      {badges.map((b) => (
        <div
          key={b.key}
          className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-violet-500/10">
            <Trophy className="size-3.5 text-violet-600 dark:text-violet-400" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground">{b.name}</p>
            <p className="text-[11px] text-muted-foreground truncate">
              {b.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const UserHomePage = () => {
  const { user } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<DashboardData>({
    inProgressSessions: [],
    completedSessions: [],
    activeSubscription: null,
    questionUsage: null,
    streak: null,
    badges: [],
    ranking: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dialogKey, setDialogKey] = useState<string | null>(null);
  const [showAllCompleted, setShowAllCompleted] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bon après-midi";
    return "Bonsoir";
  };

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchDashboard = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(false);

    try {
      const [sessionsRes, subRes, usageRes, streakRes, badgesRes, rankingRes] =
        await Promise.allSettled([
          dashboardService.getSessions(user.id),
          dashboardService.getActiveSubscription(),
          dashboardService.getQuestionUsage(),
          dashboardService.getStreak(user.id),
          dashboardService.getBadges(user.id),
          dashboardService.getRanking(user.id),
        ]);

      if (!mountedRef.current) return;

      let inProgress: DashboardData["inProgressSessions"] = [];
      let completed: DashboardData["completedSessions"] = [];

      if (sessionsRes.status === "fulfilled") {
        const sessions = sessionsRes.value.data.data ?? [];
        for (const s of sessions) {
          const entry = {
            session: {
              id: s.id,
              courseId: s.courseId,
              status: s.status as "in_progress" | "completed",
              currentIndex: s.currentIndex,
              correctAnswers: s.correctAnswers,
              totalQuestions: s.totalQuestions,
            },
            course: s.course,
          };
          if (s.status === "completed") completed.push(entry);
          else inProgress.push(entry);
        }
      }

      setData({
        inProgressSessions: inProgress,
        completedSessions: completed,
        activeSubscription:
          subRes.status === "fulfilled"
            ? subRes.value.data.data.subscription
            : null,
        questionUsage:
          usageRes.status === "fulfilled"
            ? usageRes.value.data.data.usage
            : null,
        streak: streakRes.status === "fulfilled" ? streakRes.value.data : null,
        badges: badgesRes.status === "fulfilled" ? badgesRes.value.data : [],
        ranking:
          rankingRes.status === "fulfilled" ? rankingRes.value.data.data : null,
      });
    } catch {
      if (mountedRef.current) setError(true);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleResumeSession = (sessionId: string) => {
    router.push(`/accounts/${user?.id}/quiz/${sessionId}`);
  };

  const plan = data.activeSubscription?.plan ?? null;
  const isFree = !plan || plan.type === "free";
  const totalAnswered = data.questionUsage?.totalAnswered ?? 0;
  const periodCount = data.questionUsage?.periodCount ?? 0;
  const totalLimit = plan?.totalQuestions ?? null;
  const dailyLimit = plan?.questionsPerDay ?? null;

  const streak = data.streak;
  const badges = data.badges;
  const ranking = data.ranking;

  const COMING_SOON_CONFIGS: Record<string, ComingSoonConfig> = {
    streak: {
      title: "Séries & streaks",
      body: streak
        ? `Votre série actuelle est de ${streak.currentStreak} jour${streak.currentStreak > 1 ? "s" : ""}. Record personnel : ${streak.longestStreak} jour${streak.longestStreak > 1 ? "s" : ""}.`
        : "Suivez votre régularité quotidienne, débloquez des badges et maintenez votre série active.",
      icon: <Flame className="size-6 text-amber-600 dark:text-amber-400" />,
      iconBg: "bg-amber-500/10",
      isLive: streak !== null,
    },
    trophy: {
      title: "Badges & trophées",
      body:
        badges.length > 0
          ? `Vous avez gagné ${badges.length} badge${badges.length > 1 ? "s" : ""}. Continuez comme ça !`
          : "Gagnez des badges en complétant des cours, en répondant correctement et en maintenant votre série.",
      icon: <Trophy className="size-6 text-violet-600 dark:text-violet-400" />,
      iconBg: "bg-violet-500/10",
      children:
        badges.length > 0 ? <BadgePreview badges={badges} /> : undefined,
      isLive: badges.length > 0, // ← "Actif" seulement si au moins 1 badge
    },
    ranking: {
      title: "Classement de la section",
      body:
        ranking?.rank != null
          ? `Vous êtes classé #${ranking.rank} dans votre section avec ${ranking.totalAnswered} questions réussies.`
          : "Comparez vos résultats avec les autres étudiants de votre section. Le classement mensuel arrive bientôt.",
      icon: <Star className="size-6 text-teal-600 dark:text-teal-400" />,
      iconBg: "bg-teal-500/10",
      children:
        ranking && ranking.entries.length > 0 ? (
          <RankingPreview ranking={ranking} />
        ) : undefined,
      isLive: ranking !== null && ranking.entries.length > 0,
    },
    referral: {
      title: "Programme de parrainage",
      body: "Invitez vos amis avec votre code personnel et gagnez de l'argent pour chaque inscription réussie.",
      icon: <Gift className="size-6 text-rose-600 dark:text-rose-400" />,
      iconBg: "bg-rose-500/10",
      isLive: false,
    },
  };

  const visibleCompleted = showAllCompleted
    ? data.completedSessions
    : data.completedSessions.slice(0, 3);

  const rewards = [
    {
      key: "streak",
      icon: <Flame className="size-5" />,
      iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      label: "Série active",
      sub: streak
        ? `${streak.currentStreak} jour${streak.currentStreak > 1 ? "s" : ""}`
        : "—",
    },
    {
      key: "trophy",
      icon: <Trophy className="size-5" />,
      iconBg: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
      label: "Badges",
      sub:
        badges.length > 0
          ? `${badges.length} gagné${badges.length > 1 ? "s" : ""}`
          : "Aucun",
    },
    {
      key: "ranking",
      icon: <Star className="size-5" />,
      iconBg: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
      label: "Classement",
      sub: ranking?.rank != null ? `#${ranking.rank} ce mois` : "—",
    },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-8">
      {/* ── Greeting ── */}
      <div>
        <h1 className="text-xl font-semibold text-foreground tracking-tight">
          {getGreeting()}, {user?.name ?? "vous"} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Continuez là où vous vous êtes arrêté.
        </p>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertCircle className="size-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Impossible de charger votre tableau de bord.
          </p>
          <button
            onClick={fetchDashboard}
            className="inline-flex items-center gap-1.5 text-xs text-primary underline underline-offset-2"
          >
            <RefreshCw className="size-3" /> Réessayer
          </button>
        </div>
      ) : (
        <>
          {/* ── Metric cards ── */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: "Cours terminés",
                value: data.completedSessions.length,
                sub: `${data.inProgressSessions.length} en cours`,
              },
              {
                label: "Questions répondues",
                value: totalAnswered,
                sub: dailyLimit ? `${periodCount} aujourd'hui` : "au total",
              },
              {
                label: "Plan actuel",
                value: isFree ? "Gratuit" : "Pro",
                sub: isFree ? "Limité" : "Illimité",
              },
            ].map((m) => (
              <div
                key={m.label}
                className="rounded-xl bg-muted/50 border border-border/60 px-3.5 py-3"
              >
                <p className="text-[11px] text-muted-foreground">{m.label}</p>
                <p className="text-xl font-semibold text-foreground mt-1 leading-none">
                  {m.value}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {m.sub}
                </p>
              </div>
            ))}
          </div>

          {/* ── In progress ── */}
          <div>
            <SectionTitle
              icon={<BookOpen className="size-4" />}
              label="En cours"
            />
            {data.inProgressSessions.length === 0 ? (
              <div className="rounded-xl border border-border bg-card px-6 py-10 flex flex-col items-center gap-2 text-center">
                <Layers className="size-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Aucun cours en cours. Commencez un cours dans votre section.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                {data.inProgressSessions.map(({ session, course }) => (
                  <CourseItem
                    key={session.id}
                    course={course}
                    session={session}
                    onClick={() => handleResumeSession(session.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Completed ── */}
          {data.completedSessions.length > 0 && (
            <div>
              <SectionTitle
                icon={<BookOpen className="size-4" />}
                label="Terminés"
                action={
                  data.completedSessions.length > 3 ? (
                    <button
                      onClick={() => setShowAllCompleted((v) => !v)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showAllCompleted
                        ? "Réduire"
                        : `Voir tout (${data.completedSessions.length})`}
                    </button>
                  ) : null
                }
              />
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                {visibleCompleted.map(({ session, course }) => (
                  <CourseItem
                    key={session.id}
                    course={course}
                    session={session}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Plan ── */}
          <div>
            <SectionTitle
              icon={<CreditCard className="size-4" />}
              label="Mon abonnement"
            />
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {plan?.name ?? "Plan Gratuit"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isFree
                      ? "Accès limité aux cours de votre section"
                      : "Accès illimité à tous les cours"}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
                    isFree
                      ? "bg-muted text-muted-foreground"
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                  )}
                >
                  {isFree ? "Gratuit" : "Pro"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  {
                    label: "Questions/jour",
                    value: dailyLimit
                      ? `${periodCount} / ${dailyLimit}`
                      : "Illimité",
                  },
                  {
                    label: "Total utilisé",
                    value: totalLimit
                      ? `${totalAnswered} / ${totalLimit}`
                      : `${totalAnswered}`,
                  },
                  {
                    label: "Expire le",
                    value: formatExpiry(
                      data.activeSubscription?.expiresAt ?? null,
                    ),
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-lg bg-muted/50 px-3 py-2.5"
                  >
                    <p className="text-[10px] text-muted-foreground">
                      {s.label}
                    </p>
                    <p className="text-xs font-semibold text-foreground mt-1">
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>

              {isFree && (
                <button
                  onClick={() => router.push(`/accounts/${user?.id}/plans`)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                >
                  <Zap className="size-4" />
                  Passer au plan Pro
                </button>
              )}
            </div>
          </div>

          {/* ── Rewards ── */}
          <div>
            <SectionTitle
              icon={<Trophy className="size-4" />}
              label="Récompenses"
            />
            <div className="grid grid-cols-3 gap-3">
              {rewards.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setDialogKey(r.key)}
                  className="rounded-xl border border-border bg-card px-3 py-4 flex flex-col items-center gap-2 text-center hover:border-border/80 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <span
                    className={cn(
                      "flex size-10 items-center justify-center rounded-full",
                      r.iconBg,
                    )}
                  >
                    {r.icon}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      {r.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {r.sub}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Referral ── */}
          <div>
            <SectionTitle
              icon={<Users className="size-4" />}
              label="Parrainage"
            />
            <button
              onClick={() => setDialogKey("referral")}
              className={cn(
                "w-full text-left rounded-xl border border-border bg-card px-4 py-4",
                "flex items-center gap-3",
                "hover:border-border/80 hover:shadow-sm transition-all",
                "focus:outline-none focus:ring-2 focus:ring-primary/30",
              )}
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <Gift className="size-5" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  Invitez un ami, gagnez des avantages
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Partagez votre code et gagnez de l'argent pour chaque ami
                  inscrit.
                </p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground shrink-0" />
            </button>
          </div>
        </>
      )}

      {/* ── Coming soon dialog ── */}
      <ComingSoonDialog
        open={!!dialogKey}
        onClose={() => setDialogKey(null)}
        config={dialogKey ? (COMING_SOON_CONFIGS[dialogKey] ?? null) : null}
      />
    </div>
  );
};

export default UserHomePage;
