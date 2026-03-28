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
    .filter((profile): profile is NonNullable<typeof profile> => !!profile && profile.id !== thread.currentUserId);

  const heading = otherProfiles.map((p) => p.display_name || p.username).join(", ") || "Conversation";

  return (
    <div className="threadPage">
      <main className="container manilaPageMain">
        <Link
          href="/messages"
          className="linkMuted"
          style={{ display: "inline-block", marginTop: "1rem" }}
        >
          ← Back to messages
        </Link>

        <section className="pageHero" style={{ marginTop: "1rem", marginBottom: "1rem" }}>
          <div
            className="pill"
            style={{
              background: "rgba(184,121,85,0.08)",
              borderColor: "rgba(184,121,85,0.18)",
              color: "#6a5239",
              width: "fit-content",
            }}
          >
            Conversation
          </div>
          <h1 className="threadTitle" style={{ fontSize: "clamp(1.9rem, 3vw, 2.5rem)" }}>
            {heading}
          </h1>
        </section>

        <div className="threadDivider" style={{ marginTop: 0, marginBottom: "1rem" }} />

        <section className="messageThreadPanel">
          <div className="messageShell messageShellMinimal">
            {thread.messages.map((message) => {
              const mine = message.sender_id === thread.currentUserId;

              return (
                <div key={message.id} className={mine ? "messageRowMine" : "messageRowOther"}>
                  <div
                    style={{
                      background: "transparent",
                      border: "none",
                      padding: 0,
                    }}
                  >
                    <div className="messageMeta">
                      {message.sender?.display_name || message.sender?.username || "Unknown"}
                    </div>
                    <div style={{ lineHeight: 1.6 , color: "#3b2c1b" }}>
                      <RichText source={message.body} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section style={{ marginTop: "1.2rem" }}>
          <h2 style={{ margin: 0, marginBottom: "0.85rem", color: "#3b2c1b", fontSize: "1.2rem" }}>Send a message</h2>
          <MessageComposer threadId={thread.threadId} />
        </section>
      </main>
    </div>
  );
}
