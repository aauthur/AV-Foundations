import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export async function POST(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  const formData = await req.formData();

  const username = normalizeUsername(String(formData.get("username") || ""));
  const displayName = String(formData.get("display_name") || "").trim();
  const bio = String(formData.get("bio") || "").trim();

  const isPublic = formData.get("is_public") === "on";
  const allowMessages = formData.get("allow_messages") === "on";
  const showForumActivity = formData.get("show_forum_activity") === "on";

  if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
    return NextResponse.json(
      {
        error:
          "Username must be 3–24 characters and contain only letters, numbers, and underscores.",
      },
      { status: 400 }
    );
  }

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .neq("id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "That username is already taken." },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      display_name: displayName || null,
      bio,
      is_public: isPublic,
      allow_messages: allowMessages,
      show_forum_activity: showForumActivity,
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}