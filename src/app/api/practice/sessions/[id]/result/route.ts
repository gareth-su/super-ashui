import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

type Params = { id: string };

export async function GET(_req: Request, ctx: { params: Promise<Params> }) {
  const { id } = await ctx.params;

  const answers = await prisma.practiceAnswer.findMany({
    where: { sessionId: id },
    include: { question: true },
    orderBy: { gradedAt: "desc" },
  });

  const totalScore = answers.reduce((sum, a) => sum + a.score, 0);

  return NextResponse.json({
    totalScore,
    answers: answers.map((a) => ({
      id: a.id,
      questionId: a.questionId,
      questionType: a.question.questionType,
      stem: a.question.stem,
      userAnswerJson: a.userAnswerJson,
      feedback: a.feedback,
      score: a.score,
      isCorrect: a.isCorrect,
      citations: a.question.sourceCitationsJson,
    })),
  });
}
