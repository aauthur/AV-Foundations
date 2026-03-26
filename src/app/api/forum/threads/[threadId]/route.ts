import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ threadId: string }>;
};

export async function POST(req: Request, { params }: RouteContext) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  const { threadId } = await params;
  const id = Number(threadId);

  if (!id) {
    return NextResponse.json({ error: "Invalid thread id." }, { status: 400 });
  }

  const formData = await req.formData();
  const action = String(formData.get("action") || "");

  const { data: thread, error: threadError } = await supabase
    .from("forum_threads")
    .select("id, author_id")
    .eq("id", id)
    .single();

  if (threadError || !thread) {
    return NextResponse.json({ error: "Thread not found." }, { status: 404 });
  }

  if (thread.author_id !== user.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  if (action === "edit") {
    const title = String(formData.get("title") || "").trim();
    const body = String(formData.get("body") || "").trim();

    if (!title || !body) {
      return NextResponse.json(
        { error: "Title and body are required." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("forum_threads")
      .update({
        title,
        body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  }

  if (action === "delete") {
    const { error } = await supabase
        .from("forum_threads")
        .delete()
        .eq("id", id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
    }

  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}