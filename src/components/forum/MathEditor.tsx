"use client";

import { useEffect, useId, useMemo, useRef } from "react";
import { EditorSelection } from "@codemirror/state";
import { EditorView, keymap, placeholder } from "@codemirror/view";
import { minimalSetup } from "codemirror";
import {
  autocompletion,
  CompletionContext,
  acceptCompletion,
  completionStatus,
  hasNextSnippetField,
  hasPrevSnippetField,
  nextSnippetField,
  prevSnippetField,
  snippetCompletion,
  startCompletion,
} from "@codemirror/autocomplete";
import { indentWithTab } from "@codemirror/commands";

type Props = {
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholderText?: string;
  minHeight?: number;
  required?: boolean;
  theme?: "default" | "paper";
};

const latexCompletions = [
  snippetCompletion("\\frac{${1:numerator}}{${2:denominator}}", {
    label: "\\frac",
    type: "function",
    detail: "fraction",
  }),
  snippetCompletion("\\sqrt{${1:x}}", {
    label: "\\sqrt",
    type: "function",
    detail: "square root",
  }),
  snippetCompletion("\\sum_{${1:i=1}}^{${2:n}} ${3}", {
    label: "\\sum",
    type: "function",
    detail: "summation",
  }),
  snippetCompletion("\\int_{${1:a}}^{${2:b}} ${3} \\, d${4:x}", {
    label: "\\int",
    type: "function",
    detail: "integral",
  }),
  snippetCompletion("\\lim_{${1:n \\to \\infty}} ${2}", {
    label: "\\lim",
    type: "function",
    detail: "limit",
  }),
  snippetCompletion("\\infty", {
    label: "\\infty",
    type: "constant",
    detail: "infinity",
  }),
  snippetCompletion("\\alpha", {
    label: "\\alpha",
    type: "variable",
    detail: "Greek letter",
  }),
  snippetCompletion("\\beta", {
    label: "\\beta",
    type: "variable",
    detail: "Greek letter",
  }),
  snippetCompletion("\\gamma", {
    label: "\\gamma",
    type: "variable",
    detail: "Greek letter",
  }),
  snippetCompletion("\\delta", {
    label: "\\delta",
    type: "variable",
    detail: "Greek letter",
  }),
  snippetCompletion("\\epsilon", {
    label: "\\epsilon",
    type: "variable",
    detail: "Greek letter",
  }),
  snippetCompletion("\\lambda", {
    label: "\\lambda",
    type: "variable",
    detail: "Greek letter",
  }),
  snippetCompletion("\\pi", {
    label: "\\pi",
    type: "variable",
    detail: "Greek letter",
  }),
  snippetCompletion("\\mathbb{${1:R}}", {
    label: "\\mathbb",
    type: "function",
    detail: "blackboard bold",
  }),
  snippetCompletion("\\mathbf{${1:v}}", {
    label: "\\mathbf",
    type: "function",
    detail: "bold math",
  }),
  snippetCompletion("\\begin{align}\n  ${1}\n\\end{align}", {
    label: "\\begin{align}",
    type: "keyword",
    detail: "align environment",
  }),
  snippetCompletion("\\begin{cases}\n  ${1}\n\\end{cases}", {
    label: "\\begin{cases}",
    type: "keyword",
    detail: "cases environment",
  }),
  snippetCompletion("\\begin{pmatrix}\n  ${1}\n\\end{pmatrix}", {
    label: "\\begin{pmatrix}",
    type: "keyword",
    detail: "matrix",
  }),
  snippetCompletion("\\left(${1}\\right)", {
    label: "\\left( \\right)",
    type: "function",
    detail: "scalable parentheses",
  }),
  snippetCompletion("\\left[${1}\\right]", {
    label: "\\left[ \\right]",
    type: "function",
    detail: "scalable brackets",
  }),
  snippetCompletion("\\approx", {
    label: "\\approx",
    type: "operator",
    detail: "approximately equal",
  }),
];

function latexCompletionSource(context: CompletionContext) {
  const word = context.matchBefore(/\\[A-Za-z]*/);

  if (!word) return null;
  if (word.from === word.to && !context.explicit) return null;

  return {
    from: word.from,
    options: latexCompletions,
    validFor: /^\\[A-Za-z]*$/,
  };
}

function createLatexInputExtension() {
  return EditorView.inputHandler.of((view, from, to, text) => {
    if (from !== to) return false;

    const prev = from > 0 ? view.state.sliceDoc(from - 1, from) : "";

    if (text === "\\") {
      view.dispatch({
        changes: { from, to, insert: "\\" },
        selection: EditorSelection.cursor(from + 1),
      });

      queueMicrotask(() => {
        startCompletion(view);
      });

      return true;
    }

    if (text === "[" && prev === "\\") {
      view.dispatch({
        changes: {
          from: from - 1,
          to,
          insert: "\\[\\]",
        },
        selection: EditorSelection.cursor(from + 1),
      });
      return true;
    }

    if (text === "(" && prev === "\\") {
      view.dispatch({
        changes: {
          from: from - 1,
          to,
          insert: "\\(\\)",
        },
        selection: EditorSelection.cursor(from + 1),
      });
      return true;
    }

    return false;
  });
}

