"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import MathEditor from "./MathEditor";

type Props = {
  commentId: number;
  body: string;
};

export default function CommentActions({ commentId, body }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [bodyValue, setBodyValue] = useState(body);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function submitEdit() {
    setError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("action", "edit");
      formData.append("body", bodyValue);

      const res = await fetch(`/api/forum/comments/${commentId}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Could not update comment.");
        return;
      }

      setEditing(false);
      router.refresh();
    });
  }

  async function handleDelete() {
    const ok = window.confirm("Delete this comment?");
    if (!ok) return;

    setError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("action", "delete");

      const res = await fetch(`/api/forum/comments/${commentId}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Could not delete comment.");
        return;
      }

      router.refresh();
    });
  }

  if (editing) {
    return (
      <div className="stack" style={{ marginTop: "0.95rem" }}>
        <MathEditor
          name={`comment-edit-${commentId}`}
          value={bodyValue}
          onChange={setBodyValue}
          minHeight={150}
          placeholderText="Edit your comment..."
          required
        />

        {error ? <div className="errorText">{error}</div> : null}

        <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap" }}>
          <button
            className="btn btnPrimary"
            type="button"
            disabled={pending}
            onClick={submitEdit}
          >
            {pending ? "Saving..." : "Save"}
          </button>

          <button
            className="btn btnGhost"
            type="button"
            onClick={() => {
              setEditing(false);
              setError(null);
              setBodyValue(body);
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="forumMinorActions">
      <button className="btn btnGhost" type="button" onClick={() => setEditing(true)}>
        Edit
      </button>

      <button
        className="btn btnGhost"
        type="button"
        onClick={handleDelete}
        disabled={pending}
      >
        Delete
      </button>

      {error ? <div className="errorText">{error}</div> : null}
    </div>
  );
}