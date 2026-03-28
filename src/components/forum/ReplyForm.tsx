"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import MathEditor from "./MathEditor";

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
    <form action={handleSubmit} className="editorCard stack">
      <input type="hidden" name="thread_id" value={threadId} />
      <input type="hidden" name="parent_id" value={parentId ?? ""} />

      <div className="stackSm">
        <label className="editorLabel" htmlFor="body" style={{ marginTop: "0rem", display: "inline-block" }}>
          {parentId ? "Reply" : "Reply to thread"}
        </label>

        <MathEditor
          name="body"
          value={body}
          onChange={setBody}
          minHeight={parentId ? 130 : 150}
          placeholderText={parentId ? "Write a reply..." : "Join the discussion..."}
          required
          theme="paper"
        />

        <div className="editorHint">
          Type \ for LaTeX suggestions. Use Tab or Enter to accept a suggestion.
        </div>
      </div>

      {error ? <div className="errorText">{error}</div> : null}

      <button type="submit" disabled={pending} className="btn btnPrimary">
        {pending ? "Posting..." : parentId ? "Post reply" : "Reply to thread"}
      </button>
    </form>
  );
}