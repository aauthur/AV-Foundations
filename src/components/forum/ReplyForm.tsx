"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  threadId: number;
  parentId: number | null;
};

export default function ReplyForm({ threadId, parentId }: Props) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setError(null);

    startTransition(async () => {
      const res = await fetch("/api/forum/comments", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Something went wrong.");
        return;
      }

      setBody("");
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="stack">
      <input type="hidden" name="thread_id" value={threadId} />
      <input type="hidden" name="parent_id" value={parentId ?? ""} />

      <textarea
        className="field"
        name="body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={parentId ? 4 : 5}
        placeholder={parentId ? "Write a reply..." : "Join the discussion..."}
        required
      />

      {error ? <div className="errorText">{error}</div> : null}

      <button type="submit" disabled={pending} className="btn btnPrimary">
        {pending ? "Posting..." : parentId ? "Post reply" : "Reply to thread"}
      </button>
    </form>
  );
}