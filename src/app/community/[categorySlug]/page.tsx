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
    <main className="container" style={{ padding: "3rem 1rem 4rem", maxWidth: 980 }}>
      <Link href="/community" className="linkMuted">
        ← Back to community
      </Link>

      <section className="pageHero" style={{ marginTop: "1rem" }}>
        <span className="pill">{category.name}</span>
        <h1 className="pageTitle" style={{ fontSize: "clamp(1.9rem, 3vw, 2.6rem)" }}>
          {category.name}
        </h1>
        <p className="pageSubtitle">{category.description}</p>
      </section>

      <div className="toolbar" style={{ marginBottom: "1.5rem" }}>
        <div className="metaRow">
          <span
            className="pill"
            style={{
              background:
                "linear-gradient(180deg, rgba(245,238,210,0.98), rgba(232,221,177,0.92))",
              borderColor: "rgba(184,121,85,0.28)",
              color: "#6a5239",
            }}
          >
            {threads.length} thread{threads.length === 1 ? "" : "s"}
          </span>
        </div>

        <Link href={`/community/${category.slug}/new`} className="btn btnPrimary">
          New thread
        </Link>
      </div>

      <div className="stackLg">
        {threads.length === 0 ? (
          <div className="paperCard" style={{ padding: "1.25rem 1.3rem" }}>
            <h2 style={{ margin: 0, fontSize: "1.08rem" }}>No threads yet</h2>
            <p style={{ margin: "0.5rem 0 0 0", color: "#6a5239", lineHeight: 1.6 }}>
              Be the first to start a discussion in this category.
            </p>
          </div>
        ) : (
          threads.map((thread) => (
            <Link
              key={thread.id}
              href={`/community/thread/${thread.id}`}
              className="paperLinkCard"
            >
              <div className="toolbar" style={{ alignItems: "flex-start" }}>
                <div style={{ minWidth: 0 }}>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "1.16rem",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {thread.title}
                  </h2>

                  <div className="metaRow" style={{ marginTop: "0.65rem" }}>
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
                  className="pill"
                  style={{
                    background: "rgba(184,121,85,0.10)",
                    borderColor: "rgba(184,121,85,0.22)",
                    color: "#6a5239",
                  }}
                >
                  Open
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}