"use client";

import { FormEvent, useState } from "react";

const FEEDBACK_TYPES = ["内容错误", "看不懂", "页面问题", "功能建议", "其他"];
const MAX_CONTENT_LENGTH = 1000;
const MAX_CONTACT_LENGTH = 100;
const MAX_PAGE_URL_LENGTH = 500;

type Props = {
  courseId: string;
};

export default function FeedbackButton({ courseId }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState("");
  const [content, setContent] = useState("");
  const [contact, setContact] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resetForm() {
    setType("");
    setContent("");
    setContact("");
  }

  function closeDialog() {
    if (isSubmitting) return;

    setIsOpen(false);
    setStatusMessage("");
    setIsError(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!type) {
      setIsError(true);
      setStatusMessage("请选择反馈类型。");
      return;
    }

    if (!content.trim()) {
      setIsError(true);
      setStatusMessage("请填写具体反馈内容。");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage("");
    setIsError(false);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          content: content.trim(),
          contact: contact.trim(),
          courseId,
          pageUrl: window.location.href.slice(0, MAX_PAGE_URL_LENGTH),
        }),
      });

      if (!response.ok) {
        setIsError(true);
        setStatusMessage("提交失败，请稍后再试");
        return;
      }

      resetForm();
      setIsError(false);
      setStatusMessage("已收到反馈，谢谢");
      window.setTimeout(() => {
        setIsOpen(false);
        setStatusMessage("");
      }, 1200);
    } catch {
      setIsError(true);
      setStatusMessage("提交失败，请稍后再试");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-50 rounded-full border border-red-100 bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-lg shadow-red-950/10 transition hover:border-red-200 hover:bg-red-50 sm:bottom-6 sm:left-6"
      >
        反馈
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/30 px-4 py-5 sm:items-center">
          <div className="w-full max-w-lg rounded-3xl border border-neutral-200 bg-white p-5 shadow-2xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-600">Feedback</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-neutral-950">课程反馈</h2>
                <p className="mt-2 text-sm leading-6 text-neutral-500">告诉我们哪里需要修正或改进。</p>
              </div>
              <button
                type="button"
                onClick={closeDialog}
                disabled={isSubmitting}
                className="rounded-full px-3 py-1 text-xl leading-none text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-800 disabled:cursor-not-allowed"
                aria-label="关闭反馈弹窗"
              >
                ×
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="text-sm font-semibold text-neutral-800">反馈类型</span>
                <select
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                  disabled={isSubmitting}
                  className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-950 outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-neutral-50"
                >
                  <option value="">请选择</option>
                  {FEEDBACK_TYPES.map((feedbackType) => (
                    <option key={feedbackType} value={feedbackType}>{feedbackType}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-neutral-800">具体反馈内容</span>
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  disabled={isSubmitting}
                  maxLength={MAX_CONTENT_LENGTH}
                  className="mt-2 min-h-32 w-full resize-y rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm leading-6 text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-red-500 focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-neutral-50"
                  placeholder="请描述具体问题或建议"
                />
                <span className="mt-1 block text-right text-xs text-neutral-400">{content.length}/{MAX_CONTENT_LENGTH}</span>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-neutral-800">联系方式</span>
                <input
                  value={contact}
                  onChange={(event) => setContact(event.target.value)}
                  disabled={isSubmitting}
                  maxLength={MAX_CONTACT_LENGTH}
                  className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-red-500 focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-neutral-50"
                  placeholder="选填：微信、邮箱或手机号"
                />
              </label>

              {statusMessage && (
                <div className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${isError ? "border-red-100 bg-red-50 text-red-700" : "border-emerald-100 bg-emerald-50 text-emerald-700"}`}>
                  {statusMessage}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeDialog}
                  disabled={isSubmitting}
                  className="flex-1 rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-neutral-300"
                >
                  {isSubmitting ? "提交中..." : "提交反馈"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
