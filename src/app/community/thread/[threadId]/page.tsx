import Link from "next/link";
import { notFound } from "next/navigation";
import { buildCommentTree, getThreadWithComments } from "@/lib/forum";
import { createClient } from "@/lib/supabase/server";
import CommentTree from "@/components/forum/CommentTree";
import ReplyForm from "@/components/forum/ReplyForm";
import RichText from "@/components/content/RichText";
import ThreadActions from "@/components/forum/ThreadActions";

type Props = {
  params: Promise<{ threadId: string }>;
};

export default async function ThreadPage({ params }: Props) {
  const { threadId } = await params;
  const threadData = await getThreadWithComments(Number(threadId));

  if (!threadData) {
    notFound();
  }

  const { thread, comments } = threadData;
  const commentTree = buildCommentTree(comments);
  const visibleReplyCount = comments.filter((c) => !c.is_deleted).length;
  
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const currentUserId = user?.id ?? null;
  const canManageThread = currentUserId === thread.author_id;

  return (
    <main className="container" style={{ padding: "3rem 1rem 4rem", maxWidth: 980 }}>
      <Link href={`/community/${thread.category.slug}`} className="linkMuted">
        ← Back to {thread.category.name}
      </Link>

      <article
        className="paperBubbleStrong"
        style={{ marginTop: "1rem", padding: "1.45rem 1.45rem 1.3rem" }}
      >
        <div className="toolbar" style={{ alignItems: "flex-start" }}>
          <div>
            <span
              className="pill"
              style={{
                background: "rgba(184,121,85,0.10)",
                borderColor: "rgba(184,121,85,0.22)",
                color: "#6a5239",
                marginBottom: "0.7rem",
              }}
            >
              {thread.category.name}
            </span>

            <h1
              style={{
                margin: 0,
                fontSize: "clamp(1.8rem, 3vw, 2.4rem)",
                lineHeight: 1.08,
                letterSpacing: "-0.03em",
              }}
            >
              {thread.title}
            </h1>

            <div className="metaRow" style={{ marginTop: "0.85rem" }}>
              <span>
                by{" "}
                {thread.author?.username ? (
                  <Link href={`/u/${thread.author.username}`} className="linkMuted">
                    {thread.author.display_name || thread.author.username}
                  </Link>
                ) : (
                  "Unknown"
                )}
              </span>
              <span>•</span>
              <span>{visibleReplyCount} repl{visibleReplyCount === 1 ? "y" : "ies"}</span>
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: "1.2rem",
            fontSize: "1.03rem",
          }}
        >
          <RichText source={thread.body} />
          {canManageThread ? (
            <ThreadActions
              threadId={thread.id}
              title={thread.title}
              body={thread.body}
              categorySlug={thread.category.slug}
            />
          ) : null}
        </div>
      </article>

      {!thread.is_locked && (
        <section className="sectionCard" style={{ marginTop: "1.8rem" }}>
          <h2 style={{ marginTop: 0, marginBottom: "0.85rem" }}>Reply to thread</h2>
          <ReplyForm threadId={thread.id} parentId={null} />
        </section>
      )}

      <section style={{ marginTop: "2.3rem" }}>
        <div className="toolbar" style={{ marginBottom: "1rem" }}>
          <h2 style={{ margin: 0 }}>Replies</h2>
          <span className="pill">{visibleReplyCount}</span>
        </div>

        {commentTree.length === 0 ? (
          <div className="paperCard" style={{ padding: "1.2rem 1.25rem" }}>
            <p style={{ margin: 0, color: "#6a5239" }}>No replies yet.</p>
          </div>
        ) : (
          <CommentTree
            nodes={commentTree}
            threadId={thread.id}
            threadLocked={thread.is_locked}
            currentUserId={currentUserId}
          />
        )}
      </section>
    </main>
  );
}