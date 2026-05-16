import { prisma } from "@/lib/db/prisma";

export async function getOrCreateDefaultSubject() {
  const name = "衍生金融工具";
  const existing = await prisma.subject.findUnique({ where: { name } });
  if (existing) return existing;
  return prisma.subject.create({ data: { name } });
}
