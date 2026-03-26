"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

type UsernameStatus =
  | { state: "idle"; message: string }
  | { state: "checking"; message: string }
  | { state: "available"; message: string }
  | { state: "taken"; message: string }
  | { state: "invalid"; message: string }
  | { state: "error"; message: string };

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [identifier, setIdentifier] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const isSignup = mode === "signup";
  const normalizedUsername = useMemo(() => normalizeUsername(username), [username]);

  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>({
    state: "idle",
    message: "3–24 characters. Letters, numbers, and underscores only.",
  });

  useEffect(() => {
    if (!isSignup) return;

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
  }, [isSignup, normalizedUsername]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (isSignup) {
        const email = identifier.trim().toLowerCase();

        if (!/^[a-zA-Z0-9_]{3,24}$/.test(normalizedUsername)) {
          setMessage(
            "Username must be 3–24 characters and contain only letters, numbers, and underscores."
          );
          setLoading(false);
          return;
        }

        if (usernameStatus.state !== "available") {
          setMessage("Please choose an available username.");
          setLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          setMessage("Passwords do not match.");
          setLoading(false);
          return;
        }

        if (password.length < 8) {
          setMessage("Password must be at least 8 characters.");
          setLoading(false);
          return;
        }

        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            username: normalizedUsername,
            password,
          }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          setMessage(data?.error || "Could not create account.");
        } else {
          setMessage("Account created. Check your email to verify.");
          setUsername("");
          setPassword("");
          setConfirmPassword("");
        }
      } else {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            identifier: identifier.trim(),
            password,
          }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          setMessage(data?.error || "Could not log in.");
        } else {
          router.push("/");
          router.refresh();
        }
      }
    } finally {
      setLoading(false);
    }
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
    <main
      className="container"
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem 1rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 460,
          borderRadius: "24px",
          border: "1px solid rgba(120, 94, 58, 0.22)",
          background:
            "linear-gradient(180deg, rgba(255,248,235,0.92), rgba(244,232,210,0.82))",
          boxShadow: "0 18px 48px rgba(60, 40, 10, 0.10)",
          padding: "2rem",
          color: "#3e2f1c",
        }}
      >
        <div style={{ marginBottom: "1.5rem" }}>
          <p
            style={{
              margin: 0,
              fontSize: "0.82rem",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#8b6b3f",
            }}
          >
            Authur Academy
          </p>

          <h1
            style={{
              margin: "0.45rem 0 0.5rem 0",
              fontSize: "2rem",
              lineHeight: 1.1,
              color: "#2f2416",
            }}
          >
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>

          <p
            style={{
              margin: 0,
              lineHeight: 1.6,
              color: "#5a4630",
            }}
          >
            {isSignup
              ? "Choose a username and create an account to save your progress."
              : "Log in with your email or username to pick up where you left off."}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.95rem" }}>
          <div style={{ display: "grid", gap: "0.4rem" }}>
            <label
              htmlFor="identifier"
              style={{
                fontWeight: 700,
                color: "#3b2c1b",
                fontSize: "0.95rem",
              }}
            >
              Email
            </label>
            <input
              id="identifier"
              type={isSignup ? "email" : "text"}
              placeholder={isSignup ? "you@example.com" : "you@example.com"}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              style={{
                padding: "0.85rem 0.95rem",
                borderRadius: "14px",
                border: "1px solid rgba(120, 94, 58, 0.24)",
                background: "rgba(255, 252, 246, 0.92)",
                color: "#3e2f1c",
                outline: "none",
                fontSize: "1rem",
              }}
            />
          </div>

          {isSignup ? (
            <div style={{ display: "grid", gap: "0.4rem" }}>
              <label
                htmlFor="username"
                style={{
                  fontWeight: 700,
                  color: "#3b2c1b",
                  fontSize: "0.95rem",
                }}
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={24}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                style={{
                  padding: "0.85rem 0.95rem",
                  borderRadius: "14px",
                  border: "1px solid rgba(120, 94, 58, 0.24)",
                  background: "rgba(255, 252, 246, 0.92)",
                  color: "#3e2f1c",
                  outline: "none",
                  fontSize: "1rem",
                }}
              />
              <div
                style={{
                  fontSize: "0.92rem",
                  color: usernameMessageColor,
                  minHeight: "1.2rem",
                }}
              >
                {usernameStatus.message}
              </div>
            </div>
          ) : null}

          <div style={{ display: "grid", gap: "0.4rem" }}>
            <label
              htmlFor="password"
              style={{
                fontWeight: 700,
                color: "#3b2c1b",
                fontSize: "0.95rem",
              }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder={isSignup ? "Create a password" : "Enter your password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                padding: "0.85rem 0.95rem",
                borderRadius: "14px",
                border: "1px solid rgba(120, 94, 58, 0.24)",
                background: "rgba(255, 252, 246, 0.92)",
                color: "#3e2f1c",
                outline: "none",
                fontSize: "1rem",
              }}
            />
          </div>

          {isSignup ? (
            <div style={{ display: "grid", gap: "0.4rem" }}>
              <label
                htmlFor="confirmPassword"
                style={{
                  fontWeight: 700,
                  color: "#3b2c1b",
                  fontSize: "0.95rem",
                }}
              >
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{
                  padding: "0.85rem 0.95rem",
                  borderRadius: "14px",
                  border: "1px solid rgba(120, 94, 58, 0.24)",
                  background: "rgba(255, 252, 246, 0.92)",
                  color: "#3e2f1c",
                  outline: "none",
                  fontSize: "1rem",
                }}
              />
            </div>
          ) : null}

          <button
            type="submit"
            disabled={
              loading ||
              (isSignup &&
                (usernameStatus.state === "checking" ||
                  usernameStatus.state === "taken" ||
                  usernameStatus.state === "invalid" ||
                  usernameStatus.state === "error"))
            }
            style={{
              marginTop: "0.35rem",
              padding: "0.9rem 1rem",
              borderRadius: "14px",
              border: "1px solid #8f7248",
              background: loading
                ? "rgba(201, 185, 161, 0.6)"
                : "linear-gradient(180deg, #a68252, #8c6a40)",
              color: loading ? "#6f6252" : "#fffaf2",
              fontWeight: 800,
              fontSize: "0.98rem",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 6px 16px rgba(88, 58, 24, 0.18)",
              opacity:
                loading ||
                (isSignup &&
                  (usernameStatus.state === "checking" ||
                    usernameStatus.state === "taken" ||
                    usernameStatus.state === "invalid" ||
                    usernameStatus.state === "error"))
                  ? 0.7
                  : 1,
            }}
          >
            {loading ? "Please wait..." : isSignup ? "Create account" : "Log in"}
          </button>
        </form>

        {message ? (
          <div
            style={{
              marginTop: "1rem",
              padding: "0.9rem 1rem",
              borderRadius: "14px",
              border: "1px solid rgba(120, 94, 58, 0.18)",
              background: "rgba(255, 252, 246, 0.78)",
              color: "#5a4630",
              lineHeight: 1.5,
            }}
          >
            {message}
          </div>
        ) : null}

        <div
          style={{
            marginTop: "1.25rem",
            paddingTop: "1.1rem",
            borderTop: "1px solid rgba(120, 94, 58, 0.14)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.8rem",
            flexWrap: "wrap",
          }}
        >
          <span style={{ color: "#6b5842", fontSize: "0.95rem" }}>
            {isSignup ? "Already have an account?" : "Need an account?"}
          </span>

          <button
            type="button"
            onClick={() => {
              setMode(isSignup ? "login" : "signup");
              setMessage("");
              setPassword("");
              setConfirmPassword("");
              setUsername("");
            }}
            style={{
              border: "none",
              background: "transparent",
              color: "#8b6b3f",
              fontWeight: 800,
              cursor: "pointer",
              padding: 0,
              fontSize: "0.95rem",
            }}
          >
            {isSignup ? "Log in instead" : "Sign up instead"}
          </button>
        </div>
      </div>
    </main>
  );
}