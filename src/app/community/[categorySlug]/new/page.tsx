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
    <main className="container" style={{ padding: "3rem 1rem", maxWidth: 800 }}>
      <h1 style={{ marginTop: 0 }}>New thread</h1>
      <p style={{ opacity: 0.8 }}>
        Posting in <strong>{category.name}</strong>
      </p>

      <div style={{ marginTop: "2rem" }}>
        <NewThreadForm categoryId={category.id} categorySlug={category.slug} />
      </div>
    </main>
  );
}