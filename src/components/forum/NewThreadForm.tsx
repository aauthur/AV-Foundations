"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import MathEditor from "./MathEditor";

type Props = {
  categoryId: number;
  categorySlug: string;
};

export default function NewThreadForm({ categoryId, categorySlug }: Props) {
  const router = useRouter();
  const [body, setBody] = useState("");
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
    <form action={handleSubmit} className="stackLg">
      <input type="hidden" name="category_id" value={categoryId} />
      <input type="hidden" name="category_slug" value={categorySlug} />

      <div className="stackSm">
        <label htmlFor="title" className="editorLabel">
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          className="editorInput"
          placeholder="Give your discussion a clear title"
        />
      </div>

      <div className="stackSm">
        <label className="editorLabel" htmlFor="body">
          Body
        </label>
        <MathEditor
          name="body"
          value={body}
          onChange={setBody}
          placeholderText="Write your thread here."
          minHeight={220}
          required
          theme="paper"
        />
      </div>

      {error ? <div className="errorText">{error}</div> : null}

      <button type="submit" disabled={pending} className="btn btnPrimary">
        {pending ? "Posting..." : "Create thread"}
      </button>
    </form>
  );
}