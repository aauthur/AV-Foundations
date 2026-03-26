import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "You must be logged in." },
      { status: 401 }
    );
  }

  const formData = await req.formData();
  const username = String(formData.get("username") || "").trim().toLowerCase();

  if (!username) {
    return NextResponse.json(
      { error: "Missing username." },
      { status: 400 }
    );
  }

  const { data: targetProfile, error: targetError } = await supabase
    .from("profiles")
    .select("id, username, allow_messages, is_public")
    .eq("username", username)
    .single();

  if (targetError || !targetProfile) {
    return NextResponse.json(
      { error: "User not found." },
      { status: 404 }
    );
  }

  if (targetProfile.id === user.id) {
    return NextResponse.json(
      { error: "You cannot message yourself." },
      { status: 400 }
    );
  }

  if (!targetProfile.allow_messages) {
    return NextResponse.json(
      { error: "This user is not accepting messages." },
      { status: 403 }
    );
  }

  const { data: myParticipations, error: myPartError } = await supabase
    .from("dm_participants")
    .select("thread_id")
    .eq("user_id", user.id);

  if (myPartError) {
    return NextResponse.json(
      { error: myPartError.message },
      { status: 400 }
    );
  }

  const myThreadIds = (myParticipations ?? []).map((p) => p.thread_id);

  if (myThreadIds.length > 0) {
    const { data: sharedParticipants, error: sharedError } = await supabase
      .from("dm_participants")
      .select("thread_id, user_id")
      .in("thread_id", myThreadIds);

    if (sharedError) {
      return NextResponse.json(
        { error: sharedError.message },
        { status: 400 }
      );
    }

    const grouped = new Map<number, string[]>();

    for (const row of sharedParticipants ?? []) {
      const arr = grouped.get(row.thread_id) ?? [];
      arr.push(row.user_id);
      grouped.set(row.thread_id, arr);
    }

    for (const [threadId, participantIds] of grouped.entries()) {
      if (
        participantIds.length === 2 &&
        participantIds.includes(user.id) &&
        participantIds.includes(targetProfile.id)
      ) {
        return NextResponse.json({ ok: true, threadId });
      }
    }
  }

  const { data: newThread, error: threadError } = await supabase
    .from("dm_threads")
    .insert({})
    .select("id")
    .single();

  if (threadError || !newThread) {
    return NextResponse.json(
      { error: threadError?.message || "Could not create thread." },
      { status: 400 }
    );
  }

  const { error: participantsError } = await supabase
    .from("dm_participants")
    .insert([
      { thread_id: newThread.id, user_id: user.id },
      { thread_id: newThread.id, user_id: targetProfile.id },
    ]);

  if (participantsError) {
    return NextResponse.json(
      { error: participantsError.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true, threadId: newThread.id });
}