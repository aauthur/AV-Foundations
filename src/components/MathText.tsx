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
    .replace(/\r\n/g, "\n")
    .replace(/\\\[((?:.|\n)*?)\\\]/g, (_match, inner) => `\n\n$$\n${inner.trim()}\n$$\n\n`)
    .replace(/\\\(((?:.|\n)*?)\\\)/g, (_match, inner) => `$${inner.trim()}$`);
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