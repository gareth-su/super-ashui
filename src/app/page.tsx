"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PrefaceModal from "@/components/landing/PrefaceModal";

const PREFACE_KEY = "landing-preface-ack";
const LAST_POSITION_KEY = "study-ai:last-position";

type LastLearningPosition = {
  courseId: string;
  chapterIndex: number;
  pageIndex: number;
  courseTitle?: string;
  chapterTitle?: string;
  pageTitle?: string;
};

function getValidLastPosition(): LastLearningPosition | null {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") return null;

  try {
    const parsed = JSON.parse(window.localStorage.getItem(LAST_POSITION_KEY) ?? "null") as Partial<LastLearningPosition> | null;
    if (
      !parsed ||
      typeof parsed.courseId !== "string" ||
      typeof parsed.chapterIndex !== "number" ||
      typeof parsed.pageIndex !== "number" ||
      !Number.isFinite(parsed.chapterIndex) ||
      !Number.isFinite(parsed.pageIndex) ||
      parsed.chapterIndex < 0 ||
      parsed.pageIndex < 0
    ) {
      return null;
    }

    return {
      courseId: parsed.courseId,
      chapterIndex: Math.floor(parsed.chapterIndex),
      pageIndex: Math.floor(parsed.pageIndex),
      courseTitle: typeof parsed.courseTitle === "string" ? parsed.courseTitle : undefined,
      chapterTitle: typeof parsed.chapterTitle === "string" ? parsed.chapterTitle : undefined,
      pageTitle: typeof parsed.pageTitle === "string" ? parsed.pageTitle : undefined,
    };
  } catch {
    return null;
  }
}

export default function Home() {
  const router = useRouter();
  const [prefaceOpen, setPrefaceOpen] = useState(false);
  const [lastPosition, setLastPosition] = useState<LastLearningPosition | null>(null);

  useEffect(() => {
    setLastPosition(getValidLastPosition());
  }, []);

  function handleStartLearning() {
    if (localStorage.getItem(PREFACE_KEY) === "true") {
      router.push("/courses");
      return;
    }

    setPrefaceOpen(true);
  }

  function handlePrefaceConfirm() {
    setPrefaceOpen(false);
    router.push("/courses");
  }

  function handleContinueLearning() {
    if (!lastPosition) return;

    const params = new URLSearchParams();
    params.set("course", lastPosition.courseId);
    params.set("chapter", String(lastPosition.chapterIndex));
    params.set("page", String(lastPosition.pageIndex));
    router.push(`/framework?${params.toString()}`);
  }

  const lastPositionLabel = lastPosition
    ? [
        lastPosition.courseTitle,
        lastPosition.chapterTitle || `第 ${lastPosition.chapterIndex + 1} 讲`,
        `模块 ${String(lastPosition.pageIndex + 1).padStart(2, "0")}`,
      ].filter(Boolean).join(" · ")
    : "";

  return (
    <main className="relative min-h-dvh overflow-hidden bg-neutral-950 text-white">
      <div className="absolute inset-0">
        <Image
          src="/landing/portal-bg.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_34%),linear-gradient(135deg,rgba(8,8,10,0.3),rgba(8,8,10,0.58))]" />
      </div>

      <header className="relative z-10 flex items-start justify-between px-5 pt-5 sm:px-7 sm:pt-7">
        <Link
          href="/"
          aria-label="返回首页"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/10 backdrop-blur-md transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        >
          <span className="h-3.5 w-3.5 rounded-full bg-[#E53935] shadow-[0_0_0_6px_rgba(229,57,53,0.18)]" />
        </Link>
      </header>

      <section className="relative z-10 mx-auto flex min-h-dvh w-full max-w-7xl items-center px-6 pb-16 pt-20 sm:px-8 lg:px-12">
        <div className="max-w-2xl">
          <p className="mb-5 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-medium tracking-[0.28em] text-white/72 backdrop-blur-sm">
            学习门户
          </p>
          <h1 className="text-5xl font-semibold tracking-tight text-white drop-shadow-[0_10px_40px_rgba(0,0,0,0.25)] sm:text-6xl lg:text-7xl">
            <span className="text-white">超级</span>
            <span className="text-[#E53935]">阿水</span>
          </h1>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleStartLearning}
              className="inline-flex items-center justify-center rounded-full bg-[#E53935] px-8 py-4 text-sm font-semibold tracking-wide text-white shadow-[0_18px_45px_rgba(229,57,53,0.38)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#d93430] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              开始学习
            </button>
            {lastPosition && (
              <button
                type="button"
                onClick={handleContinueLearning}
                className="inline-flex flex-col items-start justify-center rounded-full border border-white/25 bg-white/12 px-6 py-3 text-left text-white shadow-[0_14px_34px_rgba(0,0,0,0.18)] backdrop-blur-md transition duration-200 hover:-translate-y-0.5 hover:bg-white/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              >
                <span className="text-sm font-semibold tracking-wide">继续学习</span>
                <span className="mt-0.5 max-w-[17rem] truncate text-xs font-medium text-white/68">
                  上次：{lastPositionLabel}
                </span>
              </button>
            )}
          </div>
        </div>
      </section>

      <PrefaceModal open={prefaceOpen} onConfirm={handlePrefaceConfirm} />
    </main>
  );
}
