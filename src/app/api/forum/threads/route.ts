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
  const categoryId = Number(formData.get("category_id"));
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();

  if (!categoryId || !title || !body) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("forum_threads")
    .insert({
      category_id: categoryId,
      author_id: user.id,
      title,
      body,
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Could not create thread." }, { status: 400 });
  }

  return NextResponse.json({ ok: true, threadId: data.id });
}