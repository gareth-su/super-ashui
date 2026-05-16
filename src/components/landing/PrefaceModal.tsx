"use client";

import { landingPreface, type PrefaceBlock } from "@/content/landing-preface";
import { useEffect, useMemo, useRef, useState } from "react";

const PREFACE_KEY = "landing-preface-ack";

type PrefaceModalProps = {
  open: boolean;
  onConfirm: () => void;
};

function renderBlock(block: PrefaceBlock, index: number) {
  switch (block.type) {
    case "heading":
      return (
        <p key={`${block.type}-${index}`} className="text-sm font-semibold text-neutral-950">
          {block.text}
        </p>
      );
    case "paragraph":
      return (
        <p key={`${block.type}-${index}`} className="text-sm leading-7 text-neutral-700">
          {block.text}
        </p>
      );
    case "bullets":
      return (
        <ul key={`${block.type}-${index}`} className="space-y-2 pl-5 text-sm leading-7 text-neutral-700 list-disc">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case "numbered":
      return (
        <ol key={`${block.type}-${index}`} className="space-y-3 pl-5 text-sm leading-7 text-neutral-700 list-decimal">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      );
    default:
      return null;
  }
}

export default function PrefaceModal({ open, onConfirm }: PrefaceModalProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [hasReadToEnd, setHasReadToEnd] = useState(false);

  const content = useMemo(() => landingPreface, []);

  useEffect(() => {
    if (!open) {
      setHasReadToEnd(false);
      return;
    }

    const node = scrollRef.current;
    if (!node) return;

    const onScroll = () => {
      const reachedBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 8;
      if (reachedBottom) {
        setHasReadToEnd(true);
      }
    };

    onScroll();
    node.addEventListener("scroll", onScroll, { passive: true });

    return () => node.removeEventListener("scroll", onScroll);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const node = scrollRef.current;
    if (!node) return;

    const frame = window.requestAnimationFrame(() => {
      const reachedBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 8;
      if (reachedBottom) {
        setHasReadToEnd(true);
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open, content]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:px-6">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="preface-title"
        className="relative z-10 flex w-full max-w-3xl max-h-[80vh] flex-col overflow-hidden rounded-3xl bg-white shadow-[0_30px_80px_rgba(0,0,0,0.2)]"
      >
        <div className="border-b border-neutral-200 px-6 py-5 sm:px-8">
          <h2 id="preface-title" className="text-xl font-semibold tracking-tight text-neutral-950">
            前言
          </h2>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
          <div className="space-y-4">
            {content.map((block, index) => renderBlock(block, index))}
          </div>
        </div>

        <div className="border-t border-neutral-200 bg-white px-6 py-4 sm:px-8">
          {!hasReadToEnd ? (
            <p className="mb-3 text-sm text-neutral-500">请阅读完整前言后继续</p>
          ) : null}
          <button
            type="button"
            disabled={!hasReadToEnd}
            onClick={() => {
              if (!hasReadToEnd) return;
              localStorage.setItem(PREFACE_KEY, "true");
              onConfirm();
            }}
            className="inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500 bg-red-600 hover:bg-red-700"
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  );
}
