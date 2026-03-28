import Link from "next/link";
import { notFound } from "next/navigation";
import { getThreadsByCategorySlug } from "@/lib/forum";
import NewThreadForm from "@/components/forum/NewThreadForm";

type Props = {
  params: Promise<{ categorySlug: string }>;
};

export default async function NewThreadPage({ params }: Props) {
  const { categorySlug } = await params;
  const { category } = await getThreadsByCategorySlug(categorySlug);

  if (!category) {
    notFound();
  }

  return (
    <div className="threadPage">
      <main className="container" style={{ padding: "3rem 1rem 4rem", maxWidth: 980 }}>
        <Link href={`/community/${category.slug}`} className="linkMuted">
          ← Back to {category.name}
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
            New thread
          </span>

          <h1 className="threadTitle" style={{ marginTop: "0.2rem" }}>
            Start a new discussion
          </h1>

          <p className="pageSubtitle" style={{ color: "#6a5239" }}>
            Posting in <strong>{category.name}</strong>.
          </p>
        </section>

        <section style={{ maxWidth: 800 }}>
          <NewThreadForm categoryId={category.id} categorySlug={category.slug} />
        </section>
      </main>
    </div>
  );
}