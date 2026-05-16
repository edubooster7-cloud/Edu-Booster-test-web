"use client";

import { useAuth } from "@/hooks/use-auth";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  BookOpen,
  BookText,
  ChevronRight,
  CircleDot,
  HelpCircle,
  Layers,
  Loader2,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type CourseStatus = "draft" | "published";

interface CourseSection {
  id: string;
  name: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  sourcePdfUrl: string;
  status: CourseStatus;
  totalQuestions: number | null;
  publishedAt: string | null;
  questionsPreviewText: string | null;
  createdAt: string;
  updatedAt: string;
  sections: CourseSection[];
  _count: { questions: number };
}

interface CoursesResponse {
  success: boolean;
  total: number;
  totalPages: number;
  currentPage: number;
  results: number;
  data: Course[];
}

interface StartCourseResponse {
  success: boolean;
  resumed?: boolean;
  alreadyCompleted?: boolean;
  message: string;
  session: {
    id: string;
    courseId: string;
    status: string;
    currentIndex: number;
    correctAnswers: number;
    totalQuestions: number;
  };
}

const courseService = {
  getCoursesBySection: (
    sectionId: string,
    params: { page?: number; limit?: number; search?: string },
  ) => {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    if (params.search) query.set("search", params.search);
    query.set("status", "published");
    return api.get<CoursesResponse>(
      `/courses/section/${sectionId}?${query.toString()}`,
    );
  },

  startCourse: (courseId: string) =>
    api.post<StartCourseResponse>(`/courses/${courseId}/start`),
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitials(title: string): string {
  return title
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const ACCENT_PALETTE = [
  {
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  {
    bg: "bg-violet-500/10",
    text: "text-violet-600 dark:text-violet-400",
    dot: "bg-violet-500",
  },
  {
    bg: "bg-teal-500/10",
    text: "text-teal-600 dark:text-teal-400",
    dot: "bg-teal-500",
  },
  {
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  {
    bg: "bg-rose-500/10",
    text: "text-rose-600 dark:text-rose-400",
    dot: "bg-rose-500",
  },
] as const;

function getAccent(id: string) {
  const sum = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return ACCENT_PALETTE[sum % ACCENT_PALETTE.length];
}

function CourseCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden animate-pulse">
      <div className="p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-lg bg-muted shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="h-3 w-1/2 rounded bg-muted/70" />
          </div>
        </div>
        <div className="h-3 w-full rounded bg-muted/50" />
        <div className="h-3 w-2/3 rounded bg-muted/40" />
      </div>
      <div className="px-5 py-3 border-t border-border flex gap-4">
        <div className="h-3 w-20 rounded bg-muted" />
        <div className="h-3 w-16 rounded bg-muted/70" />
      </div>
    </div>
  );
}

function CourseCard({
  course,
  onStart,
  starting,
}: {
  course: Course;
  onStart: (courseId: string) => void;
  starting: boolean;
}) {
  const accent = getAccent(course.id);
  const questionCount = course._count.questions;

  return (
    <button
      onClick={() => onStart(course.id)}
      disabled={starting}
      className={cn(
        "w-full text-left group rounded-xl border border-border bg-card overflow-hidden",
        "hover:border-border/80 hover:shadow-sm transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-primary/30",
        "disabled:opacity-60 disabled:cursor-not-allowed",
      )}
    >
      <div className="p-5">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold tracking-wide",
              accent.bg,
              accent.text,
            )}
          >
            {starting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              getInitials(course.title)
            )}
          </span>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {course.title}
            </p>
            {course.publishedAt && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Publié le {formatDate(course.publishedAt)}
              </p>
            )}
          </div>

          <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground shrink-0 mt-0.5 transition-colors" />
        </div>

        {course.description && (
          <p className="mt-3 text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {course.description}
          </p>
        )}
      </div>

      <div className="px-5 py-3 border-t border-border/60 bg-muted/20 flex items-center gap-4">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <HelpCircle className="size-3.5" />
          {questionCount} question{questionCount !== 1 ? "s" : ""}
        </span>
        {course.sections.length > 0 && (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Layers className="size-3.5" />
            {course.sections[0].name}
          </span>
        )}
        <span
          className={cn(
            "ml-auto inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5",
            accent.bg,
            accent.text,
          )}
        >
          <CircleDot className="size-2.5" />
          Disponible
        </span>
      </div>
    </button>
  );
}

