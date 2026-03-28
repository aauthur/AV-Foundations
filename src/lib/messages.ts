import { createClient } from "@/lib/supabase/server";

export type MessageProfile = {
  id: string;
  username: string;
  display_name: string | null;
  allow_messages?: boolean;
};

type RawThreadParticipant = {
  user_id: string;
  profile: MessageProfile | MessageProfile[] | null;
};

export type ThreadParticipant = {
  user_id: string;
  profile: MessageProfile | null;
};

type RawThreadMessage = {
  id: number;
  thread_id: number;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
  sender: MessageProfile | MessageProfile[] | null;
};

export type ThreadMessage = {
  id: number;
  thread_id: number;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
  sender: MessageProfile | null;
};

export type MessageThreadListItem = {
  thread_id: number;
  latest_message: ThreadMessage;
  others: ThreadParticipant[];
};

export type FullMessageThread = {
  threadId: number;
  participants: ThreadParticipant[];
  messages: ThreadMessage[];
  currentUserId: string;
};

function normalizeJoinedProfile(
  raw: MessageProfile | MessageProfile[] | null | undefined
): MessageProfile | null {
  if (Array.isArray(raw)) {
    return raw[0] ?? null;
  }

  return raw ?? null;
}

function normalizeParticipant(raw: RawThreadParticipant): ThreadParticipant {
  return {
    user_id: raw.user_id,
    profile: normalizeJoinedProfile(raw.profile),
  };
}

function normalizeMessage(raw: RawThreadMessage): ThreadMessage {
  return {
    id: raw.id,
    thread_id: raw.thread_id,
    sender_id: raw.sender_id,
    body: raw.body,
    created_at: raw.created_at,
    read_at: raw.read_at,
    sender: normalizeJoinedProfile(raw.sender),
  };
}

export async function getMyMessageThreads(): Promise<MessageThreadListItem[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: participations, error } = await supabase
    .from("dm_participants")
    .select("thread_id")
    .eq("user_id", user.id);

  if (error) throw error;

  const threadIds = (participations ?? []).map((p) => p.thread_id);
  if (threadIds.length === 0) return [];

  const { data: messagesRaw, error: msgError } = await supabase
    .from("dm_messages")
    .select(`
      id,
      thread_id,
      sender_id,
      body,
      created_at,
      read_at,
      sender:profiles!dm_messages_sender_id_fkey (
        id,
        username,
        display_name
      )
    `)
    .in("thread_id", threadIds)
    .order("created_at", { ascending: false });

  if (msgError) throw msgError;

  const messages = ((messagesRaw ?? []) as RawThreadMessage[]).map(normalizeMessage);

  const latestByThread = new Map<number, ThreadMessage>();
  for (const msg of messages) {
    if (!latestByThread.has(msg.thread_id)) {
      latestByThread.set(msg.thread_id, msg);
    }
  }

  const latestMessages = Array.from(latestByThread.values());

  const enriched = await Promise.all(
    latestMessages.map(async (msg): Promise<MessageThreadListItem> => {
      const { data: participantsRaw, error: pError } = await supabase
        .from("dm_participants")
        .select(`
          user_id,
          profile:profiles!dm_participants_user_id_fkey (
            id,
            username,
            display_name,
            allow_messages
          )
        `)
        .eq("thread_id", msg.thread_id);

      if (pError) throw pError;

      const participants = ((participantsRaw ?? []) as RawThreadParticipant[]).map(
        normalizeParticipant
      );

      const others = participants.filter(
        (participant) => participant.user_id !== user.id
      );

      return {
        thread_id: msg.thread_id,
        latest_message: msg,
        others,
      };
    })
  );

  return enriched.sort(
    (a, b) =>
      new Date(b.latest_message.created_at).getTime() -
      new Date(a.latest_message.created_at).getTime()
  );
}

export async function getMessageThread(
  threadId: number
): Promise<FullMessageThread | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membership } = await supabase
    .from("dm_participants")
    .select("thread_id")
    .eq("thread_id", threadId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) return null;

  const { data: participantsRaw, error: participantsError } = await supabase
    .from("dm_participants")
    .select(`
      user_id,
      profile:profiles!dm_participants_user_id_fkey (
        id,
        username,
        display_name,
        allow_messages
      )
    `)
    .eq("thread_id", threadId);

  if (participantsError) throw participantsError;

  const { data: messagesRaw, error: messagesError } = await supabase
    .from("dm_messages")
    .select(`
      id,
      thread_id,
      sender_id,
      body,
      created_at,
      read_at,
      sender:profiles!dm_messages_sender_id_fkey (
        id,
        username,
        display_name
      )
    `)
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (messagesError) throw messagesError;

  const participants = ((participantsRaw ?? []) as RawThreadParticipant[]).map(
    normalizeParticipant
  );

  const messages = ((messagesRaw ?? []) as RawThreadMessage[]).map(normalizeMessage);

  return {
    threadId,
    participants,
    messages,
    currentUserId: user.id,
  };
}