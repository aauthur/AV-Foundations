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
    <main className="container" style={{ padding: "3rem 1rem 4rem", maxWidth: 980 }}>
      <section className="pageHero">
        <span className="pill">Messages</span>
        <h1 className="pageTitle">Private conversations</h1>
        <p className="pageSubtitle">
          Reach out to other users directly and continue conversations outside the forum.
        </p>
      </section>

      {threads.length === 0 ? (
        <div className="paperCard" style={{ padding: "1.25rem 1.3rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.08rem" }}>No conversations yet</h2>
          <p style={{ margin: "0.5rem 0 0 0", color: "#6a5239", lineHeight: 1.6 }}>
            When you message someone from their profile, the conversation will appear here.
          </p>
        </div>
      ) : (
        <div className="stackLg">
          {threads.map((thread) => {
            const otherProfile = thread.others.find(
              (participant) => participant.profile
            )?.profile;

            const name =
              otherProfile?.display_name || otherProfile?.username || "Conversation";

            return (
              <Link
                key={thread.thread_id}
                href={`/messages/${thread.thread_id}`}
                className="paperLinkCard"
              >
                <div className="toolbar" style={{ alignItems: "flex-start" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: "1.06rem" }}>{name}</div>
                    <div
                      style={{
                        color: "#6a5239",
                        marginTop: "0.45rem",
                        lineHeight: 1.55,
                      }}
                    >
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
            );
          })}
        </div>
      )}
    </main>
  );
}