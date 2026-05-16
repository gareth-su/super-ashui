"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Props = {
  message?: string;
};

export default function AccessGate({ message }: Props) {
  const router = useRouter();
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState(message ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!accessCode.trim()) {
      setError("请输入访问码。");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/access/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessCode }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null) as { error?: string } | null;
        setError(data?.error ?? "访问码校验失败，请稍后再试。");
        return;
      }

      router.refresh();
    } catch {
      setError("网络异常，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fafafa] px-5 py-12 text-neutral-950 sm:px-6">
      <section className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center justify-center">
        <div className="w-full rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-600">Access required</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-neutral-950">请输入访问码</h1>
            <p className="mt-3 text-sm leading-7 text-neutral-500">
              课程学习页目前面向小范围试用开放。请输入管理员提供的访问码继续学习。
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-semibold text-neutral-800">访问码</span>
              <input
                value={accessCode}
                onChange={(event) => setAccessCode(event.target.value)}
                disabled={isSubmitting}
                className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-base text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-red-500 focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-neutral-50"
                placeholder="请输入访问码"
                type="password"
                autoComplete="off"
              />
            </label>

            {error && (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              {isSubmitting ? "验证中..." : "进入课程"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
