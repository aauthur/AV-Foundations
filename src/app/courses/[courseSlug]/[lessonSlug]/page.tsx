import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

import { getCourse, getLessonMdx } from "@/lib/content";
import MultipleChoice from "@/components/MultipleChoice";
import MultipleAnswer from "@/components/MultipleAnswer";
import FreeResponseFile from "@/components/FreeResponseFile";
import FreeResponseText from "@/components/FreeResponseText";
import AssessmentShell from "@/components/AssessmentShell";
import LessonShell from "@/components/LessonShell";

type LessonType = "lesson" | "quiz" | "exam";

type Lesson = {
  slug: string;
  title: string;
  youtubeId?: string;
  type: LessonType;
};

type Course = {
  slug: string;
  title: string;
  description: string;
  lessons: Lesson[];
};

type Props = {
  params: Promise<{ courseSlug: string; lessonSlug: string }>;
};

export default async function LessonPage({ params }: Props) {
  const { courseSlug, lessonSlug } = await params;

  let course: Course;
  try {
    course = (await getCourse(courseSlug)) as Course;
  } catch {
    notFound();
  }

  const lesson = course.lessons.find((l) => l.slug === lessonSlug);
  if (!lesson) notFound();

  let mdxSource = "";
  try {
    mdxSource = await getLessonMdx(courseSlug, lessonSlug);
  } catch {
    notFound();
  }

  const lessonType = lesson.type ?? "lesson";

  const { content } = await compileMDX({
    source: mdxSource,
    components: {
      MultipleChoice,
      MultipleAnswer,
      FreeResponseFile,
      FreeResponseText,
    },
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm, remarkMath],
        rehypePlugins: [rehypeKatex],
      },
    },
  });

  const isLesson = lesson.type === "lesson";
  const isQuiz = lesson.type === "quiz";
  const isExam = lesson.type === "exam";

  const sectionLabel = isLesson ? "Notes" : isQuiz ? "Quiz" : "Exam";

  const badgeLabel = isLesson ? "Lesson" : isQuiz ? "Quiz" : "Exam";

  const badgeStyles = isLesson
    ? {
        background: "rgba(232, 221, 177, 0.18)",
        border: "1px solid rgba(232, 221, 177, 0.28)",
        color: "#e8ddb1",
      }
    : isQuiz
      ? {
          background: "rgba(166, 130, 82, 0.16)",
          border: "1px solid rgba(166, 130, 82, 0.30)",
          color: "#f2e7d0",
        }
      : {
          background: "rgba(140, 110, 68, 0.18)",
          border: "1px solid rgba(140, 110, 68, 0.32)",
          color: "#f4ead6",
        };

  return (
    <main
      className="container"
      style={{ paddingTop: "2rem", paddingBottom: "2rem" }}
    >
      <a href={`/courses/${course.slug}`} className="linkMuted">
        ← Back to course
      </a>

      <div>
      </div>

      <div
        style={{
          marginTop: "1rem",
          display: "inline-flex",
          alignItems: "center",
          padding: "0.38rem 0.7rem",
          borderRadius: "999px",
          fontSize: "0.9rem",
          fontWeight: 700,
          ...badgeStyles,
        }}
      >
        {badgeLabel}
      </div>

      <h1 style={{ marginTop: "0.9rem", marginBottom: "0.35rem" }}>
        {lesson.title}
      </h1>

      <p style={{ opacity: 0.8, marginTop: 0 }}>
        <b>{course.title}</b>
      </p>

      {isLesson && lesson.youtubeId ? (
        <section style={{ marginTop: "1.5rem" }}>
          <h2>Video</h2>
          <div className="embed">
            <iframe
              width="100%"
              height="450"
              src={`https://www.youtube.com/embed/${lesson.youtubeId}`}
              title={lesson.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ display: "block", border: 0 }}
            />
          </div>
        </section>
      ) : null}

      <section style={{ marginTop: "1.5rem" }}>
        <h2>{sectionLabel}</h2>

        {!isLesson ? (
          <p style={{ opacity: 0.82, marginTop: "-0.25rem", marginBottom: "1rem" }}>
            {isQuiz
              ? "Work through the questions below."
              : "Complete the problems below."}
          </p>
        ) : null}

        {isLesson ? (
          <LessonShell
            courseSlug={course.slug}
            lessonSlug={lesson.slug}
          >
            <article className="prose">{content}</article>
          </LessonShell>
        ) : (
          <AssessmentShell
            label={isQuiz ? "Quiz" : "Exam"}
            courseSlug={course.slug}
            lessonSlug={lesson.slug}
          >
            <article className="prose">{content}</article>
          </AssessmentShell>
        )}
      </section>
    </main>
  );
}