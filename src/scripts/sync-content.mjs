import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
import { promises as fs } from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

loadEnvConfig(process.cwd());

const CONTENT_ROOT = path.join(process.cwd(), "content", "courses");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL in environment.");
}

if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY in environment.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

async function readCoursesFromDisk() {
  const entries = await fs.readdir(CONTENT_ROOT, { withFileTypes: true });
  const courseDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

  const courses = [];

  for (const dirSlug of courseDirs) {
    const courseJsonPath = path.join(CONTENT_ROOT, dirSlug, "course.json");
    const raw = await fs.readFile(courseJsonPath, "utf8");
    const course = JSON.parse(raw);

    if (course.slug !== dirSlug) {
      throw new Error(
        `Course slug mismatch: folder "${dirSlug}" but course.json says "${course.slug}"`
      );
    }

    const lessonsDir = path.join(CONTENT_ROOT, dirSlug, "lessons");
    const lessonFiles = new Set(
      (await fs.readdir(lessonsDir))
        .filter((name) => name.endsWith(".mdx"))
        .map((name) => name.replace(/\.mdx$/, ""))
    );

    const lessons = (course.lessons ?? []).map((lesson, index) => {
      if (!lesson.slug) {
        throw new Error(`Missing lesson slug in course "${dirSlug}"`);
      }

      if (!lessonFiles.has(lesson.slug)) {
        throw new Error(
          `Missing MDX file for ${dirSlug}/${lesson.slug}. Expected ${lesson.slug}.mdx`
        );
      }

      return {
        course_slug: dirSlug,
        lesson_slug: lesson.slug,
        title: lesson.title,
        lesson_type: lesson.type ?? "lesson",
        youtube_id: lesson.youtubeId ?? null,
        sort_order: index,
        updated_at: new Date().toISOString(),
      };
    });

    courses.push({
      slug: dirSlug,
      title: course.title,
      description: course.description ?? null,
      updated_at: new Date().toISOString(),
      lessons,
    });
  }

  return courses;
}

async function syncContent() {
  const courses = await readCoursesFromDisk();
  const courseSlugs = courses.map((c) => c.slug);

  for (const course of courses) {
    const { error: courseError } = await supabase
      .from("course_catalog")
      .upsert(
        {
          slug: course.slug,
          title: course.title,
          description: course.description,
          updated_at: course.updated_at,
        },
        { onConflict: "slug" }
      );

    if (courseError) throw courseError;

    const { error: deleteLessonsError } = await supabase
      .from("lesson_catalog")
      .delete()
      .eq("course_slug", course.slug);

    if (deleteLessonsError) throw deleteLessonsError;

    if (course.lessons.length > 0) {
      const { error: insertLessonsError } = await supabase
        .from("lesson_catalog")
        .insert(course.lessons);

      if (insertLessonsError) throw insertLessonsError;
    }
  }

  const { data: existingCourses, error: existingCoursesError } = await supabase
    .from("course_catalog")
    .select("slug");

  if (existingCoursesError) throw existingCoursesError;

  const staleCourseSlugs = (existingCourses ?? [])
    .map((row) => row.slug)
    .filter((slug) => !courseSlugs.includes(slug));

  if (staleCourseSlugs.length > 0) {

    const { error: deleteCoursesError } = await supabase
      .from("course_catalog")
      .delete()
      .in("slug", staleCourseSlugs);

    if (deleteCoursesError) throw deleteCoursesError;
  }

  console.log("Content sync complete.");
}

syncContent().catch((err) => {
  console.error(err);
  process.exit(1);
});