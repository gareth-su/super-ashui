import fs from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

async function ensureDefaultSubject() {
  const name = "衍生金融工具";
  const existing = await prisma.subject.findUnique({ where: { name } });
  if (existing) return existing;
  return prisma.subject.create({ data: { name } });
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const subjectIdRaw = form.get("subjectId");

  if (!file) {
    return NextResponse.json({ error: "缺少上传文件" }, { status: 400 });
  }

  const subject =
    typeof subjectIdRaw === "string" && subjectIdRaw
      ? await prisma.subject.findUnique({ where: { id: subjectIdRaw } })
      : await ensureDefaultSubject();

  if (!subject) {
    return NextResponse.json({ error: "学科不存在" }, { status: 404 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const stamp = Date.now();
  const safeName = file.name.replace(/[\\/:*?"<>|]/g, "_");
  const saveName = `${stamp}_${safeName}`;
  const uploadDir = path.join(process.cwd(), "uploads");
  const savePath = path.join(uploadDir, saveName);

  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(savePath, buffer);

  const material = await prisma.material.create({
    data: {
      subjectId: subject.id,
      title: file.name,
      filePath: savePath,
      mimeType: file.type || null,
      uploadStatus: "STORED",
      parseStatus: "PENDING",
    },
  });

  return NextResponse.json({ material });
}
