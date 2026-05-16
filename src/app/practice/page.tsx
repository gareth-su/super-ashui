"use client";

import { useEffect, useState } from "react";

type Subject = { id: string; name: string };

type Question = {
  id: string;
  stem: string;
  questionType: "SINGLE" | "MULTI" | "TF" | "SHORT" | "CASE";
  optionsJson: string | null;
  sourceCitationsJson: string;
};

type ResultItem = {
  questionId: string;
  stem: string;
  feedback: string;
  score: number;
  citations: string;
};

export default function PracticePage() {
  const [subject, setSubject] = useState<Subject | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [sessionId, setSessionId] = useState<string>("");
  const [result, setResult] = useState<ResultItem[]>([]);

  async function loadSubject() {
    const res = await fetch("/api/subjects/default");
    const data = await res.json();
    if (data.subject) setSubject(data.subject);
  }

  async function loadQuestions(subjectId: string) {
    const res = await fetch(`/api/subjects/${subjectId}/questions?limit=20`);
    const data = await res.json();
    setQuestions(data.questions ?? []);
  }

  async function startSession() {
    if (!subject) return "";
    const res = await fetch("/api/practice/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjectId: subject.id }),
    });
    const data = await res.json();
    setSessionId(data.session.id);
    return data.session.id as string;
  }

  async function submitAnswers() {
    if (!subject) return;
    const activeSessionId = sessionId || (await startSession());
    if (!activeSessionId) return;

    await fetch(`/api/practice/sessions/${activeSessionId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers: questions.map((q) => ({
          questionId: q.id,
          userAnswerJson: JSON.stringify({ answer: answers[q.id] ?? "" }),
        })),
      }),
    });

    const res = await fetch(`/api/practice/sessions/${activeSessionId}/result`);
    const data = await res.json();
    setResult(data.answers ?? []);
  }

  useEffect(() => {
    void loadSubject();
  }, []);

  useEffect(() => {
    if (subject) void loadQuestions(subject.id);
  }, [subject]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <div>
        <p className="text-sm text-zinc-500">{subject?.name ?? "衍生金融工具"}</p>
        <h1 className="mt-1 text-2xl font-semibold">练习</h1>
      </div>

      <div className="flex items-center gap-3">
        <button className="rounded bg-black px-3 py-1 text-white" onClick={submitAnswers}>提交并评分</button>
      </div>

      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div key={q.id} className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="font-medium">{idx + 1}. {q.stem}</p>
            <textarea
              className="mt-2 min-h-20 w-full rounded border border-zinc-300 p-2 text-sm"
              placeholder="输入你的答案"
              value={answers[q.id] ?? ""}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
            />
            <p className="mt-2 text-xs text-zinc-500">来源：{q.sourceCitationsJson}</p>
          </div>
        ))}
        {questions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">
            题库尚未预置，请由维护者运行固定课程导入脚本。
          </div>
        ) : null}
      </div>

      {result.length > 0 && (
        <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-lg font-medium">评分结果</h2>
          {result.map((r) => (
            <div key={r.questionId} className="rounded border border-zinc-100 p-3 text-sm">
              <p className="font-medium">{r.stem}</p>
              <p>反馈：{r.feedback}</p>
              <p>得分：{r.score}</p>
              <p className="text-zinc-500">来源：{r.citations}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
