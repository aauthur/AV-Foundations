import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  const formData = await req.formData();
  const threadId = Number(formData.get("thread_id"));
  const parentRaw = formData.get("parent_id");
  const body = String(formData.get("body") || "").trim();

  if (!threadId || !body) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const parentId =
    typeof parentRaw === "string" && parentRaw.trim() !== ""
      ? Number(parentRaw)
      : null;

  const { error } = await supabase.from("forum_comments").insert({
    thread_id: threadId,
    parent_id: parentId,
    author_id: user.id,
    body,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}