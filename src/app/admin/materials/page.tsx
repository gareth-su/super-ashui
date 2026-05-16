"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

type Subject = {
  id: string;
  name: string;
};

type Material = {
  id: string;
  subjectId: string;
  title: string;
  filePath: string;
  mimeType?: string | null;
  uploadStatus: "UPLOADED" | "STORED" | "FAILED";
  parseStatus: "PENDING" | "PARSING" | "SUCCESS" | "FAILED";
  parseError?: string | null;
  createdAt: string;
  subject?: Subject;
};

const parseStatusMap: Record<Material["parseStatus"], { label: string; className: string }> = {
  PENDING: { label: "排队中", className: "bg-amber-50 text-amber-700 border-amber-200" },
  PARSING: { label: "解析中", className: "bg-sky-50 text-sky-700 border-sky-200" },
  SUCCESS: { label: "已完成", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  FAILED: { label: "失败", className: "bg-rose-50 text-rose-700 border-rose-200" },
};

const uploadStatusMap: Record<Material["uploadStatus"], { label: string; className: string }> = {
  UPLOADED: { label: "已上传", className: "bg-zinc-50 text-zinc-700 border-zinc-200" },
  STORED: { label: "已保存", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  FAILED: { label: "保存失败", className: "bg-rose-50 text-rose-700 border-rose-200" },
};

export default function AdminMaterialsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const [subjectsRes, materialsRes] = await Promise.all([fetch("/api/subjects"), fetch("/api/materials")]);
      const subjectsData = await subjectsRes.json();
      const materialsData = await materialsRes.json();

      if (!subjectsRes.ok) {
        setError(subjectsData.error ?? "课程列表读取失败");
        return;
      }

      if (!materialsRes.ok) {
        setError(materialsData.error ?? "资料列表读取失败");
        return;
      }

      const nextSubjects = subjectsData.subjects ?? [];
      setSubjects(nextSubjects);
      setMaterials(materialsData.materials ?? []);
      setSubjectId((current) => current || nextSubjects[0]?.id || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "资料管理数据读取失败");
    } finally {
      setLoading(false);
    }
  }

  async function uploadMaterial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploading(true);
    setError(null);
    setMessage(null);

    try {
      if (!subjectId) {
        setError("请先选择课程");
        return;
      }

      if (!file) {
        setError("请选择要上传的资料文件");
        return;
      }

      const form = new FormData();
      form.append("subjectId", subjectId);
      form.append("file", file);

      const res = await fetch("/api/materials/upload", {
        method: "POST",
        body: form,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "资料上传失败");
        return;
      }

      setFile(null);
      setMessage("资料上传成功。当前不会自动解析，也不会调用 AI。");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "资料上传失败");
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
  }

  useEffect(() => {
    void loadData();
  }, []);

  const sortedMaterials = useMemo(() => [...materials].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)), [materials]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500">Admin / Materials</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">资料管理</h1>
          <p className="mt-3 text-sm leading-7 text-zinc-600">上传和查看课程资料。文件保存使用现有本地上传 API，暂不接对象存储。</p>
        </div>
        <Link href="/admin" className="w-fit rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100">
          返回后台首页
        </Link>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-950">上传资料</h2>
        <form onSubmit={uploadMaterial} className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto]">
          <select
            value={subjectId}
            onChange={(event) => setSubjectId(event.target.value)}
            className="min-h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
          >
            {subjects.length ? (
              subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))
            ) : (
              <option value="">暂无课程</option>
            )}
          </select>
          <input onChange={handleFileChange} type="file" className="min-h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700" />
          <button
            type="submit"
            disabled={uploading || subjects.length === 0}
            className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
          >
            {uploading ? "上传中..." : "上传资料"}
          </button>
        </form>
        <p className="mt-3 text-xs leading-5 text-zinc-500">上传后资料会进入 PENDING 状态；本页面不自动解析、不调用 AI。</p>
        {message ? <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-zinc-950">全部资料</h2>
          <button onClick={() => void loadData()} className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100">
            刷新
          </button>
        </div>

        {loading ? (
          <div className="mt-4 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-8 text-center text-sm text-zinc-500">正在读取资料...</div>
        ) : sortedMaterials.length ? (
          <ul className="mt-4 space-y-2">
            {sortedMaterials.map((material) => {
              const parseStatus = parseStatusMap[material.parseStatus] ?? parseStatusMap.PENDING;
              const uploadStatus = uploadStatusMap[material.uploadStatus] ?? uploadStatusMap.UPLOADED;
              return (
                <li key={material.id} className="rounded-xl border border-zinc-100 bg-zinc-50/60 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-950">{material.title}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        课程：{material.subject ? (
                          <Link href={`/admin/subjects/${material.subject.id}`} className="text-zinc-800 underline-offset-2 hover:underline">
                            {material.subject.name}
                          </Link>
                        ) : (
                          "未关联"
                        )}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">类型：{material.mimeType || "未知"} · 创建：{new Date(material.createdAt).toLocaleString()}</p>
                      <p className="mt-1 truncate font-mono text-xs text-zinc-400">{material.filePath}</p>
                      {material.parseError ? <p className="mt-2 text-xs text-rose-600">失败原因：{material.parseError}</p> : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs ${uploadStatus.className}`}>{uploadStatus.label}</span>
                      <span className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs ${parseStatus.className}`}>{parseStatus.label}</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="mt-4 rounded-lg border border-dashed border-zinc-200 px-3 py-8 text-center text-sm text-zinc-500">暂无资料。请先选择课程并上传文件。</div>
        )}
      </section>
    </main>
  );
}
