import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AuthButton() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Link
        href="/login"
        style={{
          padding: "0.4rem 0.75rem",
          borderRadius: "999px",
          border: "1px solid rgba(255,255,255,0.25)",
          color: "#fff",
          fontWeight: 600,
          textDecoration: "none",
          background: "rgba(255,255,255,0.08)",
        }}
      >
        Log in
      </Link>
    );
  }

  const username =
    user.user_metadata?.username ||
    user.email?.split("@")[0] ||
    "Account";

  return (
    <Link
      href="/profile"
      style={{
        padding: "0.4rem 0.75rem",
        borderRadius: "999px",
        border: "1px solid rgba(255,255,255,0.25)",
        background: "rgba(255,255,255,0.08)",
        color: "#fff",
        fontWeight: 600,
        textDecoration: "none",
      }}
    >
      {username}
    </Link>
  );
}