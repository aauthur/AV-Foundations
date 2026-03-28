import Link from "next/link";
import { notFound } from "next/navigation";
import { getThreadsByCategorySlug } from "@/lib/forum";

type Props = {
  params: Promise<{ categorySlug: string }>;
};

export default async function CategoryPage({ params }: Props) {
  const { categorySlug } = await params;
  const { category, threads } = await getThreadsByCategorySlug(categorySlug);

  if (!category) {
    notFound();
  }

  return (
    <div className="threadPage">
      <main className="container manilaPageMain">
        <Link
          href="/community"
          className="linkMuted"
          style={{ marginTop: "1rem", display: "inline-block" }}
        >
          ← Back to community
        </Link>

        <section className="pageHero" style={{ marginTop: "1rem", marginBottom: "1.8rem" }}>
          <span
            className="pill"
            style={{
              background: "rgba(184,121,85,0.08)",
              borderColor: "rgba(184,121,85,0.18)",
              color: "#6a5239",
            }}
          >
            {category.name}
          </span>

          <h1 className="threadTitle" style={{ marginTop: "0.2rem" }}>
            {category.name}
          </h1>

          <p className="pageSubtitle" style={{ color: "#6a5239" }}>
            {category.description}
          </p>
        </section>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "1.25rem",
          }}
        >
          <div style={{ color: "#6a5239", fontSize: "0.95rem" }}>
            {threads.length} thread{threads.length === 1 ? "" : "s"}
          </div>

          <Link href={`/community/${category.slug}/new`} className="btn btnPrimary">
            New thread
          </Link>
        </div>

        {threads.length === 0 ? (
          <p style={{ margin: 0, color: "#6a5239" }}>
            No threads yet. Be the first to start a discussion in this category.
          </p>
        ) : (
          <div className="communityList">
            {threads.map((thread) => (
              <div key={thread.id} className="communityRow">
                <Link href={`/community/thread/${thread.id}`} className="paperLinkCard">
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
                        {thread.title}
                      </h2>

                      <div
                        className="metaRow"
                        style={{
                          marginTop: "0.45rem",
                          gap: "0.5rem",
                          color: "#6a5239",
                          fontSize: "0.93rem",
                        }}
                      >
                        <span>
                          by {thread.author?.display_name || thread.author?.username || "Unknown"}
                        </span>
                        <span>•</span>
                        <span>
                          {thread.reply_count} repl{thread.reply_count === 1 ? "y" : "ies"}
                        </span>
                      </div>
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
                      Open →
                    </span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}