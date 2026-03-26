import { notFound } from "next/navigation";
import { getCourse } from "@/lib/content";
import { getCourseProgress } from "@/lib/progress-server";

type Props = {
  params: Promise<{ courseSlug: string }>;
};

type ProgressRow = {
  lesson_slug: string;
  lesson_type: "lesson" | "quiz" | "exam";
  completed: boolean;
  submitted_questions: number;
  total_questions: number;
  score: number | null;
  max_score: number | null;
};

function isStarted(progress?: ProgressRow) {
  if (!progress) return false;

  if (progress.completed) return true;

  if (progress.lesson_type === "lesson") {
    return (
      progress.total_questions > 0 ||
      progress.submitted_questions > 0
    );
  }

  if (progress.lesson_type === "quiz" || progress.lesson_type === "exam") {
    return (
      (progress.score ?? 0) > 0 ||
      (progress.max_score ?? 0) > 0
    );
  }

  return false;
}

function getLessonStatus(progress?: ProgressRow) {
  if (!progress || !isStarted(progress)) {
    return {
      label: "Not started",
      color: "#7a6852",
      bg: "rgba(255,252,246,0.9)",
    };
  }

  if (progress.completed) {
    if (
      (progress.lesson_type === "quiz" || progress.lesson_type === "exam") &&
      progress.score !== null &&
      progress.max_score !== null
    ) {
      return {
        label: `Completed · ${progress.score}/${progress.max_score}`,
        color: "#234b2b",
        bg: "rgba(226, 242, 228, 0.95)",
      };
    }

    return {
      label: "Completed",
      color: "#234b2b",
      bg: "rgba(226, 242, 228, 0.95)",
    };
  }

  if (progress.lesson_type === "lesson" && progress.total_questions > 0) {
    return {
      label: `In progress · ${progress.submitted_questions}/${progress.total_questions}`,
      color: "#8b6b3f",
      bg: "rgba(255, 244, 214, 0.95)",
    };
  }

  return {
    label: "In progress",
    color: "#8b6b3f",
    bg: "rgba(255, 244, 214, 0.95)",
  };
}

export default async function CoursePage({ params }: Props) {
  const { courseSlug } = await params;

  let course;
  try {
    course = await getCourse(courseSlug);
  } catch {
    notFound();
  }

  const progressRows = (await getCourseProgress(course.slug)) as ProgressRow[];

  const progressMap = new Map(
    progressRows.map((row) => [row.lesson_slug, row])
  );

  const totalLessons = course.lessons.length;
  const completedLessons = course.lessons.filter((lesson) => {
    const row = progressMap.get(lesson.slug);
    return !!row?.completed;
  }).length;

  const completionPercent =
    totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;

  const firstStartedLesson =
    course.lessons.find((lesson) => isStarted(progressMap.get(lesson.slug))) ?? null;

  const launchLesson = firstStartedLesson ?? course.lessons?.[0];
  const launchLabel = firstStartedLesson ? "Continue course →" : "Start course →";

  return (
    <main
      className="container"
      style={{ paddingTop: "2rem", paddingBottom: "2.5rem" }}
    >
      <a href="/courses" className="linkMuted">
        ← Back to courses
      </a>

      <h1 style={{ marginTop: "1rem" }}>{course.title}</h1>

      {course.description && (
        <p
          style={{
            maxWidth: 700,
            opacity: 0.8,
            lineHeight: 1.7,
            marginTop: "0.75rem",
          }}
        >
          {course.description}
        </p>
      )}

      {launchLesson ? (
        <div style={{ marginTop: "1.5rem" }}>
          <a
            href={`/courses/${course.slug}/${launchLesson.slug}`}
            className="btn btnPrimary"
            style={{ borderRadius: 12 }}
          >
            {launchLabel}
          </a>
        </div>
      ) : (
        <p style={{ opacity: 0.7, marginTop: "1.25rem" }}>
          No lessons available yet.
        </p>
      )}

      <section style={{ marginTop: "2rem" }}>
        <div className="paperCard" style={{ padding: "1rem 1.1rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "1rem",
              marginBottom: "0.65rem",
              flexWrap: "wrap",
            }}
          >
            <div style={{ fontWeight: 800, color: "#3b2c1b" }}>
              Course progress
            </div>
            <div style={{ color: "#5a4630", fontWeight: 700 }}>
              {completedLessons} / {totalLessons} completed
            </div>
          </div>

          <div
            style={{
              width: "100%",
              height: "12px",
              borderRadius: "999px",
              background: "rgba(120, 94, 58, 0.12)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${completionPercent}%`,
                height: "100%",
                borderRadius: "999px",
                background: "linear-gradient(90deg, #1aa0dc, #4db8e8)",
                transition: "width 0.25s ease",
              }}
            />
          </div>

          <div
            style={{
              marginTop: "0.65rem",
              color: "#5a4630",
              fontSize: "0.95rem",
            }}
          >
            {completionPercent}% complete
          </div>
        </div>
      </section>

      <section style={{ marginTop: "2.25rem" }}>
        <h2>Lessons</h2>

        <div style={{ display: "grid", gap: "0.9rem", marginTop: "1rem" }}>
          {course.lessons.map((lesson) => {
            const progress = progressMap.get(lesson.slug);
            const isCompleted = !!progress?.completed;
            const status = getLessonStatus(progress);

            return (
              <a
                key={lesson.slug}
                href={`/courses/${course.slug}/${lesson.slug}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div
                  className="paperCard"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1rem",
                    padding: "1rem 1.1rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.85rem",
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: "1.8rem",
                        height: "1.8rem",
                        borderRadius: "999px",
                        fontSize: "0.9rem",
                        fontWeight: 800,
                        border: isCompleted
                          ? "1px solid rgba(69, 122, 76, 0.35)"
                          : "1px solid rgba(120, 94, 58, 0.18)",
                        background: isCompleted
                          ? "rgba(226, 242, 228, 0.95)"
                          : "rgba(255, 252, 246, 0.9)",
                        color: isCompleted ? "#234b2b" : "#7a6852",
                        flexShrink: 0,
                      }}
                    >
                      {isCompleted ? "✓" : "•"}
                    </span>

                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 800,
                          color: "#3b2c1b",
                        }}
                      >
                        {lesson.title}
                      </div>

                      <div
                        style={{
                          color: "#6b5842",
                          fontSize: "0.92rem",
                          marginTop: "0.2rem",
                        }}
                      >
                        {lesson.type === "lesson"
                          ? "Lesson"
                          : lesson.type === "quiz"
                          ? "Quiz"
                          : "Exam"}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "0.35rem 0.65rem",
                      borderRadius: "999px",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      color: status.color,
                      background: status.bg,
                      border: "1px solid rgba(120, 94, 58, 0.14)",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {status.label}
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      </section>
    </main>
  );
}