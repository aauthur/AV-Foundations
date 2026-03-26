"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  getLessonProgress,
  getLessonQuestionStates,
  saveLessonQuestionState,
  saveLessonProgress,
  pruneLessonQuestionState,
  type LessonProgressRow,
  type LessonQuestionStateRow,
} from "@/lib/progress";

type LessonShellContextValue = {
  submittedCount: number;
  totalQuestions: number;
  completed: boolean;
  registerQuestion: (questionId: string) => void;
  getSavedQuestionState: (questionId: string) => LessonQuestionStateRow | null;
  saveQuestionState: (args: {
    questionId: string;
    questionType: string;
    submitted: boolean;
    selectedIndex?: number | null;
    selectedIndices?: number[] | null;
    isCorrect?: boolean | null;
    feedback?: any | null;
  }) => void;
  progress: LessonProgressRow | null;
};

const LessonShellContext = createContext<LessonShellContextValue | null>(null);

export function useLessonShell() {
  return useContext(LessonShellContext);
}

export default function LessonShell({
  courseSlug,
  lessonSlug,
  children,
}: {
  courseSlug: string;
  lessonSlug: string;
  children: React.ReactNode;
}) {
  const [progress, setProgress] = useState<LessonProgressRow | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [version, setVersion] = useState(0);

  const registeredQuestionsRef = useRef<Set<string>>(new Set());
  const savedQuestionStatesRef = useRef<Record<string, LessonQuestionStateRow>>({});
  const lastSavedAggregateRef = useRef<string | null>(null);

  // 🔹 Load existing progress + full question state
  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const [progressRow, questionStates] = await Promise.all([
          getLessonProgress(courseSlug, lessonSlug),
          getLessonQuestionStates(courseSlug, lessonSlug),
        ]);

        if (!active) return;

        setProgress(progressRow);

        savedQuestionStatesRef.current = Object.fromEntries(
          questionStates.map((row) => [row.question_id, row])
        );

        setHydrated(true);
        setVersion((v) => v + 1);
      } catch {
        if (!active) return;
        setHydrated(true);
      }
    })();

    return () => {
      active = false;
    };
  }, [courseSlug, lessonSlug]);

  // 🔹 Register question existence
  const registerQuestion = useCallback((questionId: string) => {
    if (registeredQuestionsRef.current.has(questionId)) return;
    registeredQuestionsRef.current.add(questionId);
    setVersion((v) => v + 1);
  }, []);

  // 🔹 Get saved state for hydration
  const getSavedQuestionState = useCallback((questionId: string) => {
    return savedQuestionStatesRef.current[questionId] ?? null;
  }, []);

  // 🔹 Save full question state
  const saveQuestionState = useCallback(
    ({
      questionId,
      questionType,
      submitted,
      selectedIndex = null,
      selectedIndices = null,
      isCorrect = null,
      feedback = null,
    }: {
      questionId: string;
      questionType: string;
      submitted: boolean;
      selectedIndex?: number | null;
      selectedIndices?: number[] | null;
      isCorrect?: boolean | null;
      feedback?: any | null;
    }) => {
      void saveLessonQuestionState({
        courseSlug,
        lessonSlug,
        questionId,
        questionType,
        submitted,
        selectedIndex,
        selectedIndices,
        isCorrect,
        feedback,
      }).then((row) => {
        if (!row) return;
        savedQuestionStatesRef.current[questionId] = row;
        setVersion((v) => v + 1);
      });
    },
    [courseSlug, lessonSlug]
  );

  // 🔹 Derived progress
  const derived = useMemo(() => {
    const registeredIds = Array.from(registeredQuestionsRef.current);
    const totalQuestions = registeredIds.length;

    const submittedCount = registeredIds.filter((id) => {
      const row = savedQuestionStatesRef.current[id];
      return row?.submitted;
    }).length;

    const completed =
      totalQuestions > 0 && submittedCount >= totalQuestions;

    return {
      totalQuestions,
      submittedCount,
      completed,
    };
  }, [version]);

  useEffect(() => {
  if (!hydrated) return;

  const validQuestionIds = Array.from(registeredQuestionsRef.current);
    if (validQuestionIds.length === 0) return;

    void pruneLessonQuestionState(courseSlug, lessonSlug, validQuestionIds);
    }, [hydrated, courseSlug, lessonSlug, version]);

  // 🔹 Save aggregate lesson progress
  useEffect(() => {
    if (!hydrated) return;
    if (derived.totalQuestions === 0) return;

    const saveKey = `${derived.submittedCount}/${derived.totalQuestions}`;
    if (lastSavedAggregateRef.current === saveKey) return;
    lastSavedAggregateRef.current = saveKey;

    void saveLessonProgress({
      courseSlug,
      lessonSlug,
      submittedQuestions: derived.submittedCount,
      totalQuestions: derived.totalQuestions,
    }).then((row) => {
      if (row) setProgress(row);
    });
  }, [
    hydrated,
    courseSlug,
    lessonSlug,
    derived.submittedCount,
    derived.totalQuestions,
  ]);

  const value = useMemo<LessonShellContextValue>(
    () => ({
      submittedCount: derived.submittedCount,
      totalQuestions: derived.totalQuestions,
      completed: derived.completed,
      registerQuestion,
      getSavedQuestionState,
      saveQuestionState,
      progress,
    }),
    [
      derived.submittedCount,
      derived.totalQuestions,
      derived.completed,
      registerQuestion,
      getSavedQuestionState,
      saveQuestionState,
      progress,
    ]
  );

  return (
    <LessonShellContext.Provider value={value}>
      <div>{children}</div>

      {derived.totalQuestions > 0 ? (
        <div
          style={{
            marginTop: "2rem",
            padding: "1rem 1.1rem",
            borderRadius: "14px",
            border: "1px solid rgba(120, 94, 58, 0.18)",
            background: "rgba(255, 250, 242, 0.75)",
            color: "#5a4630",
          }}
        >
          Progress: {derived.submittedCount} / {derived.totalQuestions}
          {derived.completed ? " completed" : ""}
        </div>
      ) : null}
    </LessonShellContext.Provider>
  );
}