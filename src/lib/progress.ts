"use client";

import { createClient } from "@/lib/supabase/client";
import type { LessonType } from "@/lib/content";

export type LessonProgressRow = {
  user_id: string;
  course_slug: string;
  lesson_slug: string;
  lesson_type: LessonType;
  completed: boolean;
  total_questions: number;
  submitted_questions: number;
  score: number | null;
  max_score: number | null;
  completed_at: string | null;
  updated_at: string;
};

export async function getLessonProgress(
  courseSlug: string,
  lessonSlug: string
) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("lesson_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("course_slug", courseSlug)
    .eq("lesson_slug", lessonSlug)
    .maybeSingle();

  if (error) throw error;
  return (data as LessonProgressRow | null) ?? null;
}

export async function getLessonQuestionProgress(
  courseSlug: string,
  lessonSlug: string
) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("lesson_question_progress")
    .select("question_id, submitted")
    .eq("user_id", user.id)
    .eq("course_slug", courseSlug)
    .eq("lesson_slug", lessonSlug)
    .eq("submitted", true);

  if (error) throw error;

  return (data ?? []).map((row) => row.question_id as string);
}

export async function markLessonQuestionSubmitted({
  courseSlug,
  lessonSlug,
  questionId,
}: {
  courseSlug: string;
  lessonSlug: string;
  questionId: string;
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const payload = {
    user_id: user.id,
    course_slug: courseSlug,
    lesson_slug: lessonSlug,
    question_id: questionId,
    submitted: true,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("lesson_question_progress")
    .upsert(payload, {
      onConflict: "user_id,course_slug,lesson_slug,question_id",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function saveLessonProgress({
  courseSlug,
  lessonSlug,
  submittedQuestions,
  totalQuestions,
}: {
  courseSlug: string;
  lessonSlug: string;
  submittedQuestions: number;
  totalQuestions: number;
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const completed =
    totalQuestions > 0 && submittedQuestions >= totalQuestions;

  const { data: existing } = await supabase
    .from("lesson_progress")
    .select("completed_at")
    .eq("user_id", user.id)
    .eq("course_slug", courseSlug)
    .eq("lesson_slug", lessonSlug)
    .maybeSingle();

  const payload = {
    user_id: user.id,
    course_slug: courseSlug,
    lesson_slug: lessonSlug,
    lesson_type: "lesson" as const,
    completed,
    total_questions: totalQuestions,
    submitted_questions: submittedQuestions,
    score: null,
    max_score: null,
    completed_at: completed
      ? existing?.completed_at ?? new Date().toISOString()
      : null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("lesson_progress")
    .upsert(payload, { onConflict: "user_id,course_slug,lesson_slug" })
    .select("*")
    .single();

  if (error) throw error;
  return data as LessonProgressRow;
}

export async function saveAssessmentResult({
  courseSlug,
  lessonSlug,
  lessonType,
  score,
  maxScore,
}: {
  courseSlug: string;
  lessonSlug: string;
  lessonType: "quiz" | "exam";
  score: number;
  maxScore: number;
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const now = new Date().toISOString();

  const progressPayload = {
    user_id: user.id,
    course_slug: courseSlug,
    lesson_slug: lessonSlug,
    lesson_type: lessonType,
    completed: true,
    total_questions: 0,
    submitted_questions: 0,
    score,
    max_score: maxScore,
    completed_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("lesson_progress")
    .upsert(progressPayload, { onConflict: "user_id,course_slug,lesson_slug" })
    .select("*")
    .single();

  if (error) throw error;

  await supabase.from("assessment_attempts").insert({
    user_id: user.id,
    course_slug: courseSlug,
    lesson_slug: lessonSlug,
    lesson_type: lessonType,
    score,
    max_score: maxScore,
  });

  return data as LessonProgressRow;
}

export type LessonQuestionStateRow = {
  user_id: string;
  course_slug: string;
  lesson_slug: string;
  question_id: string;
  submitted: boolean;
  question_type: string | null;
  selected_index: number | null;
  selected_indices: number[] | null;
  is_correct: boolean | null;
  feedback: any | null;
  updated_at: string;
};

export async function getLessonQuestionStates(
  courseSlug: string,
  lessonSlug: string
) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("lesson_question_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("course_slug", courseSlug)
    .eq("lesson_slug", lessonSlug);

  if (error) throw error;

  return (data ?? []) as LessonQuestionStateRow[];
}

export async function saveLessonQuestionState({
  courseSlug,
  lessonSlug,
  questionId,
  questionType,
  submitted,
  selectedIndex = null,
  selectedIndices = null,
  isCorrect = null,
  feedback = null,
}: {
  courseSlug: string;
  lessonSlug: string;
  questionId: string;
  questionType: string;
  submitted: boolean;
  selectedIndex?: number | null;
  selectedIndices?: number[] | null;
  isCorrect?: boolean | null;
  feedback?: any | null;
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const payload = {
    user_id: user.id,
    course_slug: courseSlug,
    lesson_slug: lessonSlug,
    question_id: questionId,
    question_type: questionType,
    submitted,
    selected_index: selectedIndex,
    selected_indices: selectedIndices,
    is_correct: isCorrect,
    feedback,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("lesson_question_progress")
    .upsert(payload, {
      onConflict: "user_id,course_slug,lesson_slug,question_id",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as LessonQuestionStateRow;
}

export async function deleteLessonState(
  courseSlug: string,
  lessonSlug: string,
  options?: { deleteAttempts?: boolean }
) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { error: lessonProgressError } = await supabase
    .from("lesson_progress")
    .delete()
    .eq("user_id", user.id)
    .eq("course_slug", courseSlug)
    .eq("lesson_slug", lessonSlug);

  if (lessonProgressError) {
    console.error("Failed to delete lesson progress:", lessonProgressError);
  }

  const { error: questionProgressError } = await supabase
    .from("lesson_question_progress")
    .delete()
    .eq("user_id", user.id)
    .eq("course_slug", courseSlug)
    .eq("lesson_slug", lessonSlug);

  if (questionProgressError) {
    console.error("Failed to delete lesson question progress:", questionProgressError);
  }

  if (options?.deleteAttempts) {
    const { error: attemptsError } = await supabase
      .from("assessment_attempts")
      .delete()
      .eq("user_id", user.id)
      .eq("course_slug", courseSlug)
      .eq("lesson_slug", lessonSlug);

    if (attemptsError) {
      console.error("Failed to delete assessment attempts:", attemptsError);
    }
  }
}

export async function clearLessonProgress(
  courseSlug: string,
  lessonSlug: string,
  lessonType: "lesson" | "quiz" | "exam"
) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("lesson_progress")
    .upsert(
      {
        user_id: user.id,
        course_slug: courseSlug,
        lesson_slug: lessonSlug,
        lesson_type: lessonType,
        completed: false,
        total_questions: 0,
        submitted_questions: 0,
        score: 0,
        max_score: 0,
        completed_at: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,course_slug,lesson_slug" }
    )
    .select()
    .single();

  if (error) {
    console.error("Failed to clear lesson progress:", error);
    return null;
  }

  return data;
}

export async function pruneLessonQuestionState(
  courseSlug: string,
  lessonSlug: string,
  validQuestionIds: string[]
) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  let query = supabase
    .from("lesson_question_progress")
    .delete()
    .eq("user_id", user.id)
    .eq("course_slug", courseSlug)
    .eq("lesson_slug", lessonSlug);

  if (validQuestionIds.length > 0) {
    const inList = `(${validQuestionIds.map((id) => JSON.stringify(id)).join(",")})`;
    query = query.not("question_id", "in", inList);
  }

  const { error } = await query;
  if (error) {
    console.error("Failed to prune stale lesson question state:", error);
  }
}