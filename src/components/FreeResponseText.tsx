"use client";

import { useEffect, useRef, useState } from "react";
import MathText from "@/components/MathText";
import MathEditor from "@/components/forum/MathEditor";
import { useAssessment } from "@/components/AssessmentShell";
import { useLessonShell } from "@/components/LessonShell";

type Feedback = {
  verdict: "correct" | "partially_correct" | "incorrect" | "unclear";
  summary: string;
  strengths: string[];
  issues: string[];
  next_hint: string;
};

function verdictToPoints(verdict: Feedback["verdict"]) {
  switch (verdict) {
    case "correct":
      return 2;
    case "partially_correct":
      return 1;
    default:
      return 0;
  }
}

type FreeResponseProps = {
  id: string;
  question?: string;
  placeholder?: string;
  rows?: number;
};

export default function FreeResponseText({
  id,
  question = "",
  placeholder = "Write your response (use \\ for LaTeX)...",
  rows = 8,
}: FreeResponseProps) {
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [error, setError] = useState("");

  const assessment = useAssessment();
  const lessonShell = useLessonShell();
  const inAssessmentMode = !!assessment;
  const progressShell = inAssessmentMode ? assessment : lessonShell;

  const submitted = inAssessmentMode ? assessment.submitted : !!feedback;
  const questionId = id;

  const hasAutoSubmittedRef = useRef(false);

  async function handleSubmit() {
    if (!answer.trim()) {
      setError("Please enter a response before submitting.");
      return;
    }

    setLoading(true);
    setError("");
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.append("question", question);
      formData.append("responseText", answer);

      const res = await fetch("/api/free-response-feedback", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to get feedback.");
      }

      setFeedback(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!progressShell) return;

    const saved = progressShell.getSavedQuestionState(questionId);
    if (!saved) return;

    if (saved.feedback) {
      setFeedback(saved.feedback);
    }
  }, [progressShell, questionId]);

  useEffect(() => {
    if (!progressShell) return;
    progressShell.registerQuestion(questionId);
  }, [progressShell, questionId]);

  useEffect(() => {
    if (!inAssessmentMode) return;
    if (!submitted) return;
    if (hasAutoSubmittedRef.current) return;
    if (feedback) return;

    hasAutoSubmittedRef.current = true;

    if (!answer.trim()) {
      setError(
        "No response was entered for this free response. You will not receive credit for this question."
      );
      return;
    }

    void handleSubmit();
  }, [inAssessmentMode, submitted, answer, feedback]);

  useEffect(() => {
    if (!assessment) return;

    if (feedback) {
      const pts = verdictToPoints(feedback.verdict);
      assessment.registerFR(questionId, true, pts, false);
      return;
    }

    if (!answer.trim()) {
      assessment.registerFR(questionId, false, 0, false);
      return;
    }

    assessment.registerFR(questionId, true, 0, true);
  }, [assessment, questionId, answer, feedback]);

  useEffect(() => {
    if (!progressShell) return;
    if (!feedback) return;

    progressShell.saveQuestionState({
      questionId,
      questionType: "free_response_text",
      submitted: true,
      feedback,
    });
  }, [progressShell, questionId, feedback]);

  const verdictConfig: Record<
    Feedback["verdict"],
    {
      label: string;
      bg: string;
      border: string;
      text: string;
      icon: string;
    }
  > = {
    correct: {
      label: "Correct",
      bg: "rgba(226, 242, 228, 0.95)",
      border: "1px solid rgba(69, 122, 76, 0.35)",
      text: "#234b2b",
      icon: "✓",
    },
    partially_correct: {
      label: "Partially correct",
      bg: "rgba(255, 244, 214, 0.95)",
      border: "1px solid rgba(181, 137, 0, 0.35)",
      text: "#7a5a00",
      icon: "◐",
    },
    incorrect: {
      label: "Incorrect",
      bg: "rgba(250, 236, 232, 0.95)",
      border: "1px solid rgba(162, 72, 72, 0.30)",
      text: "#6a2a2a",
      icon: "✕",
    },
    unclear: {
      label: "Unclear",
      bg: "rgba(235, 239, 245, 0.95)",
      border: "1px solid rgba(100, 116, 139, 0.28)",
      text: "#475569",
      icon: "?",
    },
  };

  const verdictStyle = feedback ? verdictConfig[feedback.verdict] : null;

  return (
    <div
      style={{
        margin: "1.75rem 0",
        padding: "1.25rem",
        border: "1px solid rgba(120, 94, 58, 0.28)",
        borderRadius: "18px",
        background:
          "linear-gradient(180deg, rgba(255,248,235,0.78), rgba(244,232,210,0.72))",
        boxShadow: "0 8px 24px rgba(60, 40, 10, 0.08)",
        color: "#3e2f1c",
      }}
    >
      <p style={{ fontWeight: 700 }}>Free response</p>

      <p style={{ lineHeight: 1.55 }}>
        <MathText text={question} />
      </p>

      <div
        style={{
          opacity: submitted || loading ? 0.6 : 1,
          pointerEvents: submitted || loading ? "none" : "auto",
        }}
      >
        <MathEditor
          name={`fr-${id}`}
          value={answer}
          onChange={(val: string) => {
            setAnswer(val);
            setFeedback(null);
            setError("");
          }}
          placeholderText={placeholder}
          minHeight={rows * 24}
          theme="paper"
        />
      </div>

      {answer.trim() && (
        <div style={{ marginTop: "0.75rem" }}>
          <strong>Preview:</strong>
          <MathText text={answer} />
        </div>
      )}

      {!inAssessmentMode && (
        <button
          onClick={handleSubmit}
          disabled={!answer.trim() || loading}
        >
          {loading ? "Getting feedback..." : "Submit"}
        </button>
      )}

      {error && <div>{error}</div>}

      {feedback && verdictStyle && (
          <div
            style={{
              marginTop: "1rem",
              padding: "0.9rem 1rem",
              borderRadius: "14px",
              border: verdictStyle.border,
              background: verdictStyle.bg,
              color: verdictStyle.text,
            }}
          >
            <p
              style={{
                margin: 0,
                fontWeight: 700,
                marginBottom: "0.4rem",
              }}
            >
              {verdictStyle.icon} {verdictStyle.label}
            </p>

            <div style={{ lineHeight: 1.55 }}>
              <MathText text={feedback.summary} />
            </div>

            {feedback.verdict !== "correct" && feedback.strengths?.length > 0 && (
              <ul style={{ marginTop: "0.5rem" }}>
                {feedback.strengths.map((s, i) => (
                  <li key={i}>
                    <MathText text={s} />
                  </li>
                ))}
              </ul>
            )}

            {feedback.verdict !== "correct" && feedback.issues?.length > 0 && (
              <ul style={{ marginTop: "0.5rem" }}>
                {feedback.issues.map((s, i) => (
                  <li key={i}>
                    <MathText text={s} />
                  </li>
                ))}
              </ul>
            )}

            {feedback.verdict !== "correct" && feedback.next_hint && (
              <div style={{ marginTop: "0.5rem", fontStyle: "italic" }}>
                <MathText text={feedback.next_hint} />
              </div>
            )}
          </div>
        )}
    </div>
  );
}