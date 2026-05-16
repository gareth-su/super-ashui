"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Job = {
  id: string;
  jobType: string;
  status: "PENDING" | "RUNNING" | "SUCCESS" | "FAILED";
  error?: string | null;
  createdAt: string;
  subject?: { id: string; name: string } | null;
  material?: { id: string; title: string } | null;
};

type AdminStats = {
  subjects: number;
  materials: number;
  artifacts: number;
  questions: number;
  jobs: number;
  materialsByParseStatus: {
    PENDING: number;
    PARSING: number;
    SUCCESS: number;
    FAILED: number;
  };
  recentJobs: Job[];
};

const jobStatusMap: Record<Job["status"], { label: string; className: string }> = {
  PENDING: { label: "排队中", className: "bg-amber-50 text-amber-700 border-amber-200" },
  RUNNING: { label: "运行中", className: "bg-sky-50 text-sky-700 border-sky-200" },
  SUCCESS: { label: "已完成", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  FAILED: { label: "失败", className: "bg-rose-50 text-rose-700 border-rose-200" },
};

function StatCard({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">{value}</p>
      <p className="mt-2 text-xs text-zinc-500">{hint}</p>
    </div>
  );
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadStats() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "后台统计读取失败");
        return;
      }

      setStats(data.stats ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "后台统计读取失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStats();
  }, []);

  const hasData = stats ? stats.subjects + stats.materials + stats.artifacts + stats.questions + stats.jobs > 0 : false;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500">Developer Admin</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">开发者后台</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-600">
            用于个人维护课程、资料和生成状态；学生端页面保持独立，不在这里接入真实 AI。
          </p>
        </div>
        <Link href="/framework" className="w-fit rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100">
          返回学生端 /framework
        </Link>
      </div>

      {loading ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-8 text-sm text-zinc-500 shadow-sm">正在读取后台统计...</section>
      ) : error ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{error}</section>
      ) : stats ? (
        <>
          {!hasData ? (
            <section className="rounded-2xl border border-dashed border-zinc-200 bg-white p-8 text-center shadow-sm">
              <h2 className="text-lg font-semibold text-zinc-950">暂无后台数据</h2>
              <p className="mt-2 text-sm text-zinc-500">可以先创建课程，再上传资料。本后台不会自动调用 AI。</p>
            </section>
          ) : null}

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="课程数量" value={stats.subjects} hint="Subject" />
            <StatCard label="资料数量" value={stats.materials} hint="Material" />
            <StatCard label="知识产物" value={stats.artifacts} hint="KnowledgeArtifact" />
            <StatCard label="题目数量" value={stats.questions} hint="Question" />
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-zinc-950">入口</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Link href="/admin/subjects" className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm hover:bg-zinc-100">
                  <p className="font-medium text-zinc-950">课程管理</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">创建课程并查看单课程状态。</p>
                </Link>
                <Link href="/admin/materials" className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm hover:bg-zinc-100">
                  <p className="font-medium text-zinc-950">资料管理</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">上传资料并查看解析状态。</p>
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-zinc-950">资料解析状态</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-amber-50 p-3 text-amber-800">排队中：{stats.materialsByParseStatus.PENDING}</div>
                <div className="rounded-xl bg-sky-50 p-3 text-sky-800">解析中：{stats.materialsByParseStatus.PARSING}</div>
                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-800">已完成：{stats.materialsByParseStatus.SUCCESS}</div>
                <div className="rounded-xl bg-rose-50 p-3 text-rose-800">失败：{stats.materialsByParseStatus.FAILED}</div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-zinc-950">最近 Job 状态</h2>
              <span className="text-xs text-zinc-500">共 {stats.jobs} 个 Job</span>
            </div>
            <div className="mt-4 space-y-2">
              {stats.recentJobs.length ? (
                stats.recentJobs.map((job) => {
                  const status = jobStatusMap[job.status] ?? jobStatusMap.PENDING;
                  return (
                    <div key={job.id} className="flex flex-col gap-2 rounded-xl border border-zinc-100 bg-zinc-50/60 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-zinc-900">{job.jobType}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {job.subject?.name ?? "未关联课程"} · {job.material?.title ?? "未关联资料"} · {new Date(job.createdAt).toLocaleString()}
                        </p>
                        {job.error ? <p className="mt-1 text-xs text-rose-600">{job.error}</p> : null}
                      </div>
                      <span className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs ${status.className}`}>{status.label}</span>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-lg border border-dashed border-zinc-200 px-3 py-8 text-center text-sm text-zinc-500">暂无 Job 记录。</div>
              )}
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}
