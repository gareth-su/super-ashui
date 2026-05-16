import { QuestionType } from "@prisma/client";

export type GradeInput = {
  type: QuestionType;
  answerJson: string;
  userAnswerJson: string;
};

export function gradeObjective(input: GradeInput): { score: number; isCorrect: boolean } {
  if (input.type === "SHORT" || input.type === "CASE") {
    return { score: 0, isCorrect: false };
  }

  try {
    const std = JSON.parse(input.answerJson);
    const usr = JSON.parse(input.userAnswerJson);

    const stdText = JSON.stringify(std);
    const usrText = JSON.stringify(usr);
    const correct = stdText === usrText;

    return { score: correct ? 1 : 0, isCorrect: correct };
  } catch {
    return { score: 0, isCorrect: false };
  }
}