function createMathEditorTheme(minHeight: number, theme: "default" | "paper") {
  const isPaper = theme === "paper";

  return EditorView.theme({
    "&": {
      fontSize: "1rem",
      border: isPaper
        ? "1px solid rgba(120, 94, 58, 0.22)"
        : "1px solid rgba(255,248,231,0.22)",
      borderRadius: "16px",
      background: isPaper ? "#f6f1e3" : "rgba(14, 22, 45, 0.26)",
      color: isPaper ? "#3b2c1b" : "var(--text)",
      boxShadow: isPaper
        ? "0 1px 2px rgba(0,0,0,0.04)"
        : "0 10px 22px rgba(0,0,0,0.10)",
      overflow: "hidden",
    },
    "&.cm-focused": {
      outline: "none",
      borderColor: isPaper
        ? "rgba(184, 121, 85, 0.55)"
        : "rgba(232, 221, 177, 0.55)",
      boxShadow: isPaper
        ? "0 0 0 3px rgba(184, 121, 85, 0.12)"
        : "0 0 0 3px rgba(232, 221, 177, 0.18), 0 10px 22px rgba(0,0,0,0.10)",
    },
    ".cm-scroller": {
      minHeight: `${minHeight}px`,
      lineHeight: "1.65",
      fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      background: isPaper ? "#efe6cf" : "transparent",
    },
    ".cm-content": {
      padding: "0.95rem 1rem",
      caretColor: isPaper ? "#3b2c1b" : "var(--text)",
    },
    ".cm-line": {
      padding: 0,
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: isPaper ? "#3b2c1b" : "var(--text)",
    },
    ".cm-selectionBackground": {
      backgroundColor: isPaper
        ? "rgba(184, 121, 85, 0.16)"
        : "rgba(232, 221, 177, 0.22)",
    },
    ".cm-placeholder": {
      color: isPaper ? "#9a8666" : "rgba(255, 253, 247, 0.58)",
    },
    ".cm-tooltip": {
      border: isPaper
        ? "1px solid rgba(120, 94, 58, 0.18)"
        : "1px solid rgba(255,248,231,0.18)",
      background: isPaper ? "#fbf7ec" : "rgba(14, 22, 45, 0.98)",
      color: isPaper ? "#3b2c1b" : "var(--text)",
      borderRadius: "12px",
      overflow: "hidden",
    },
    ".cm-tooltip-autocomplete > ul > li[aria-selected]": {
      background: isPaper
        ? "rgba(184, 121, 85, 0.10)"
        : "rgba(232, 221, 177, 0.16)",
      color: isPaper ? "#3b2c1b" : "var(--text)",
    },
    ".cm-activeLine": {
      background: "transparent",
    },
    ".cm-gutters": {
      display: "none",
    },
  });
}

export default function MathEditor({
  name,
  value,
  onChange,
  placeholderText = "Write something…",
  minHeight = 140,
  required = false,
  theme = "default",
}: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const lastValueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const inputId = useId();

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const extensions = useMemo(
    () => [
      minimalSetup,
      EditorView.lineWrapping,
      autocompletion({
        override: [latexCompletionSource],
        activateOnTyping: true,
        defaultKeymap: true,
      }),
      keymap.of([
        {
          key: "Tab",
          run(view) {
            if (completionStatus(view.state) === "active") {
              return acceptCompletion(view);
            }

            if (hasNextSnippetField(view.state)) {
              return nextSnippetField(view);
            }

            const { from, to } = view.state.selection.main;
            if (from === to) {
              const nextTwo = view.state.sliceDoc(from, from + 2);
              if (nextTwo === "\\]" || nextTwo === "\\)") {
                view.dispatch({
                  selection: EditorSelection.cursor(from + 2),
                });
                return true;
              }
            }

            return indentWithTab.run?.(view) ?? false;
          },
        },
        {
          key: "Enter",
          run(view) {
            if (completionStatus(view.state) === "active") {
              return acceptCompletion(view);
            }
            return false;
          },
        },
        {
          key: "Shift-Tab",
          run(view) {
            if (hasPrevSnippetField(view.state)) {
              return prevSnippetField(view);
            }
            return false;
          },
        },
      ]),
      placeholder(placeholderText),
      createLatexInputExtension(),
      EditorView.updateListener.of((update) => {
        if (!update.docChanged) return;
        const nextValue = update.state.doc.toString();
        lastValueRef.current = nextValue;
        onChangeRef.current(nextValue);
      }),
      createMathEditorTheme(minHeight, theme),
    ],
    [minHeight, placeholderText, theme]
  );

  useEffect(() => {
    if (!mountRef.current || viewRef.current) return;

    const view = new EditorView({
      doc: value,
      extensions,
      parent: mountRef.current,
    });

    viewRef.current = view;
    lastValueRef.current = value;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [extensions]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentValue = view.state.doc.toString();
    if (value === currentValue || value === lastValueRef.current) return;

    view.dispatch({
      changes: { from: 0, to: currentValue.length, insert: value },
    });

    lastValueRef.current = value;
  }, [value]);

  return (
    <div>
      <div ref={mountRef} aria-label={name} />
      <textarea
        id={inputId}
        name={name}
        value={value}
        readOnly
        required={required}
        tabIndex={-1}
        aria-hidden="true"
        style={{ display: "none" }}
      />
      <div className={theme === "paper" ? "editorHint" : "forumEditorHint"}>
        Type <code>\</code> for LaTeX suggestions. Use <code>Tab</code> or{" "}
        <code>Enter</code> to accept a suggestion.
      </div>
    </div>
  );
}