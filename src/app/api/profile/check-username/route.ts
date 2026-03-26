import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export async function GET(req: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);

  const username = normalizeUsername(searchParams.get("username") || "");

  if (!username) {
    return NextResponse.json(
      { error: "Username is required." },
      { status: 400 }
    );
  }

  if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
    return NextResponse.json({
      available: false,
      reason: "invalid",
    });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: existing, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Could not check username." },
      { status: 500 }
    );
  }

  if (!existing) {
    return NextResponse.json({ available: true });
  }

  if (user && existing.id === user.id) {
    return NextResponse.json({ available: true });
  }

  return NextResponse.json({ available: false, reason: "taken" });
}