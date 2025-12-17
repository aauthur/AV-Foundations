import { getAllCourses } from "@/lib/content";

export default async function CoursesPage() {
  const courses = await getAllCourses();

  return (
    <main className="container" style={{ paddingTop: "2rem", paddingBottom: "2.5rem" }}>
      <h1>Courses</h1>

      {courses.length === 0 ? (
        <p style={{ opacity: 0.75, lineHeight: 1.7, marginTop: "1rem" }}>
          No courses found yet. Add a course under <code>content/courses/&lt;slug&gt;</code>.
        </p>
      ) : (
        <div
          style={{
            marginTop: "1.25rem",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1rem",
          }}
        >
          {courses.map((c) => (
            <div
              key={c.slug}
              className="card"
              style={{ padding: "1.25rem" }}
            >
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "1rem" }}>
                <h2 style={{ margin: 0, fontSize: "1.25rem" }}>{c.title}</h2>
                <span
                  style={{
                    fontSize: "0.8rem",
                    opacity: 0.65,
                    border: "1px solid rgba(255,255,255,0.12)",
                    padding: "0.2rem 0.5rem",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.04)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {c.lessons?.length ?? 0} lesson{(c.lessons?.length ?? 0) === 1 ? "" : "s"}
                </span>
              </div>

              {c.description ? (
                <p style={{ marginTop: "0.75rem", marginBottom: 0, opacity: 0.78, lineHeight: 1.7 }}>
                  {c.description}
                </p>
              ) : (
                <p style={{ marginTop: "0.75rem", marginBottom: 0, opacity: 0.6 }}>
                  No description yet.
                </p>
              )}

              <div style={{ marginTop: "1.1rem" }}>
                <a
                  href={`/courses/${c.slug}`}
                  style={{
                    display: "inline-block",
                    textDecoration: "none",
                    padding: "0.65rem 0.9rem",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.06)",
                  }}
                >
                  View course →
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
