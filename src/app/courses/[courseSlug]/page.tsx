import { notFound } from "next/navigation";
import { getCourse } from "@/lib/content";

type Props = {
  params: Promise<{ courseSlug: string }>;
};

export default async function CoursePage({ params }: Props) {
  const { courseSlug } = await params;

  let course;
  try {
    course = await getCourse(courseSlug);
  } catch {
    notFound();
  }

  const firstLesson = course.lessons?.[0];

  return (
    <main className="container" style={{ paddingTop: "2rem", paddingBottom: "2.5rem" }}>
      <a href="/courses" style={{ textDecoration: "none", opacity: 0.8 }}>
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

      {/* Primary action */}
      {firstLesson ? (
        <div style={{ marginTop: "1.5rem" }}>
          <a
            href={`/courses/${course.slug}/${firstLesson.slug}`}
            style={{
              display: "inline-block",
              padding: "0.8rem 1.05rem",
              borderRadius: 12,
              border: "1px solid rgba(124,58,237,0.55)",
              background: "rgba(124,58,237,0.35)",
              textDecoration: "none",
            }}
          >
            Start course →
          </a>
        </div>
      ) : (
        <p style={{ opacity: 0.7, marginTop: "1.25rem" }}>
          No lessons available yet.
        </p>
      )}

      {/* Lesson list */}
      <section style={{ marginTop: "2.25rem" }}>
        <h2>Lessons</h2>

        <ol
          style={{
            marginTop: "1rem",
            paddingLeft: "1.25rem",
            lineHeight: 1.8,
          }}
        >
          {course.lessons.map((lesson, i) => (
            <li key={lesson.slug} style={{ marginBottom: "0.4rem" }}>
              <a
                href={`/courses/${course.slug}/${lesson.slug}`}
                style={{
                  textDecoration: "none",
                  opacity: 0.9,
                }}
              >
                <span style={{ opacity: 0.6, marginRight: "0.4rem" }}>
                  {i + 1}.
                </span>
                {lesson.title}
              </a>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
