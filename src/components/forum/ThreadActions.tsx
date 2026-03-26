"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  threadId: number;
  title: string;
  body: string;
  categorySlug: string;
};

export default function ThreadActions({ threadId, title, body, categorySlug }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [titleValue, setTitleValue] = useState(title);
  const [bodyValue, setBodyValue] = useState(body);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function submitEdit() {
    setError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("action", "edit");
      formData.append("title", titleValue);
      formData.append("body", bodyValue);

      const res = await fetch(`/api/forum/threads/${threadId}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Could not update thread.");
        return;
      }

      setEditing(false);
      router.refresh();
    });
  }

  async function handleDelete() {
    const ok = window.confirm("Delete this thread?");
    if (!ok) return;

    setError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("action", "delete");

      const res = await fetch(`/api/forum/threads/${threadId}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Could not delete thread.");
        return;
      }

      router.replace(`/community/${categorySlug}`);
      router.refresh();
    });
  }

  if (editing) {
    return (
      <div className="sectionCard stack" style={{ marginTop: "1rem" }}>
        <input
          className="field"
          value={titleValue}
          onChange={(e) => setTitleValue(e.target.value)}
        />
        <textarea
          className="field"
          rows={8}
          value={bodyValue}
          onChange={(e) => setBodyValue(e.target.value)}
        />
        {error ? <div className="errorText">{error}</div> : null}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button className="btn btnPrimary" disabled={pending} onClick={submitEdit}>
            {pending ? "Saving..." : "Save"}
          </button>
          <button
            className="btn"
            type="button"
            onClick={() => {
              setEditing(false);
              setError(null);
              setTitleValue(title);
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
    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1rem" }}>
      <button className="btn" type="button" onClick={() => setEditing(true)}>
        Edit thread
      </button>
      <button className="btn" type="button" onClick={handleDelete} disabled={pending}>
        Delete thread
      </button>
      {error ? <div className="errorText">{error}</div> : null}
    </div>
  );
}