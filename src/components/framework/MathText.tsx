"use client";

import "katex/dist/katex.min.css";
import katex from "katex";
import { Fragment, type ReactNode } from "react";

/* ------------------------------------------------------------------ */
/*  Token types for the parser                                         */
/* ------------------------------------------------------------------ */

type Token =
  | { type: "text"; value: string }
  | { type: "inlineLatex"; value: string }
  | { type: "blockLatex"; value: string };

/* ------------------------------------------------------------------ */
/*  Normalize loose inline math: (i_{1,H}) -> \(i_{1,H}\)             */
/* ------------------------------------------------------------------ */

const greekLetters = ["sigma", "alpha", "beta", "gamma", "delta", "theta", "lambda", "mu", "rho", "tau", "phi", "psi", "omega", "pi", "epsilon", "zeta", "eta", "kappa", "nu", "xi"];
const greekPattern = new RegExp(`\\b(${greekLetters.join("|")})\\b`, "g");

function looksLikeMath(inner: string): boolean {
  if (/[_{^]/.test(inner)) return true;
  if (/\be\^/.test(inner)) return true;
  if (greekLetters.some((g) => inner.includes(g)) && !/^[a-zA-Z\s,.']+$/.test(inner)) return true;
  if (/\b(sigma|alpha|beta|gamma|delta|theta|lambda|mu|rho|tau|phi|psi|omega|pi)\s*[=<>]/.test(inner)) return true;
  return false;
}

function latexifyGreek(expr: string): string {
  return expr.replace(greekPattern, "\\$1");
}

function latexifyPercent(expr: string): string {
  return expr.replace(/%/g, "\\%");
}

function normalizeLooseInlineMath(text: string): string {
  if (!text) return text;
  return text.replace(/(?<!\\)\(([^()]{2,80})\)/g, (full, inner: string) => {
    if (full.startsWith("\\(")) return full;
    if (!looksLikeMath(inner)) return full;
    const normalized = latexifyPercent(latexifyGreek(inner.trim()));
    return `\\(${normalized}\\)`;
  });
}

function repairControlEscapedLatex(text: string): string {
  return text
    .replace(/\beta/g, "\\beta")
    .replace(/\text/g, "\\text")
    .replace(/\times/g, "\\times")
    .replace(/\tau/g, "\\tau")
    .replace(/\frac/g, "\\frac")
    .replace(/\rho/g, "\\rho");
}

/* ------------------------------------------------------------------ */
/*  Parse a string into tokens: plain text, \(...\), \[...\]           */
/* ------------------------------------------------------------------ */

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];

  const regex = /\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Plain text before this match
    if (match.index > lastIndex) {
      tokens.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }

    if (match[1] !== undefined) {
      // Block-level \[ ... \]
      tokens.push({ type: "blockLatex", value: match[1].trim() });
    } else if (match[2] !== undefined) {
      // Inline \( ... \)
      tokens.push({ type: "inlineLatex", value: match[2].trim() });
    }

    lastIndex = regex.lastIndex;
  }

  // Remaining plain text after last match
  if (lastIndex < text.length) {
    tokens.push({ type: "text", value: text.slice(lastIndex) });
  }

  return tokens;
}

function tokenizeWithLooseMath(text: string): Token[] {
  return tokenize(repairControlEscapedLatex(text)).flatMap((token) => {
    if (token.type !== "text") return [token];
    return tokenize(normalizeLooseInlineMath(token.value));
  });
}

/* ------------------------------------------------------------------ */
/*  Render a single LaTeX string with KaTeX, fallback on error         */
/* ------------------------------------------------------------------ */

function renderLatex(latex: string, displayMode: boolean): string | null {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      strict: "ignore",
    });
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  MathText component                                                 */
/* ------------------------------------------------------------------ */

export default function MathText({ text, as }: { text: string; as?: "p" | "span" }) {
  const tokens = tokenizeWithLooseMath(text);

  // Fast path: no LaTeX at all, render plain text directly
  if (tokens.length === 1 && tokens[0]?.type === "text") {
    return as === "span" ? <span>{text}</span> : <>{text}</>;
  }

  const children: ReactNode[] = tokens.map((token, i) => {
    if (token.type === "text") {
      return <Fragment key={i}>{token.value}</Fragment>;
    }

    if (token.type === "blockLatex") {
      const html = renderLatex(token.value, true);
      if (!html) {
        return (
          <code key={i} className="block max-w-full overflow-x-auto rounded-lg bg-zinc-100 px-2 py-1 font-mono text-xs text-zinc-700">
            {token.value}
          </code>
        );
      }
      return (
        <span
          key={i}
          className="block max-w-full overflow-x-auto text-center [&_.katex-display]:my-1 [&_.katex-html]:min-w-max"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }

    // inlineLatex
    const html = renderLatex(token.value, false);
    if (!html) {
      return (
        <code key={i} className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[0.85em] text-zinc-700">
          {token.value}
        </code>
      );
    }
    return (
      <span
        key={i}
        className="inline max-w-full align-baseline [&_.katex]:text-[0.92em] [&_.katex]:leading-normal"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  });

  return as === "span" ? <span>{children}</span> : <>{children}</>;
}
