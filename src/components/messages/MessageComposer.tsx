"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

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

      <textarea
        className="field"
        name="body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        placeholder="Write a message..."
        required
      />

      {error ? <div className="errorText">{error}</div> : null}

      <button type="submit" disabled={pending} className="btn btnPrimary">
        {pending ? "Sending..." : "Send"}
      </button>
    </form>
  );
}