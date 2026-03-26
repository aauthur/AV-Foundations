import { createClient } from "@/lib/supabase/server";

export type LessonProgressRow = {
  user_id: string;
  course_slug: string;
  lesson_slug: string;
  lesson_type: "lesson" | "quiz" | "exam";
  completed: boolean;
  total_questions: number;
  submitted_questions: number;
  score: number | null;
  max_score: number | null;
  completed_at: string | null;
  updated_at: string;
};

export async function getCourseProgress(courseSlug: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("lesson_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("course_slug", courseSlug);

  if (error) throw error;

  return (data ?? []) as LessonProgressRow[];
}