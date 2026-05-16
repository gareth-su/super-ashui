import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { gradeObjective } from "@/lib/grading/grade-objective";

type Params = { id: string };

type SubmitItem = {
  questionId: string;
  userAnswerJson: string;
};

export async function POST(req: Request, ctx: { params: Promise<Params> }) {
  const { id } = await ctx.params;
  const body = (await req.json()) as { answers: SubmitItem[] };

  const session = await prisma.practiceSession.findUnique({ where: { id } });
  if (!session) return NextResponse.json({ error: "session不存在" }, { status: 404 });

  const created = [];

  for (const item of body.answers ?? []) {
    const q = await prisma.question.findUnique({ where: { id: item.questionId } });
    if (!q) continue;

    const grading = q.autoGradable
      ? gradeObjective({
          type: q.questionType,
          answerJson: q.answerJson,
          userAnswerJson: item.userAnswerJson,
        })
      : { score: 0, isCorrect: false };

    const feedback = q.autoGradable
      ? grading.isCorrect
        ? "回答正确"
        : `回答不正确。参考解析：${q.analysis ?? ""}`
      : `主观题参考答案：${q.answerJson}`;

    const answer = await prisma.practiceAnswer.create({
      data: {
        sessionId: id,
        questionId: q.id,
        userAnswerJson: item.userAnswerJson,
        score: grading.score,
        isCorrect: grading.isCorrect,
        feedback,
      },
    });

    created.push(answer);
  }

  return NextResponse.json({ saved: created.length });
}
