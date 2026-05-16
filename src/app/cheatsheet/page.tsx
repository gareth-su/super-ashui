"use client";

import { useEffect, useState } from "react";

type Subject = { id: string; name: string };
type Artifact = { contentMd: string | null };

export default function CheatsheetPage() {
  const [subject, setSubject] = useState<Subject | null>(null);
  const [level, setLevel] = useState<"concise" | "detailed">("concise");
  const [content, setContent] = useState<string>("");

  async function loadSubject() {
    const res = await fetch("/api/subjects/default");
    const data = await res.json();
    if (data.subject) setSubject(data.subject);
  }

  async function loadCheatsheet(subjectId: string, lv: "concise" | "detailed") {
    const res = await fetch(`/api/subjects/${subjectId}/cheatsheet?level=${lv}`);
    const data = (await res.json()) as { artifact: Artifact | null };
    setContent(data.artifact?.contentMd ?? "速记提纲尚未预置，请由维护者运行固定课程导入脚本。");
  }

  useEffect(() => {
    void loadSubject();
  }, []);

  useEffect(() => {
    if (subject) void loadCheatsheet(subject.id, level);
  }, [subject, level]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-zinc-500">{subject?.name ?? "衍生金融工具"}</p>
          <h1 className="mt-1 text-2xl font-semibold">考前速记提纲</h1>
        </div>
        <div className="flex rounded-xl border border-zinc-200 bg-zinc-50 p-1 text-sm">
          <button
            className={`rounded-lg px-3 py-1.5 ${level === "concise" ? "bg-white font-medium text-zinc-950 shadow-sm" : "text-zinc-600"}`}
            onClick={() => setLevel("concise")}
          >
            简洁
          </button>
          <button
            className={`rounded-lg px-3 py-1.5 ${level === "detailed" ? "bg-white font-medium text-zinc-950 shadow-sm" : "text-zinc-600"}`}
            onClick={() => setLevel("detailed")}
          >
            详细
          </button>
        </div>
      </div>
      <article className="prose max-w-none rounded-xl border border-zinc-200 bg-white p-4 text-sm whitespace-pre-wrap">{content}</article>
    </main>
  );
}
