"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  categoryId: number;
  categorySlug: string;
};

export default function NewThreadForm({ categoryId, categorySlug }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setError(null);

    startTransition(async () => {
      const res = await fetch("/api/forum/threads", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Something went wrong.");
        return;
      }

      router.push(`/community/thread/${data.threadId}`);
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="sectionCard stackLg">
      <input type="hidden" name="category_id" value={categoryId} />
      <input type="hidden" name="category_slug" value={categorySlug} />

      <div>
        <label htmlFor="title" className="formLabel">
          Title
        </label>
        <input id="title" name="title" required className="field" />
      </div>

      <div>
        <label htmlFor="body" className="formLabel">
          Body
        </label>
        <textarea id="body" name="body" rows={10} required className="field" />
      </div>

      {error ? <div className="errorText">{error}</div> : null}

      <button type="submit" disabled={pending} className="btn btnPrimary">
        {pending ? "Posting..." : "Create thread"}
      </button>
    </form>
  );
}