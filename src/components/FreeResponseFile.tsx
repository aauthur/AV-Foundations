"use client";

import { useEffect, useRef, useState } from "react";
import MathText from "@/components/MathText";
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
};

export default function FreeResponseFile({
  id,
  question = "",
}: FreeResponseProps) {
  const [file, setFile] = useState<File | null>(null);
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
    if (!file) {
      setError("Please upload an image of your work.");
      return;
    }

    setLoading(true);
    setError("");
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.append("question", question);
      formData.append("image", file);

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

    if (!file) {
      setError(
        "No work was uploaded for this free response. You will not receive credit for this question."
      );
      return;
    }

    void handleSubmit();
  }, [inAssessmentMode, submitted, file, feedback]);

  useEffect(() => {
    if (!assessment) return;

    if (feedback) {
      const pts = verdictToPoints(feedback.verdict);
      assessment.registerFR(questionId, true, pts, false);
      return;
    }

    if (!file) {
      assessment.registerFR(questionId, false, 0, false);
      return;
    }

    assessment.registerFR(questionId, true, 0, true);
  }, [assessment, questionId, file, feedback]);

  useEffect(() => {
    if (!progressShell) return;
    if (!feedback) return;

    progressShell.saveQuestionState({
      questionId,
      questionType: "free_response_file",
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
      <p
        style={{
          marginTop: 0,
          marginBottom: "0.6rem",
          fontWeight: 700,
          fontSize: "1.05rem",
          color: "#3b2c1b",
        }}
      >
        Free response
      </p>

      <p style={{ lineHeight: 1.55 }}>
        <MathText text={question} />
      </p>

      {inAssessmentMode && assessment?.hydrated && !submitted && !feedback ? (
        <div
          style={{
            marginTop: "0.75rem",
            padding: "0.85rem 0.95rem",
            borderRadius: "14px",
            background: "rgba(255, 244, 214, 0.75)",
            border: "1px solid rgba(181, 137, 0, 0.25)",
            color: "#6a5200",
            lineHeight: 1.5,
          }}
        >
          Upload your work before submitting the quiz. This question will be
          submitted automatically when you submit the assessment. If you do not
          upload work, you will not receive credit.
        </div>
      ) : null}

      <div style={{ marginTop: "1rem" }}>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={submitted || loading}
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setFeedback(null);
            setError("");
          }}
        />
      </div>

      {file ? (
        <p style={{ marginTop: "0.75rem", color: "#5a4630" }}>
          Selected file: <strong>{file.name}</strong>
        </p>
      ) : null}

      {!inAssessmentMode ? (
        <div
          style={{
            marginTop: "1rem",
            display: "flex",
            gap: "0.75rem",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={handleSubmit}
            disabled={!file || loading}
            style={{
              padding: "0.68rem 1rem",
              borderRadius: "12px",
              border: "1px solid #8f7248",
              background:
                !file || loading
                  ? "rgba(201, 185, 161, 0.55)"
                  : "linear-gradient(180deg, #a68252, #8c6a40)",
              color: !file || loading ? "#6f6252" : "#fffaf2",
              fontWeight: 700,
              cursor: !file || loading ? "not-allowed" : "pointer",
              boxShadow:
                !file || loading
                  ? "none"
                  : "0 4px 12px rgba(88, 58, 24, 0.18)",
            }}
          >
            {loading ? "Getting feedback..." : "Submit"}
          </button>

          {feedback ? (
            <button
              onClick={() => {
                setFile(null);
                setFeedback(null);
                setError("");

                if (lessonShell) {
                  lessonShell.saveQuestionState({
                    questionId,
                    questionType: "free_response_file",
                    submitted: false,
                    feedback: null,
                  });
                }
              }}
              style={{
                padding: "0.68rem 1rem",
                borderRadius: "12px",
                border: "1px solid rgba(120, 94, 58, 0.28)",
                background: "rgba(255, 250, 242, 0.8)",
                color: "#5c4730",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Reset
            </button>
          ) : null}
        </div>
      ) : null}

      {submitted && loading ? (
        <div
          style={{
            marginTop: "1rem",
            padding: "0.9rem 1rem",
            borderRadius: "14px",
            background: "rgba(235, 239, 245, 0.92)",
            border: "1px solid rgba(100, 116, 139, 0.20)",
            color: "#475569",
          }}
        >
          Submitting free response...
        </div>
      ) : null}

      {error && !feedback ? (
        <div
          style={{
            marginTop: "1rem",
            padding: "0.9rem 1rem",
            borderRadius: "14px",
            background: "rgba(250, 236, 232, 0.92)",
            border: "1px solid rgba(162, 72, 72, 0.30)",
            color: "#6a2a2a",
          }}
        >
          {error}
        </div>
      ) : null}

      {feedback ? (
        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            borderRadius: "14px",
            background: "rgba(255, 252, 246, 0.88)",
            border: "1px solid rgba(120, 94, 58, 0.18)",
          }}
        >
          <p style={{ marginTop: 0, fontWeight: 700, color: "#3b2c1b" }}>
            Feedback
          </p>

          {verdictStyle ? (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.55rem",
                padding: "0.6rem 0.85rem",
                borderRadius: "999px",
                background: verdictStyle.bg,
                border: verdictStyle.border,
                color: verdictStyle.text,
                fontWeight: 700,
                marginBottom: "0.9rem",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "1.2rem",
                  height: "1.2rem",
                  fontSize: "0.95rem",
                  lineHeight: 1,
                }}
              >
                {verdictStyle.icon}
              </span>
              <span>{verdictStyle.label}</span>
            </div>
          ) : null}

          <div style={{ color: "#5a4630" }}>
            <strong>Summary:</strong> <MathText text={feedback.summary} />
          </div>

          {feedback.strengths.length > 0 ? (
            <>
              <p
                style={{
                  fontWeight: 700,
                  color: "#3b2c1b",
                  marginBottom: "0.35rem",
                }}
              >
                Strengths
              </p>
              <ul style={{ marginTop: 0, color: "#5a4630" }}>
                {feedback.strengths.map((item, i) => (
                  <li key={i}>
                    <MathText text={item} />
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          {feedback.issues.length > 0 ? (
            <>
              <p
                style={{
                  fontWeight: 700,
                  color: "#3b2c1b",
                  marginBottom: "0.35rem",
                }}
              >
                Issues
              </p>
              <ul style={{ marginTop: 0, color: "#5a4630" }}>
                {feedback.issues.map((item, i) => (
                  <li key={i}>
                    <MathText text={item} />
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          {feedback.next_hint ? (
            <div style={{ color: "#5a4630" }}>
              <strong>Next hint:</strong> <MathText text={feedback.next_hint} />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}