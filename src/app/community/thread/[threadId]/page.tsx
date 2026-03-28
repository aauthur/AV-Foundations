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
    <div className="threadPage">
      <main className="container" style={{ padding: "3rem 1rem 4rem", maxWidth: 980 }}>
        <Link href={`/community/${thread.category.slug}`} className="linkMuted">
          ← Back to {thread.category.name}
        </Link>

        <article className="threadMainPost" style={{ marginTop: "1.2rem" }}>
          <span
            className="pill"
            style={{
              background: "rgba(184,121,85,0.08)",
              borderColor: "rgba(184,121,85,0.18)",
              color: "#6a5239",
              marginBottom: "0.85rem",
            }}
          >
            {thread.category.name}
          </span>

          <h1 className="threadTitle">{thread.title}</h1>

          <div className="threadMeta">
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
            <span style={{ margin: "0 0.45rem" }}>•</span>
            <span>
              {visibleReplyCount} repl{visibleReplyCount === 1 ? "y" : "ies"}
            </span>
          </div>

          <div
            style={{
              marginTop: "1rem",
              fontSize: "1.03rem",
              color: "#3b2c1b",
            }}
          >
            <RichText source={thread.body} />
          </div>

          {canManageThread ? (
            <ThreadActions
              threadId={thread.id}
              title={thread.title}
              body={thread.body}
              categorySlug={thread.category.slug}
            />
          ) : null}
        </article>

        <div className="threadDivider" />

        {!thread.is_locked && (
          <section style={{ marginTop: "1.2rem" }}>
            <h2 style={{ marginTop: 0, marginBottom: "0.85rem", color: "#3b2c1b" }}>
              Reply to thread
            </h2>
            <ReplyForm threadId={thread.id} parentId={null} />
          </section>
        )}

        <section style={{ marginTop: "2.2rem" }}>
          <div className="threadRepliesHeader" style={{ marginBottom: "1rem" }}>
            <h2 style={{ margin: 0 }}>Replies</h2>
            <span className="pill">{visibleReplyCount}</span>
          </div>

          {commentTree.length === 0 ? (
            <p style={{ margin: 0, color: "#6a5239" }}>No replies yet.</p>
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
    </div>
  );
}