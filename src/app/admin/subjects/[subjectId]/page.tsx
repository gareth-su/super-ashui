"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, useCallback } from "react";

type Artifact = {
  id: string;
  type: string;
  detailLevel: string;
  version: number;
  generatedAt: string;
};

type Subject = {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  artifacts: Artifact[];
  _count: {
    materials: number;
    artifacts: number;
    questions: number;
    practiceSessions: number;
    jobs: number;
  };
};

type Material = {
  id: string;
  title: string;
  filePath: string;
  mimeType?: string | null;
  uploadStatus: "UPLOADED" | "STORED" | "FAILED";
  parseStatus: "PENDING" | "PARSING" | "SUCCESS" | "FAILED";
  parseError?: string | null;
  createdAt: string;
  _count: {
    chunks: number;
    questions: number;
    jobs: number;
  };
};

const parseStatusMap: Record<Material["parseStatus"], { label: string; className: string }> = {
  PENDING: { label: "排队中", className: "bg-amber-50 text-amber-700 border-amber-200" },
  PARSING: { label: "解析中", className: "bg-sky-50 text-sky-700 border-sky-200" },
  SUCCESS: { label: "已完成", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  FAILED: { label: "失败", className: "bg-rose-50 text-rose-700 border-rose-200" },
};

function CountCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-zinc-950">{value}</p>
    </div>
  );
}

export default function AdminSubjectDetailPage() {
  const params = useParams<{ subjectId: string }>();
  const subjectId = params.subjectId;
  const [subject, setSubject] = useState<Subject | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingFramework, setGeneratingFramework] = useState(false);
  const [generationMessage, setGenerationMessage] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const aiApiConfigured = process.env.NEXT_PUBLIC_AI_API_CONFIGURED === "true";

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [subjectRes, materialsRes] = await Promise.all([
        fetch(`/api/subjects/${subjectId}`),
        fetch(`/api/subjects/${subjectId}/materials`),
      ]);
      const subjectData = await subjectRes.json();
      const materialsData = await materialsRes.json();

      if (!subjectRes.ok) {
        setError(subjectData.error ?? "课程详情读取失败");
        return;
      }

      if (!materialsRes.ok) {
        setError(materialsData.error ?? "课程资料读取失败");
        return;
      }

      setSubject(subjectData.subject ?? null);
      setMaterials(materialsData.materials ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "课程详情读取失败");
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    if (subjectId) void loadDetail();
  }, [subjectId, loadDetail]);

  const chunkCount = useMemo(() => materials.reduce((sum, material) => sum + (material._count?.chunks ?? 0), 0), [materials]);

  async function generateKnowledgeFramework() {
    setGeneratingFramework(true);
    setGenerationMessage(null);
    setGenerationError(null);

    try {
      const res = await fetch(`/api/subjects/${subjectId}/artifacts/generate`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setGenerationError(data.error ?? "知识框架生成失败");
        return;
      }

      const versions = Array.isArray(data.generated)
        ? data.generated.map((item: { detailLevel: string; version: number }) => `${item.detailLevel} v${item.version}`).join("、")
        : "新版本";
      setGenerationMessage(`知识框架生成成功：${versions}`);
      await loadDetail();
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : "知识框架生成失败");
    } finally {
      setGeneratingFramework(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500">Admin / Subject Detail</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">{subject?.name ?? "课程详情"}</h1>
          <p className="mt-3 text-sm leading-7 text-zinc-600">查看单课程资料、知识产物和题目状态。当前推荐使用离线内容导入流程；在线 AI 生成作为未来可选能力保留。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/subjects" className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100">
            返回课程管理
          </Link>
          <Link href="/framework" className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100">
            学生端 /framework
          </Link>
        </div>
      </div>

      {loading ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-8 text-sm text-zinc-500 shadow-sm">正在读取课程详情...</section>
      ) : error ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{error}</section>
      ) : subject ? (
        <>
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold text-zinc-950">{subject.name}</h2>
                  <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs text-zinc-600">{subject.status}</span>
                </div>
                <p className="mt-2 text-xs text-zinc-500">创建：{new Date(subject.createdAt).toLocaleString()}</p>
                <p className="mt-1 text-xs text-zinc-500">更新：{new Date(subject.updatedAt).toLocaleString()}</p>
              </div>
              <div className="flex max-w-sm flex-col gap-2">
                <button
                  onClick={() => void generateKnowledgeFramework()}
                  disabled={!aiApiConfigured || generatingFramework || chunkCount === 0}
                  className="rounded-lg bg-zinc-950 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
                >
                  {generatingFramework ? "正在生成知识框架..." : "生成知识框架"}
                </button>
                <p className="text-xs leading-5 text-amber-700">在线 AI 生成是可选能力，未来可用；当前推荐使用离线内容导入流程。点击按钮会调用 AI API 并产生费用，生成结果会先保存为 KnowledgeArtifact。</p>
                {!aiApiConfigured ? <p className="text-xs leading-5 text-rose-600">未配置 AI API，可使用离线导入流程。</p> : null}
                {chunkCount === 0 ? <p className="text-xs leading-5 text-rose-600">需要先上传并解析资料，生成 MaterialChunk 后才能生成知识框架。</p> : null}
                {generationMessage ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{generationMessage}</p> : null}
                {generationError ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{generationError}</p> : null}
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <CountCard label="资料" value={subject._count.materials} />
            <CountCard label="切片" value={chunkCount} />
            <CountCard label="知识产物" value={subject._count.artifacts} />
            <CountCard label="题目" value={subject._count.questions} />
            <CountCard label="Job" value={subject._count.jobs} />
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-950">课程资料</h2>
            {materials.length ? (
              <ul className="mt-4 space-y-2">
                {materials.map((material) => {
                  const status = parseStatusMap[material.parseStatus] ?? parseStatusMap.PENDING;
                  return (
                    <li key={material.id} className="rounded-xl border border-zinc-100 bg-zinc-50/60 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-zinc-950">{material.title}</p>
                          <p className="mt-1 text-xs text-zinc-500">{material.mimeType || "未知类型"} · {new Date(material.createdAt).toLocaleString()}</p>
                          <p className="mt-1 truncate font-mono text-xs text-zinc-400">{material.filePath}</p>
                          <p className="mt-2 text-xs text-zinc-500">切片 {material._count.chunks} · 题目 {material._count.questions} · Job {material._count.jobs}</p>
                          {material.parseError ? <p className="mt-2 text-xs text-rose-600">失败原因：{material.parseError}</p> : null}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex w-fit items-center rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-600">{material.uploadStatus}</span>
                          <span className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs ${status.className}`}>{status.label}</span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed border-zinc-200 px-3 py-8 text-center text-sm text-zinc-500">该课程暂无资料。</div>
            )}
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-950">KnowledgeArtifact</h2>
            {subject.artifacts.length ? (
              <ul className="mt-4 space-y-2">
                {subject.artifacts.map((artifact) => (
                  <li key={artifact.id} className="flex flex-col gap-2 rounded-xl border border-zinc-100 bg-zinc-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-950">{artifact.type}</p>
                      <p className="mt-1 text-xs text-zinc-500">{artifact.detailLevel} · version {artifact.version}</p>
                    </div>
                    <p className="text-xs text-zinc-500">{new Date(artifact.generatedAt).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed border-zinc-200 px-3 py-8 text-center text-sm text-zinc-500">暂无知识产物。可使用上方按钮生成知识框架。</div>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}
