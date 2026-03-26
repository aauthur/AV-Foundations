import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const body = await req.json().catch(() => null);

  const email = String(body?.email || "").trim().toLowerCase();
  const username = normalizeUsername(String(body?.username || ""));
  const password = String(body?.password || "");

  if (!email || !username || !password) {
    return NextResponse.json(
      { error: "Email, username, and password are required." },
      { status: 400 }
    );
  }

  if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
    return NextResponse.json(
      {
        error:
          "Username must be 3–24 characters and contain only letters, numbers, and underscores.",
      },
      { status: 400 }
    );
  }

  const { data: existingUsername } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existingUsername) {
    return NextResponse.json(
      { error: "That username is already taken." },
      { status: 400 }
    );
  }

  const { error: signupError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
      },
    },
  });

  if (signupError) {
    return NextResponse.json({ error: signupError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}