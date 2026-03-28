import Link from "next/link";
import { getForumCategories } from "@/lib/forum";

export default async function CommunityPage() {
  const categories = await getForumCategories();

  return (
    <div className="threadPage">
      <main className="container manilaPageMain">
        <section className="pageHero" style={{ marginBottom: "2rem" }}>
          <div style={{ marginTop: "0.8rem" }}>
          </div>
          <span
            className="pill"
            style={{
              background: "rgba(184,121,85,0.08)",
              borderColor: "rgba(184,121,85,0.18)",
              color: "#6a5239",
            }}
          >
            Community
          </span>

          <h1 className="threadTitle" style={{ marginTop: "0.2rem" }}>
            Ask questions. Share ideas. Learn together.
          </h1>

          <p className="pageSubtitle" style={{ color: "#6a5239", maxWidth: 760 }}>
            Use the forum to discuss lessons, proofs, and course material with other students.
          </p>
        </section>

        <div className="communityList">
          {categories.map((category) => (
            <div key={category.id} className="communityRow">
              <Link href={`/community/${category.slug}`} className="paperLinkCard">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "1rem",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: "1.08rem",
                        letterSpacing: "-0.02em",
                        color: "#3b2c1b",
                      }}
                    >
                      {category.name}
                    </h2>

                    <p
                      style={{
                        margin: "0.35rem 0 0 0",
                        lineHeight: 1.6,
                        color: "#6a5239",
                        maxWidth: 720,
                      }}
                    >
                      {category.description}
                    </p>
                  </div>

                  <span
                    style={{
                      color: "#8e5b3d",
                      fontSize: "0.95rem",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      paddingTop: "0.1rem",
                    }}
                  >
                    Browse →
                  </span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}