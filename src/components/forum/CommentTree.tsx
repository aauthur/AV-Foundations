import Link from "next/link";
import { ForumCommentNode } from "@/lib/forum";
import ReplyForm from "./ReplyForm";
import RichText from "@/components/content/RichText";
import CommentActions from "./CommentActions";

type Props = {
  nodes: ForumCommentNode[];
  threadId: number;
  threadLocked: boolean;
  currentUserId: string | null;
  depth?: number;
};

export default function CommentTree({
  nodes,
  threadId,
  threadLocked,
  currentUserId,
  depth = 0,
}: Props) {
  return (
    <div className="stack">
      {nodes.map((node) => {
        const leftPad = Math.min(depth, 4) * 24;
        const canManageComment = currentUserId === node.author_id;

        return (
          <div
            key={node.id}
            style={{
              marginLeft: leftPad,
            }}
          >
            <div className={depth > 0 ? "threadIndent" : undefined}>
              <div className="paperBubble" style={{ padding: "1rem 1rem 0.95rem" }}>
                <div className="metaRow" style={{ marginBottom: "0.6rem" }}>
                  {node.author?.username ? (
                    <Link href={`/u/${node.author.username}`} className="linkMuted">
                      {node.author.display_name || node.author.username}
                    </Link>
                  ) : (
                    <span>Unknown user</span>
                  )}
                </div>

                <div
                  style={{
                    lineHeight: 1.7,
                    color: "#3b2c1b",
                  }}
                >
                  {node.is_deleted ? <em>[deleted]</em> : <RichText source={node.body} />}
                </div>

                {canManageComment && !node.is_deleted ? (
                  <CommentActions commentId={node.id} body={node.body} />
                ) : null}

                {!threadLocked && !node.is_deleted ? (
                  <div style={{ marginTop: "0.95rem" }}>
                    <details>
                      <summary
                        style={{
                          cursor: "pointer",
                          color: "#6a5239",
                          fontWeight: 700,
                        }}
                      >
                        Reply
                      </summary>
                      <div style={{ marginTop: "0.8rem" }}>
                        <ReplyForm threadId={threadId} parentId={node.id} />
                      </div>
                    </details>
                  </div>
                ) : null}
              </div>
            </div>

            {node.children.length > 0 ? (
              <div style={{ marginTop: "0.9rem" }}>
                <CommentTree
                  nodes={node.children}
                  threadId={threadId}
                  threadLocked={threadLocked}
                  currentUserId={currentUserId}
                  depth={depth + 1}
                />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}