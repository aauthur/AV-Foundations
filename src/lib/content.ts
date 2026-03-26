import { promises as fs } from "fs";
import path from "path";

export type LessonType = "lesson" | "quiz" | "exam";

export type LessonMeta = {
  slug: string;
  title: string;
  youtubeId?: string;
  type?: LessonType; // default to "lesson" where missing
};

export type Course = {
  slug: string;
  title: string;
  description?: string;
  lessons: LessonMeta[];
};

const CONTENT_ROOT = path.join(process.cwd(), "content", "courses");

export async function getCourse(courseSlug: string): Promise<Course> {
  const coursePath = path.join(CONTENT_ROOT, courseSlug, "course.json");
  const raw = await fs.readFile(coursePath, "utf8");
  return JSON.parse(raw) as Course;
}

export async function getLessonMdx(courseSlug: string, lessonSlug: string): Promise<string> {
  const mdxPath = path.join(CONTENT_ROOT, courseSlug, "lessons", `${lessonSlug}.mdx`);
  return await fs.readFile(mdxPath, "utf8");
}

// Optional but handy for /courses later
export async function getAllCourses(): Promise<Course[]> {
  const entries = await fs.readdir(CONTENT_ROOT, { withFileTypes: true });
  const slugs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

  const courses: Course[] = [];
  for (const slug of slugs) {
    try {
      courses.push(await getCourse(slug));
    } catch {
      // ignore folders missing course.json
    }
  }
  return courses;
}
