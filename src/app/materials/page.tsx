"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Material = {
  id: string;
  title: string;
  parseStatus: "PENDING" | "PARSING" | "SUCCESS" | "FAILED";
  parseError?: string | null;
  createdAt: string;
};

const statusMap: Record<Material["parseStatus"], { label: string; className: string }> = {
  PENDING: { label: "排队中", className: "bg-amber-50 text-amber-700 border-amber-200" },
  PARSING: { label: "解析中", className: "bg-sky-50 text-sky-700 border-sky-200" },
  SUCCESS: { label: "已完成", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  FAILED: { label: "失败", className: "bg-rose-50 text-rose-700 border-rose-200" },
};

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);

  async function loadMaterials() {
    const res = await fetch("/api/materials");
    const data = await res.json();
    setMaterials(data.materials ?? []);
  }

  useEffect(() => {
    void loadMaterials();
  }, []);

  const sortedMaterials = useMemo(
    () => [...materials].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [materials],
  );

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">课程资料</h1>
          <p className="mt-1 text-sm text-zinc-600">本页只展示已经由维护者预置并解析的课程章节，学习端不提供上传或导入入口。</p>
        </div>
        <Link href="/framework" className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100">
          查看知识框架
        </Link>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium text-zinc-900">章节列表</h2>
          <button
            onClick={() => void loadMaterials()}
            className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100"
          >
            刷新
          </button>
        </div>

        <ul className="space-y-2">
          {sortedMaterials.map((m) => {
            const status = statusMap[m.parseStatus] ?? statusMap.PENDING;
            return (
              <li
                key={m.id}
                className="flex flex-col gap-2 rounded-xl border border-zinc-100 bg-zinc-50/60 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-900">{m.title}</p>
                  <p className="mt-1 text-xs text-zinc-500">{new Date(m.createdAt).toLocaleString()}</p>
                  {m.parseStatus === "FAILED" && m.parseError ? (
                    <p className="mt-1 line-clamp-2 text-xs text-rose-600">失败原因：{m.parseError}</p>
                  ) : null}
                </div>
                <span className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs ${status.className}`}>
                  {status.label}
                </span>
              </li>
            );
          })}
          {sortedMaterials.length === 0 && (
            <li className="rounded-lg border border-dashed border-zinc-200 px-3 py-8 text-center text-sm text-zinc-500">
              暂无预置资料，请由维护者运行固定课程导入脚本。
            </li>
          )}
        </ul>
      </section>
    </main>
  );
}
