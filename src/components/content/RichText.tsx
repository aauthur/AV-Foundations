import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

type Props = {
  source: string;
};

function normalizeLatexDelimiters(input: string): string {
  return input
    .replace(/\\\[((?:.|\n|\r)*?)\\\]/g, (_match, inner) => `$$\n${inner.trim()}\n$$`)
    .replace(/\\\(((?:.|\n|\r)*?)\\\)/g, (_match, inner) => `$${inner}$`);
}

export default async function RichText({ source }: Props) {
  const normalizedSource = normalizeLatexDelimiters(source);

  const { content } = await compileMDX({
    source: normalizedSource,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm, remarkMath],
        rehypePlugins: [rehypeKatex],
      },
    },
    components: {
      p: (props) => (
        <p style={{ margin: "0 0 0.75rem 0", lineHeight: 1.7 }} {...props} />
      ),
      ul: (props) => (
        <ul style={{ lineHeight: 1.7, paddingLeft: "1.4rem" }} {...props} />
      ),
      ol: (props) => (
        <ol style={{ lineHeight: 1.7, paddingLeft: "1.4rem" }} {...props} />
      ),
      code: (props) => (
        <code
          style={{
            background: "rgba(120, 94, 58, 0.10)",
            padding: "0.1rem 0.35rem",
            borderRadius: "6px",
            fontSize: "0.95em",
          }}
          {...props}
        />
      ),
      pre: (props) => (
        <pre
          style={{
            background: "rgba(120, 94, 58, 0.10)",
            padding: "0.9rem 1rem",
            borderRadius: "12px",
            overflowX: "auto",
          }}
          {...props}
        />
      ),
    },
  });

  return <div className="richText">{content}</div>;
}