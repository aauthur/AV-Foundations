import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

import { getCourse, getLessonMdx } from "@/lib/content";

type Props = {
  params: Promise<{ courseSlug: string; lessonSlug: string }>;
};

export default async function LessonPage({ params }: Props) {
  const { courseSlug, lessonSlug } = await params;

  let course;
  try {
    course = await getCourse(courseSlug);
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

  const { content } = await compileMDX({
    source: mdxSource,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm, remarkMath],
        rehypePlugins: [rehypeKatex],
      },
    },
  });

  return (
    <main className="container" style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
      <a href={`/courses/${course.slug}`} style={{ textDecoration: "none" }}>
        ← Back to course
      </a>

      <h1 style={{ marginTop: "1rem" }}>{lesson.title}</h1>
      <p style={{ opacity: 0.8 }}>
        <b>{course.title}</b>
      </p>

      {lesson.youtubeId ? (
        <section style={{ marginTop: "1.5rem" }}>
          <h2>Video</h2>
          <iframe
            width="100%"
            height="450"
            src={`https://www.youtube.com/embed/${lesson.youtubeId}`}
            title={lesson.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </section>
      ) : null}

      <section style={{ marginTop: "1.5rem" }}>
        <h2>Notes</h2>
        <article className="prose">{content}</article>
      </section>
    </main>
  );
}
