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
};

function replyLabel(count: number) {
  return `${count} repl${count === 1 ? "y" : "ies"}`;
}

async function CommentNode({
  node,
  threadId,
  threadLocked,
  currentUserId,
}: {
  node: ForumCommentNode;
  threadId: number;
  threadLocked: boolean;
  currentUserId: string | null;
}) {
  const canManageComment = currentUserId === node.author_id;
  const childCount = node.children.length;
  const authorLabel =
    node.author?.display_name || node.author?.username || "Unknown user";

  return (
    <div className="forumCommentItem">
      <article className="forumCommentCard">
        <div className="forumCommentHeader">
          <div>
            {node.author?.username ? (
              <Link href={`/u/${node.author.username}`} className="forumCommentAuthor">
                {authorLabel}
              </Link>
            ) : (
              <span className="forumCommentAuthor">{authorLabel}</span>
            )}
          </div>

          <div className="forumCommentMeta">
            {new Date(node.created_at).toLocaleDateString()}
          </div>
        </div>

        <div className="forumCommentBody">
          {node.is_deleted ? <em>[deleted]</em> : <RichText source={node.body} />}
        </div>

        <div className="forumCommentToolbar">
          {!threadLocked && !node.is_deleted ? (
            <details className="forumInlineDisclosure">
              <summary className="forumTextButton">Reply</summary>
              <div className="forumInlineReply">
                <ReplyForm threadId={threadId} parentId={node.id} />
              </div>
            </details>
          ) : null}
        </div>

        {canManageComment && !node.is_deleted ? (
          <CommentActions commentId={node.id} body={node.body} />
        ) : null}
      </article>

      {childCount > 0 ? (
        <details className="forumCommentThread" open>
          <summary className="forumCommentSummary">{replyLabel(childCount)}</summary>
          <div className="forumCommentChildren">
            {node.children.map((child) => (
              <CommentNode
                key={child.id}
                node={child}
                threadId={threadId}
                threadLocked={threadLocked}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}

export default async function CommentTree({
  nodes,
  threadId,
  threadLocked,
  currentUserId,
}: Props) {
  return (
    <div className="forumCommentList">
      {nodes.map((node) => (
        <CommentNode
          key={node.id}
          node={node}
          threadId={threadId}
          threadLocked={threadLocked}
          currentUserId={currentUserId}
        />
      ))}
    </div>
  );
}