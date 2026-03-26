"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  profile: {
    username: string;
    display_name: string | null;
    bio: string | null;
    is_public: boolean;
    allow_messages: boolean;
    show_forum_activity: boolean;
  };
};

type UsernameStatus =
  | { state: "idle"; message: string }
  | { state: "checking"; message: string }
  | { state: "available"; message: string }
  | { state: "taken"; message: string }
  | { state: "invalid"; message: string }
  | { state: "error"; message: string };

function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export default function ProfileSettingsForm({ profile }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [username, setUsername] = useState(profile.username);
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [isPublic, setIsPublic] = useState(profile.is_public);
  const [allowMessages, setAllowMessages] = useState(profile.allow_messages);
  const [showForumActivity, setShowForumActivity] = useState(
    profile.show_forum_activity
  );

  const normalizedUsername = useMemo(
    () => normalizeUsername(username),
    [username]
  );

  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>({
    state: "idle",
    message: "3–24 characters. Letters, numbers, and underscores only.",
  });

  useEffect(() => {
    if (normalizedUsername === profile.username) {
      setUsernameStatus({
        state: "idle",
        message: "This is your current username.",
      });
      return;
    }

    if (!normalizedUsername) {
      setUsernameStatus({
        state: "idle",
        message: "3–24 characters. Letters, numbers, and underscores only.",
      });
      return;
    }

    if (!/^[a-zA-Z0-9_]{3,24}$/.test(normalizedUsername)) {
      setUsernameStatus({
        state: "invalid",
        message:
          "Username must be 3–24 characters and contain only letters, numbers, and underscores.",
      });
      return;
    }

    const controller = new AbortController();

    setUsernameStatus({
      state: "checking",
      message: "Checking availability...",
    });

    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/profile/check-username?username=${encodeURIComponent(
            normalizedUsername
          )}`,
          {
            method: "GET",
            signal: controller.signal,
          }
        );

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          setUsernameStatus({
            state: "error",
            message: data?.error || "Could not check username.",
          });
          return;
        }

        if (data.available) {
          setUsernameStatus({
            state: "available",
            message: "Username is available.",
          });
        } else {
          setUsernameStatus({
            state: "taken",
            message: "That username is already taken.",
          });
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;

        setUsernameStatus({
          state: "error",
          message: "Could not check username.",
        });
      }
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [normalizedUsername, profile.username]);

  async function handleSubmit(formData: FormData) {
    setError(null);

    if (
      normalizedUsername !== profile.username &&
      usernameStatus.state !== "available"
    ) {
      setError("Please choose an available username.");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/profile", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Could not update profile.");
        return;
      }

      router.refresh();
    });
  }

  const usernameMessageColor =
    usernameStatus.state === "available"
      ? "#3d6b3d"
      : usernameStatus.state === "taken" ||
        usernameStatus.state === "invalid" ||
        usernameStatus.state === "error"
      ? "#8a3f32"
      : "#6a5239";

  return (
    <form
      action={handleSubmit}
      style={{
        borderRadius: "22px",
        border: "1px solid rgba(120, 94, 58, 0.12)",
        background:
          "linear-gradient(180deg, rgba(255,251,245,0.72), rgba(248,242,232,0.62))",
        boxShadow: "0 10px 30px rgba(60, 40, 10, 0.06)",
        padding: "1.5rem",
        display: "grid",
        gap: "1.15rem",
      }}
    >
      <div>
        <label
          htmlFor="username"
          style={{
            display: "block",
            marginBottom: "0.45rem",
            fontWeight: 800,
            color: "#4d3924",
            letterSpacing: "-0.01em",
          }}
        >
          Username
        </label>
        <input
          id="username"
          name="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          minLength={3}
          maxLength={24}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          style={{
            width: "100%",
            borderRadius: "14px",
            border: "1px solid rgba(120, 94, 58, 0.18)",
            padding: "0.85rem 1rem",
            font: "inherit",
            color: "#3e2f1c",
            background: "rgba(255, 252, 246, 0.94)",
            boxSizing: "border-box",
            outline: "none",
          }}
        />
        <div
          style={{
            marginTop: "0.45rem",
            fontSize: "0.93rem",
            color: usernameMessageColor,
          }}
        >
          {usernameStatus.message}
        </div>
      </div>

      <div>
        <label
          htmlFor="display_name"
          style={{
            display: "block",
            marginBottom: "0.45rem",
            fontWeight: 800,
            color: "#4d3924",
            letterSpacing: "-0.01em",
          }}
        >
          Display name
        </label>
        <input
          id="display_name"
          name="display_name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={80}
          style={{
            width: "100%",
            borderRadius: "14px",
            border: "1px solid rgba(120, 94, 58, 0.18)",
            padding: "0.85rem 1rem",
            font: "inherit",
            color: "#3e2f1c",
            background: "rgba(255, 252, 246, 0.94)",
            boxSizing: "border-box",
            outline: "none",
          }}
        />
      </div>

      <div>
        <label
          htmlFor="bio"
          style={{
            display: "block",
            marginBottom: "0.45rem",
            fontWeight: 800,
            color: "#4d3924",
            letterSpacing: "-0.01em",
          }}
        >
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={5}
          maxLength={500}
          style={{
            width: "100%",
            borderRadius: "14px",
            border: "1px solid rgba(120, 94, 58, 0.18)",
            padding: "0.85rem 1rem",
            font: "inherit",
            color: "#3e2f1c",
            background: "rgba(255, 252, 246, 0.94)",
            boxSizing: "border-box",
            outline: "none",
            resize: "vertical",
            lineHeight: 1.5,
          }}
        />
      </div>

      <div style={{ display: "grid", gap: "0.85rem", marginTop: "0.15rem" }}>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.7rem",
            color: "#5a4630",
            fontWeight: 600,
          }}
        >
          <input
            type="checkbox"
            name="is_public"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            style={{ accentColor: "#b07a52" }}
          />
          Public profile
        </label>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.7rem",
            color: "#5a4630",
            fontWeight: 600,
          }}
        >
          <input
            type="checkbox"
            name="allow_messages"
            checked={allowMessages}
            onChange={(e) => setAllowMessages(e.target.checked)}
            style={{ accentColor: "#b07a52" }}
          />
          Allow direct messages
        </label>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.7rem",
            color: "#5a4630",
            fontWeight: 600,
          }}
        >
          <input
            type="checkbox"
            name="show_forum_activity"
            checked={showForumActivity}
            onChange={(e) => setShowForumActivity(e.target.checked)}
            style={{ accentColor: "#b07a52" }}
          />
          Show forum activity publicly
        </label>
      </div>

      {error ? (
        <div
          style={{
            color: "#8a3f32",
            background: "rgba(176, 80, 60, 0.08)",
            border: "1px solid rgba(176, 80, 60, 0.16)",
            borderRadius: "12px",
            padding: "0.8rem 0.9rem",
            fontSize: "0.95rem",
          }}
        >
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={
          pending ||
          usernameStatus.state === "checking" ||
          usernameStatus.state === "taken" ||
          usernameStatus.state === "invalid" ||
          usernameStatus.state === "error"
        }
        style={{
          marginTop: "0.2rem",
          padding: "0.95rem 1rem",
          borderRadius: "999px",
          border: "1px solid #b07a52",
          background:
            "linear-gradient(180deg, rgba(245,238,210,0.98), rgba(232,221,177,0.92))",
          color: "#7b5633",
          fontWeight: 800,
          fontSize: "1rem",
          cursor: pending ? "default" : "pointer",
          boxShadow: "0 6px 16px rgba(88, 58, 24, 0.10)",
          opacity:
            pending ||
            usernameStatus.state === "checking" ||
            usernameStatus.state === "taken" ||
            usernameStatus.state === "invalid" ||
            usernameStatus.state === "error"
              ? 0.7
              : 1,
        }}
      >
        {pending ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}