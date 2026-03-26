import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ commentId: string }>;
};

export async function POST(req: Request, { params }: RouteContext) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  const { commentId } = await params;
  const id = Number(commentId);

  if (!id) {
    return NextResponse.json({ error: "Invalid comment id." }, { status: 400 });
  }

  const formData = await req.formData();
  const action = String(formData.get("action") || "");

  const { data: comment, error: commentError } = await supabase
    .from("forum_comments")
    .select("id, author_id")
    .eq("id", id)
    .single();

  if (commentError || !comment) {
    return NextResponse.json({ error: "Comment not found." }, { status: 404 });
  }

  if (comment.author_id !== user.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  if (action === "edit") {
    const body = String(formData.get("body") || "").trim();

    if (!body) {
      return NextResponse.json({ error: "Body is required." }, { status: 400 });
    }

    const { error } = await supabase
      .from("forum_comments")
      .update({
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
      .from("forum_comments")
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}