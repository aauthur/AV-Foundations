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
  saveAssessmentResult,
  saveLessonQuestionState,
  deleteLessonState,
  type LessonProgressRow,
  type LessonQuestionStateRow,
} from "@/lib/progress";

type QuestionRecord = {
  answered: boolean;
  points: number;
  maxPoints: number;
  pending: boolean;
};

type AssessmentContextType = {
  submitted: boolean;
  hydrated: boolean;
  submitAssessment: () => void;
  retryAssessment: () => void;
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
  registerMC: (id: string, answered: boolean, isCorrect: boolean) => void;
  registerFR: (
    id: string,
    answered: boolean,
    points?: number,
    pending?: boolean
  ) => void;
};

const AssessmentContext = createContext<AssessmentContextType | null>(null);

export function useAssessment() {
  return useContext(AssessmentContext);
}

type Props = {
  label: "Quiz" | "Exam";
  courseSlug: string;
  lessonSlug: string;
  children: React.ReactNode;
};

function inferQuestionRecordFromSavedState(
  row: LessonQuestionStateRow | undefined
): QuestionRecord | null {
  if (!row) return null;

  if (row.question_type === "multiple_choice") {
    return {
      answered: typeof row.selected_index === "number",
      points: row.is_correct ? 1 : 0,
      maxPoints: 1,
      pending: false,
    };
  }

  if (row.question_type === "multiple_answer") {
    const selected = Array.isArray(row.selected_indices)
      ? row.selected_indices
      : [];
    return {
      answered: selected.length > 0,
      points: row.is_correct ? 1 : 0,
      maxPoints: 1,
      pending: false,
    };
  }

  if (
    row.question_type === "free_response_text" ||
    row.question_type === "free_response_file"
  ) {
    const verdict = row.feedback?.verdict;
    const points =
      verdict === "correct" ? 2 : verdict === "partially_correct" ? 1 : 0;

    return {
      answered: !!row.feedback,
      points,
      maxPoints: 2,
      pending: false,
    };
  }

  return null;
}

