import Link from "next/link";
import { getForumCategories } from "@/lib/forum";

export default async function CommunityPage() {
  const categories = await getForumCategories();

  return (
    <main className="container" style={{ padding: "3rem 1rem 4rem" }}>
      <section className="pageHero">
        <span className="pill">Community</span>
        <h1 className="pageTitle">Ask questions. Share ideas. Learn together.</h1>
        <p className="pageSubtitle">
          Use the forum to discuss lessons, proofs, and course material with other students.
        </p>
      </section>

      <div className="stackLg">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/community/${category.slug}`}
            className="paperLinkCard"
          >
            <div className="toolbar" style={{ alignItems: "flex-start" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.18rem", letterSpacing: "-0.02em" }}>
                  {category.name}
                </h2>
                <p
                  style={{
                    margin: "0.5rem 0 0 0",
                    lineHeight: 1.6,
                    color: "#6a5239",
                    maxWidth: 720,
                  }}
                >
                  {category.description}
                </p>
              </div>
              <span
                className="pill"
                style={{
                  background: "rgba(184,121,85,0.10)",
                  borderColor: "rgba(184,121,85,0.22)",
                  color: "#6a5239",
                }}
              >
                Browse
              </span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}