function SearchBar({
  value,
  onChange,
  onClear,
}: {
  value: string;
  onChange: (v: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
      <input
        type="text"
        placeholder="Rechercher un cours…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full rounded-xl border border-border bg-card pl-9 pr-9 py-2.5",
          "text-sm text-foreground placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40",
          "transition-all",
        )}
      />
      {value && (
        <button
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 flex size-4 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="size-2.5" />
        </button>
      )}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      <button
        onClick={onPrev}
        disabled={page === 1}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2",
          "text-xs font-medium text-foreground transition-all",
          "hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed",
          "focus:outline-none focus:ring-2 focus:ring-primary/30",
        )}
      >
        ← Précédente
      </button>
      <span className="text-xs text-muted-foreground">
        {page} / {totalPages}
      </span>
      <button
        onClick={onNext}
        disabled={page === totalPages}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2",
          "text-xs font-medium text-foreground transition-all",
          "hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed",
          "focus:outline-none focus:ring-2 focus:ring-primary/30",
        )}
      >
        Suivante →
      </button>
    </div>
  );
}

const PAGE_SIZE = 12;
const SEARCH_DEBOUNCE_MS = 400;

const CoursesPage = () => {
  const { user } = useAuth();
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [startingCourseId, setStartingCourseId] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const fetchCourses = useCallback(async () => {
    if (!user?.sectionId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const res = await courseService.getCoursesBySection(user.sectionId, {
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
      });
      if (mountedRef.current) {
        setCourses(res.data.data);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      }
    } catch {
      if (mountedRef.current) setError(true);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user?.sectionId, page, debouncedSearch]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleStartCourse = async (courseId: string) => {
    if (startingCourseId) return;
    setStartingCourseId(courseId);
    try {
      const res = await courseService.startCourse(courseId);
      const { session } = res.data;
      router.push(`/accounts/${user?.id}/quiz/${session.id}`);
    } catch (err: any) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message ?? "Une erreur est survenue";
      if (status === 402) {
        alert(message);
      } else {
        alert(message);
      }
    } finally {
      if (mountedRef.current) setStartingCourseId(null);
    }
  };

  const hasNoSection = !user?.sectionId;
  const isEmpty = !loading && !error && courses.length === 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <BookOpen className="size-5 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Mes cours
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {hasNoSection
            ? "Rejoignez une section pour accéder aux cours."
            : "Tous les cours disponibles dans votre section."}
        </p>
      </div>

      {hasNoSection ? (
        <div className="rounded-2xl border border-border bg-card px-6 py-14 flex flex-col items-center gap-3 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Layers className="size-5 text-muted-foreground" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Aucune section assignée
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Votre compte n'est pas encore rattaché à une section. Contactez
              votre administrateur pour y être ajouté.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <SearchBar
                value={search}
                onChange={setSearch}
                onClear={() => setSearch("")}
              />
            </div>
            {!loading && !error && total > 0 && (
              <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
                <BookText className="size-3" />
                {total} cours
              </span>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-border bg-card px-6 py-12 flex flex-col items-center gap-3 text-center">
              <AlertCircle className="size-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Impossible de charger les cours.
              </p>
              <button
                onClick={fetchCourses}
                className="inline-flex items-center gap-1.5 text-xs text-primary underline underline-offset-2"
              >
                <RefreshCw className="size-3" /> Réessayer
              </button>
            </div>
          )}

          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <CourseCardSkeleton key={i} />
              ))}
            </div>
          )}

          {isEmpty && (
            <div className="rounded-xl border border-border bg-card px-6 py-14 flex flex-col items-center gap-3 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-muted">
                <BookOpen className="size-5 text-muted-foreground" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {debouncedSearch
                    ? "Aucun cours trouvé"
                    : "Aucun cours disponible"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {debouncedSearch
                    ? `Aucun résultat pour « ${debouncedSearch} »`
                    : "Votre section n'a pas encore de cours publiés."}
                </p>
              </div>
              {debouncedSearch && (
                <button
                  onClick={() => setSearch("")}
                  className="text-xs text-primary underline underline-offset-2"
                >
                  Effacer la recherche
                </button>
              )}
            </div>
          )}

          {!loading && !error && courses.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {courses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onStart={handleStartCourse}
                    starting={startingCourseId === course.id}
                  />
                ))}
              </div>
              <Pagination
                page={page}
                totalPages={totalPages}
                onPrev={() => setPage((p) => Math.max(1, p - 1))}
                onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
              />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default CoursesPage;
