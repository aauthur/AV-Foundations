import { createClient } from "@/lib/supabase/server";

export async function getForumCategories() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("forum_categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getThreadsByCategorySlug(categorySlug: string) {
  const supabase = await createClient();

  const { data: category, error: categoryError } = await supabase
    .from("forum_categories")
    .select("*")
    .eq("slug", categorySlug)
    .single();

  if (categoryError || !category) return { category: null, threads: [] };

  const { data: threads, error: threadError } = await supabase
    .from("forum_threads")
    .select(`
      *,
      author:profiles!forum_threads_author_id_fkey (
        id,
        username,
        display_name
      )
    `)
    .eq("category_id", category.id)
    .order("last_activity_at", { ascending: false });

  if (threadError) throw threadError;

  return {
    category,
    threads: threads ?? [],
  };
}

export async function getThreadWithComments(threadId: number) {
  const supabase = await createClient();

  const { data: thread, error: threadError } = await supabase
    .from("forum_threads")
    .select(`
      *,
      category:forum_categories (*),
      author:profiles!forum_threads_author_id_fkey (
        id,
        username,
        display_name
      )
    `)
    .eq("id", threadId)
    .single();

  if (threadError || !thread) return null;

  const { data: comments, error: commentsError } = await supabase
    .from("forum_comments")
    .select(`
      *,
      author:profiles!forum_comments_author_id_fkey (
        id,
        username,
        display_name
      )
    `)
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (commentsError) throw commentsError;

  return {
    thread,
    comments: comments ?? [],
  };
}

export type ForumCommentNode = {
  id: number;
  thread_id: number;
  author_id: string;
  parent_id: number | null;
  body: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  author: {
    id: string;
    username: string;
    display_name: string | null;
  } | null;
  children: ForumCommentNode[];
};

export function buildCommentTree(comments: any[]): ForumCommentNode[] {
  const map = new Map<number, ForumCommentNode>();
  const roots: ForumCommentNode[] = [];

  for (const comment of comments) {
    map.set(comment.id, {
      ...comment,
      children: [],
    });
  }

  for (const comment of map.values()) {
    if (comment.parent_id == null) {
      roots.push(comment);
      continue;
    }

    const parent = map.get(comment.parent_id);
    if (parent) {
      parent.children.push(comment);
    } else {
      roots.push(comment);
    }
  }

  return roots;
}