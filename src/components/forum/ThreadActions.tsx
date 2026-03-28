"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import MathEditor from "./MathEditor";

type Props = {
  threadId: number;
  title: string;
  body: string;
  categorySlug: string;
};

export default function ThreadActions({
  threadId,
  title,
  body,
  categorySlug,
}: Props) {
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
        <div>
          <label htmlFor={`thread-title-${threadId}`} className="formLabel">
            Title
          </label>
          <input
            id={`thread-title-${threadId}`}
            className="field"
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
          />
        </div>

        <div>
          <label className="formLabel">Body</label>
          <MathEditor
            name={`thread-edit-${threadId}`}
            value={bodyValue}
            onChange={setBodyValue}
            minHeight={220}
            placeholderText="Edit your thread..."
            required
          />
        </div>

        {error ? <div className="errorText">{error}</div> : null}

        <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap" }}>
          <button className="btn btnPrimary" disabled={pending} onClick={submitEdit}>
            {pending ? "Saving..." : "Save"}
          </button>

          <button
            className="btn btnGhost"
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

          <button
            className="btn btnGhost"
            type="button"
            onClick={handleDelete}
            disabled={pending}
          >
            Delete thread
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="threadMinorActions">
      <button className="btn btnGhost" type="button" onClick={() => setEditing(true)}>
        Edit thread
      </button>

      <button className="btn btnGhost" type="button" onClick={handleDelete} disabled={pending}>
        Delete thread
      </button>

      {error ? <div className="errorText">{error}</div> : null}
    </div>
  );
}