export default function AssessmentShell({
  label,
  courseSlug,
  lessonSlug,
  children,
}: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [version, setVersion] = useState(0);
  const [saving, setSaving] = useState(false);
  const [attemptKey, setAttemptKey] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [progress, setProgress] = useState<LessonProgressRow | null>(null);

  const registeredQuestionsRef = useRef<Set<string>>(new Set());
  const savedQuestionStatesRef = useRef<Record<string, LessonQuestionStateRow>>(
    {}
  );
  const questionsRef = useRef<Record<string, QuestionRecord>>({});
  const lastSavedRef = useRef<string | null>(null);
  const submittedThisSessionRef = useRef(false);

  useEffect(() => {
    let active = true;

    setHydrated(false);

    (async () => {
      try {
        const [progressRow, questionStates] = await Promise.all([
          getLessonProgress(courseSlug, lessonSlug),
          getLessonQuestionStates(courseSlug, lessonSlug),
        ]);

        if (!active) return;

        setProgress(progressRow);

        const byId = Object.fromEntries(
          questionStates.map((row) => [row.question_id, row])
        ) as Record<string, LessonQuestionStateRow>;

        savedQuestionStatesRef.current = byId;

        const seededQuestions: Record<string, QuestionRecord> = {};
        const registeredIds = new Set<string>();

        for (const row of questionStates) {
          registeredIds.add(row.question_id);

          const seeded = inferQuestionRecordFromSavedState(row);
          if (seeded) {
            seededQuestions[row.question_id] = seeded;
          }
        }

        questionsRef.current = seededQuestions;
        registeredQuestionsRef.current = registeredIds;
        submittedThisSessionRef.current = false;

        if (progressRow?.completed) {
          setSubmitted(true);
        } else {
          setSubmitted(false);
        }

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

  const registerQuestion = useCallback((questionId: string) => {
    if (registeredQuestionsRef.current.has(questionId)) return;
    registeredQuestionsRef.current.add(questionId);
    setVersion((v) => v + 1);
  }, []);

  const getSavedQuestionState = useCallback((questionId: string) => {
    return savedQuestionStatesRef.current[questionId] ?? null;
  }, []);

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

  const registerMC = useCallback(
    (id: string, answered: boolean, isCorrect: boolean) => {
      const nextRecord = {
        answered,
        points: answered && isCorrect ? 1 : 0,
        maxPoints: 1,
        pending: false,
      };

      const prevRecord = questionsRef.current[id];

      if (
        prevRecord &&
        prevRecord.answered === nextRecord.answered &&
        prevRecord.points === nextRecord.points &&
        prevRecord.maxPoints === nextRecord.maxPoints &&
        prevRecord.pending === nextRecord.pending
      ) {
        return;
      }

      questionsRef.current[id] = nextRecord;
      setVersion((v) => v + 1);
    },
    []
  );

  const registerFR = useCallback(
    (id: string, answered: boolean, points = 0, pending = false) => {
      const nextRecord = {
        answered,
        points: answered && !pending ? points : 0,
        maxPoints: 2,
        pending,
      };

      const prevRecord = questionsRef.current[id];

      if (
        prevRecord &&
        prevRecord.answered === nextRecord.answered &&
        prevRecord.points === nextRecord.points &&
        prevRecord.maxPoints === nextRecord.maxPoints &&
        prevRecord.pending === nextRecord.pending
      ) {
        return;
      }

      questionsRef.current[id] = nextRecord;
      setVersion((v) => v + 1);
    },
    []
  );

  const score = useMemo(() => {
    const registeredIds = Array.from(registeredQuestionsRef.current);

    const questions = registeredIds
      .map((id) => questionsRef.current[id])
      .filter((q): q is QuestionRecord => !!q);

    return {
      earned: questions.reduce((sum, q) => sum + q.points, 0),
      total: questions.reduce((sum, q) => sum + q.maxPoints, 0),
      unansweredQuestions: questions.filter((q) => !q.answered).length,
      pendingQuestions: questions.filter((q) => q.pending).length,
    };
  }, [version]);

  const submitAssessment = useCallback(() => {
    const questions = Object.values(questionsRef.current);
    const unansweredQuestions = questions.filter((q) => !q.answered).length;

    if (unansweredQuestions > 0) {
      const confirmed = window.confirm(
        `You have ${unansweredQuestions} unanswered question${
          unansweredQuestions === 1 ? "" : "s"
        }. These will receive 0 points. Are you sure you want to submit?`
      );

      if (!confirmed) return;
    }

    submittedThisSessionRef.current = true;
    lastSavedRef.current = null;
    setSubmitted(true);
  }, []);

  const retryAssessment = useCallback(async () => {
    await deleteLessonState(courseSlug, lessonSlug);

    setProgress(null);
    setSubmitted(false);
    setSaving(false);
    setVersion(0);
    questionsRef.current = {};
    registeredQuestionsRef.current = new Set();
    savedQuestionStatesRef.current = {};
    lastSavedRef.current = null;
    submittedThisSessionRef.current = false;
    setAttemptKey((k) => k + 1);
  }, [courseSlug, lessonSlug]);

  useEffect(() => {
    if (!hydrated) return;
    if (!submitted) return;
    if (!submittedThisSessionRef.current) return;
    if (score.total === 0) return;
    if (score.pendingQuestions > 0) return;

    const saveKey = `${attemptKey}:${score.earned}/${score.total}:${score.unansweredQuestions}`;
    if (lastSavedRef.current === saveKey) return;

    lastSavedRef.current = saveKey;
    setSaving(true);

    void saveAssessmentResult({
      courseSlug,
      lessonSlug,
      lessonType: label.toLowerCase() as "quiz" | "exam",
      score: score.earned,
      maxScore: score.total,
    }).finally(() => {
      setSaving(false);
      submittedThisSessionRef.current = false;
      setProgress((prev) =>
        prev
          ? {
              ...prev,
              completed: true,
              score: score.earned,
              max_score: score.total,
            }
          : prev
      );
    });
  }, [
    hydrated,
    submitted,
    score.earned,
    score.total,
    score.unansweredQuestions,
    score.pendingQuestions,
    courseSlug,
    lessonSlug,
    label,
    attemptKey,
  ]);

  const contextValue = useMemo(
    () => ({
      submitted,
      hydrated,
      submitAssessment,
      retryAssessment,
      registerQuestion,
      getSavedQuestionState,
      saveQuestionState,
      registerMC,
      registerFR,
    }),
    [
      submitted,
      hydrated,
      submitAssessment,
      retryAssessment,
      registerQuestion,
      getSavedQuestionState,
      saveQuestionState,
      registerMC,
      registerFR,
    ]
  );

  return (
    <AssessmentContext.Provider value={contextValue}>
      {!hydrated ? (
        <div style={{ marginTop: "1rem", opacity: 0.75 }}>Loading...</div>
      ) : (
        <>
          <div key={attemptKey}>{children}</div>

          {!submitted ? (
            <div style={{ marginTop: "2rem" }}>
              <button
                onClick={submitAssessment}
                style={{
                  padding: "0.8rem 1.1rem",
                  borderRadius: "12px",
                  border: "1px solid #8f7248",
                  background: "linear-gradient(180deg, #a68252, #8c6a40)",
                  color: "#fffaf2",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(88, 58, 24, 0.18)",
                }}
              >
                Submit {label}
              </button>
            </div>
          ) : (
            <div
              style={{
                marginTop: "2rem",
                padding: "1rem 1.1rem",
                borderRadius: "14px",
                border: "1px solid rgba(120, 94, 58, 0.28)",
                background: "rgba(255, 250, 242, 0.9)",
                color: "#3e2f1c",
              }}
            >
              <div style={{ fontWeight: 700 }}>
                Score: {score.earned} / {score.total}
              </div>

              {score.unansweredQuestions > 0 ? (
                <div style={{ marginTop: "0.4rem", color: "#8a3b2e" }}>
                  Unanswered: {score.unansweredQuestions}
                </div>
              ) : null}

              {score.pendingQuestions > 0 ? (
                <div style={{ marginTop: "0.4rem", opacity: 0.75 }}>
                  Grading {score.pendingQuestions} free-response question
                  {score.pendingQuestions === 1 ? "" : "s"}...
                </div>
              ) : null}

              {saving ? (
                <div style={{ marginTop: "0.4rem", opacity: 0.75 }}>
                  Saving result...
                </div>
              ) : null}

              <div style={{ marginTop: "0.9rem" }}>
                <button
                  onClick={retryAssessment}
                  style={{
                    padding: "0.68rem 1rem",
                    borderRadius: "12px",
                    border: "1px solid rgba(120, 94, 58, 0.28)",
                    background: "rgba(255, 250, 242, 0.8)",
                    color: "#5c4730",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Retry {label.toLowerCase()}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </AssessmentContext.Provider>
  );
}