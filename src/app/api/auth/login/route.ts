import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function looksLikeEmail(value: string) {
  return value.includes("@");
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const body = await req.json().catch(() => null);

  const identifier = String(body?.identifier || "").trim().toLowerCase();
  const password = String(body?.password || "");

  if (!identifier || !password) {
    return NextResponse.json(
      { error: "Email/username and password are required." },
      { status: 400 }
    );
  }

  let email = identifier;

  if (!looksLikeEmail(identifier)) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email")
      .eq("username", identifier)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    if (!profile?.email) {
      return NextResponse.json(
        { error: "No account found for that username." },
        { status: 400 }
      );
    }

    email = profile.email;
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}