"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import MathText from "@/components/MathText";
import { useAssessment } from "@/components/AssessmentShell";
import { useLessonShell } from "@/components/LessonShell";

type MultipleAnswerProps = {
  id: string;
  question?: string;
  options?: string;
  correctIndices?: string;
  explanation?: string;
};

function areSameIndices(a: number[], b: number[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export default function MultipleAnswer({
  id,
  question = "",
  options = "",
  correctIndices = "",
  explanation,
}: MultipleAnswerProps) {
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [localSubmitted, setLocalSubmitted] = useState(false);

  const questionId = id;

  const assessment = useAssessment();
  const lessonShell = useLessonShell();
  const inAssessmentMode = !!assessment;
  const progressShell = inAssessmentMode ? assessment : lessonShell;

  const submitted = inAssessmentMode ? assessment.submitted : localSubmitted;

  const hasHydratedRef = useRef(false);

  const parsedOptions = useMemo(() => {
    return options
      .split("||")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [options]);

  const parsedCorrectIndices = useMemo(() => {
    return Array.from(
      new Set(
        correctIndices
          .split("||")
          .map((s) => Number.parseInt(s.trim(), 10))
          .filter((n) => Number.isInteger(n))
      )
    ).sort((a, b) => a - b);
  }, [correctIndices]);

  const hasValidCorrectIndices =
    parsedCorrectIndices.length > 0 &&
    parsedCorrectIndices.every((i) => i >= 0 && i < parsedOptions.length);

  const normalizedSelected = [...selectedIndices].sort((a, b) => a - b);

  const answerIsCorrect =
    hasValidCorrectIndices &&
    areSameIndices(normalizedSelected, parsedCorrectIndices);

  const isCorrect = submitted && answerIsCorrect;

  useEffect(() => {
    if (!progressShell) {
      hasHydratedRef.current = true;
      return;
    }

    const saved = progressShell.getSavedQuestionState(questionId);

    if (saved && Array.isArray(saved.selected_indices)) {
      setSelectedIndices(saved.selected_indices);
    }

    if (saved?.submitted) {
      setLocalSubmitted(true);
    }

    hasHydratedRef.current = true;
  }, [progressShell, questionId]);

  useEffect(() => {
    if (!progressShell) return;
    progressShell.registerQuestion(questionId);
  }, [progressShell, questionId]);

  useEffect(() => {
    if (!assessment) return;
    if (!hasHydratedRef.current) return;

    assessment.registerMC(
      questionId,
      selectedIndices.length > 0,
      answerIsCorrect
    );
  }, [assessment, questionId, selectedIndices, answerIsCorrect]);

  useEffect(() => {
    if (!progressShell) return;
    if (!submitted) return;
    if (!hasHydratedRef.current) return;

    if (inAssessmentMode && normalizedSelected.length === 0) return;

    progressShell.saveQuestionState({
      questionId,
      questionType: "multiple_answer",
      submitted: true,
      selectedIndices: normalizedSelected,
      isCorrect: answerIsCorrect,
    });
  }, [
    progressShell,
    questionId,
    submitted,
    normalizedSelected,
    answerIsCorrect,
    inAssessmentMode,
  ]);

  const toggleIndex = (index: number) => {
    if (submitted) return;

    setSelectedIndices((prev) => {
      const exists = prev.includes(index);
      if (exists) {
        return prev.filter((i) => i !== index);
      }
      return [...prev, index].sort((a, b) => a - b);
    });

    if (!inAssessmentMode) {
      setLocalSubmitted(false);
    }
  };

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
          marginBottom: "1rem",
          fontWeight: 700,
          fontSize: "1.05rem",
          lineHeight: 1.5,
          color: "#3b2c1b",
        }}
      >
        <MathText text={question} />
      </p>

      <div style={{ display: "grid", gap: "0.8rem" }}>
        {parsedOptions.map((option, index) => {
          const isSelected = selectedIndices.includes(index);
          const isWrongSelected =
            submitted &&
            isSelected &&
            (!hasValidCorrectIndices || !parsedCorrectIndices.includes(index));

          const isRightSelected =
            submitted &&
            isSelected &&
            hasValidCorrectIndices &&
            parsedCorrectIndices.includes(index);

          let border = "1px solid rgba(120, 94, 58, 0.20)";
          let background = "rgba(255, 252, 246, 0.9)";
          let color = "#3e2f1c";

          if (isSelected && !submitted) {
            border = "1px solid rgba(140, 110, 68, 0.55)";
            background = "rgba(245, 234, 214, 0.95)";
          }

          if (isRightSelected) {
            border = "1px solid rgba(69, 122, 76, 0.55)";
            background = "rgba(226, 242, 228, 0.95)";
            color = "#234b2b";
          }

          if (isWrongSelected) {
            border = "1px solid rgba(162, 72, 72, 0.5)";
            background = "rgba(248, 228, 228, 0.96)";
            color = "#6b2222";
          }

          return (
            <label
              key={`${option}-${index}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                cursor: submitted ? "default" : "pointer",
                padding: "0.85rem 0.95rem",
                borderRadius: "14px",
                border,
                background,
                color,
                transition: "all 0.18s ease",
              }}
            >
              <input
                type="checkbox"
                checked={isSelected}
                disabled={submitted}
                onChange={() => toggleIndex(index)}
                style={{
                  accentColor: "#8b6b3f",
                  width: "1rem",
                  height: "1rem",
                  margin: 0,
                  flexShrink: 0,
                }}
              />

              <span style={{ flex: 1, lineHeight: 1.45 }}>
                <MathText text={option} />
              </span>

              {isRightSelected ? (
                <span
                  aria-label="Correct"
                  title="Correct"
                  style={{
                    fontWeight: 700,
                    fontSize: "1rem",
                    color: "#2f6b3b",
                  }}
                >
                  ✓
                </span>
              ) : null}

              {isWrongSelected ? (
                <span
                  aria-label="Incorrect"
                  title="Incorrect"
                  style={{
                    fontWeight: 700,
                    fontSize: "1rem",
                    color: "#9b2c2c",
                  }}
                >
                  ✕
                </span>
              ) : null}
            </label>
          );
        })}
      </div>

      {!inAssessmentMode ? (
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            marginTop: "1rem",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => setLocalSubmitted(true)}
            disabled={selectedIndices.length === 0}
            style={{
              padding: "0.68rem 1rem",
              borderRadius: "12px",
              border: "1px solid #8f7248",
              background:
                selectedIndices.length === 0
                  ? "rgba(201, 185, 161, 0.55)"
                  : "linear-gradient(180deg, #a68252, #8c6a40)",
              color: selectedIndices.length === 0 ? "#6f6252" : "#fffaf2",
              fontWeight: 700,
              cursor: selectedIndices.length === 0 ? "not-allowed" : "pointer",
              boxShadow:
                selectedIndices.length === 0
                  ? "none"
                  : "0 4px 12px rgba(88, 58, 24, 0.18)",
            }}
          >
            Check answer
          </button>

          <button
            onClick={() => {
              setSelectedIndices([]);
              setLocalSubmitted(false);

              if (lessonShell) {
                lessonShell.saveQuestionState({
                  questionId,
                  questionType: "multiple_answer",
                  submitted: false,
                  selectedIndices: [],
                  isCorrect: null,
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
              cursor: submitted ? "default" : "pointer",
            }}
          >
            Reset
          </button>
        </div>
      ) : null}

      {submitted && selectedIndices.length > 0 ? (
        <div
          style={{
            marginTop: "1rem",
            padding: "0.9rem 1rem",
            borderRadius: "14px",
            border: isCorrect
              ? "1px solid rgba(69, 122, 76, 0.35)"
              : "1px solid rgba(162, 72, 72, 0.30)",
            background: isCorrect
              ? "rgba(232, 244, 233, 0.92)"
              : "rgba(250, 236, 232, 0.92)",
            color: isCorrect ? "#234b2b" : "#6a2a2a",
          }}
        >
          <p
            style={{
              margin: 0,
              fontWeight: 700,
              marginBottom: explanation && isCorrect ? "0.45rem" : 0,
              color: isCorrect ? "#234b2b" : "#6a2a2a",
            }}
          >
            {isCorrect
              ? "✓ Correct."
              : inAssessmentMode
              ? "✕ Not quite."
              : "✕ Not quite. Try again."}
          </p>

          {explanation && isCorrect ? (
            <p
              style={{
                margin: 0,
                lineHeight: 1.55,
                opacity: 0.92,
                color: "#5a4630",
              }}
            >
              {explanation}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}