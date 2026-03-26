"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  username: string;
};

export default function StartMessageButton({ username }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    setError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("username", username);

      const res = await fetch("/api/messages/start", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Could not start conversation.");
        return;
      }

      router.push(`/messages/${data.threadId}`);
      router.refresh();
    });
  }

  return (
    <div style={{ marginTop: "1.25rem" }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        style={{
          padding: "0.7rem 1rem",
          borderRadius: "999px",
          border: "none",
          background: "#1aa0dc",
          color: "white",
          fontWeight: 700,
          cursor: pending ? "default" : "pointer",
          opacity: pending ? 0.7 : 1,
        }}
      >
        {pending ? "Opening..." : "Message user"}
      </button>

      {error ? (
        <div
          style={{
            marginTop: "0.6rem",
            color: "#9f2d2d",
            fontSize: "0.95rem",
          }}
        >
          {error}
        </div>
      ) : null}
    </div>
  );
}