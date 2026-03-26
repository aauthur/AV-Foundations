import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMessageThread } from "@/lib/messages";
import MessageComposer from "@/components/messages/MessageComposer";
import RichText from "@/components/content/RichText";

type Props = {
  params: Promise<{ threadId: string }>;
};

export default async function MessageThreadPage({ params }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { threadId } = await params;
  const thread = await getMessageThread(Number(threadId));

  if (!thread) {
    notFound();
  }

  const otherProfiles = thread.participants
    .map((participant) => participant.profile)
    .filter(
      (profile): profile is NonNullable<typeof profile> =>
        !!profile && profile.id !== thread.currentUserId
    );

  const heading =
    otherProfiles.map((p) => p.display_name || p.username).join(", ") || "Conversation";

  return (
    <main className="container" style={{ padding: "3rem 1rem 4rem", maxWidth: 980 }}>
      <Link href="/messages" className="linkMuted">
        ← Back to messages
      </Link>

      <section className="pageHero" style={{ marginTop: "1rem" }}>
        <span className="pill">Conversation</span>
        <h1 className="pageTitle" style={{ fontSize: "clamp(1.9rem, 3vw, 2.5rem)" }}>
          {heading}
        </h1>
      </section>

      <section className="sectionCard">
        <div className="messageShell">
          {thread.messages.map((message) => {
            const mine = message.sender_id === thread.currentUserId;

            return (
              <div
                key={message.id}
                className={mine ? "messageRowMine" : "messageRowOther"}
              >
                <div className={mine ? "messageBubbleMine" : "messageBubbleOther"}>
                  <div className="messageMeta">
                    {message.sender?.display_name || message.sender?.username || "Unknown"}
                  </div>
                  <div style={{ lineHeight: 1.6 }}>
                    <RichText source={message.body} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="sectionCard" style={{ marginTop: "1.25rem" }}>
        <h2 style={{ marginTop: 0, marginBottom: "0.85rem" }}>Send a message</h2>
        <MessageComposer threadId={thread.threadId} />
      </section>
    </main>
  );
}