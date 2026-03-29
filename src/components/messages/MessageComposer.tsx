"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import MathEditor from "@/components/forum/MathEditor";
import MathText from "@/components/MathText";

type Props = {
  threadId: number;
};

export default function MessageComposer({ threadId }: Props) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setError(null);

    startTransition(async () => {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Could not send message.");
        return;
      }

      setBody("");
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="stack">
      <input type="hidden" name="thread_id" value={threadId} />

      <MathEditor
        name="body"
        value={body}
        onChange={setBody}
        minHeight={140}
        placeholderText="Write a message..."
        required
        theme="paper"
      />

      {body.trim() ? (
        <div className="stackSm">
          <label className="editorLabel">Preview</label>
          <div
            style={{
              padding: "1rem",
              color: "#3b2c1b",
              lineHeight: 1.6,
            }}
          >
            <MathText text={body} />
          </div>
        </div>
      ) : null}

      {error ? <div className="errorText">{error}</div> : null}

      <button type="submit" disabled={pending} className="btn btnPrimary">
        {pending ? "Sending..." : "Send"}
      </button>
    </form>
  );
}