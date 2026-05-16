"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Subject = {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    materials: number;
    artifacts: number;
    questions: number;
    practiceSessions: number;
    jobs: number;
  };
};

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadSubjects() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/subjects");
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "课程列表读取失败");
        return;
      }

      setSubjects(data.subjects ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "课程列表读取失败");
    } finally {
      setLoading(false);
    }
  }

  async function createSubject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "课程创建失败");
        return;
      }

      setName("");
      await loadSubjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "课程创建失败");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    void loadSubjects();
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500">Admin / Subjects</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">课程管理</h1>
          <p className="mt-3 text-sm leading-7 text-zinc-600">创建和查看复习课程。当前不做公开注册和多用户系统。</p>
        </div>
        <Link href="/admin" className="w-fit rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100">
          返回后台首页
        </Link>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-950">创建课程</h2>
        <form onSubmit={createSubject} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="例如：公司金融、计量经济学"
            className="min-h-10 flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
          >
            {submitting ? "创建中..." : "创建课程"}
          </button>
        </form>
        {error ? <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-zinc-950">课程列表</h2>
          <button onClick={() => void loadSubjects()} className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100">
            刷新
          </button>
        </div>

        {loading ? (
          <div className="mt-4 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-8 text-center text-sm text-zinc-500">正在读取课程...</div>
        ) : subjects.length ? (
          <ul className="mt-4 space-y-2">
            {subjects.map((subject) => (
              <li key={subject.id} className="flex flex-col gap-3 rounded-xl border border-zinc-100 bg-zinc-50/60 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-zinc-950">{subject.name}</p>
                    <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-600">{subject.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">创建时间：{new Date(subject.createdAt).toLocaleString()}</p>
                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    资料 {subject._count?.materials ?? 0} · 知识产物 {subject._count?.artifacts ?? 0} · 题目 {subject._count?.questions ?? 0} · 练习 {subject._count?.practiceSessions ?? 0} · Job {subject._count?.jobs ?? 0}
                  </p>
                </div>
                <Link href={`/admin/subjects/${subject.id}`} className="w-fit rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100">
                  查看详情
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-4 rounded-lg border border-dashed border-zinc-200 px-3 py-8 text-center text-sm text-zinc-500">暂无课程，请先创建一个课程。</div>
        )}
      </section>
    </main>
  );
}
