"use client";

import "katex/dist/katex.min.css";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

type MathTextProps = {
  text: string;
};

function normalizeLatexDelimiters(input: string): string {
  return input
    .replace(/\\\[((?:.|\n|\r)*?)\\\]/g, (_match, inner) => `$$\n${inner.trim()}\n$$`)
    .replace(/\\\(((?:.|\n|\r)*?)\\\)/g, (_match, inner) => `$${inner}$`);
}

export default function MathText({ text }: MathTextProps) {
  const normalizedText = normalizeLatexDelimiters(text);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        p: ({ children }) => <>{children}</>,
      }}
    >
      {normalizedText}
    </ReactMarkdown>
  );
}