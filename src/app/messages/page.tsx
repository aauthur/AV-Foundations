import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyMessageThreads } from "@/lib/messages";

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const threads = await getMyMessageThreads();

  return (
    <div className="threadPage">
      <main className="container manilaPageMain">
        <section className="pageHero">
          <span
            className="pill"
            style={{
              background: "rgba(184,121,85,0.08)",
              borderColor: "rgba(184,121,85,0.18)",
              color: "#6a5239",
              marginTop: "1rem",
            }}
          >
            Messages
          </span>
          <h1 className="threadTitle">Private conversations</h1>
          <p className="pageSubtitle" style={{ color: "#6a5239" }}>
            Reach out to other users directly and continue conversations outside the forum.
          </p>
        </section>

        {threads.length === 0 ? (
          <div className="sectionCard" style={{ padding: "1.25rem 1.3rem" }}>
            <h2 style={{ margin: 0, fontSize: "1.08rem", color: "#3b2c1b" }}>No conversations yet</h2>
            <p style={{ margin: "0.5rem 0 0 0", color: "#6a5239", lineHeight: 1.6 }}>
              When you message someone from their profile, the conversation will appear here.
            </p>
          </div>
        ) : (
          <div className="communityList">
            {threads.map((thread) => {
              const otherProfile = thread.others.find((participant) => participant.profile)?.profile;
              const name = otherProfile?.display_name || otherProfile?.username || "Conversation";

              return (
                <div key={thread.thread_id} className="communityRow">
                  <Link href={`/messages/${thread.thread_id}`} className="paperLinkCard">
                    <div className="toolbar" style={{ alignItems: "flex-start", padding: "0 0.1rem" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: "1.06rem", color: "#3b2c1b" }}>{name}</div>
                        <div style={{ color: "#6a5239", marginTop: "0.45rem", lineHeight: 1.55 }}>
                          {thread.latest_message.body}
                        </div>
                      </div>

                      <span
                        className="pill"
                        style={{
                          background: "rgba(184,121,85,0.10)",
                          borderColor: "rgba(184,121,85,0.22)",
                          color: "#6a5239",
                        }}
                      >
                        Open
                      </span>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
