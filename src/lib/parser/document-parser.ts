import fs from "node:fs/promises";
import path from "node:path";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import { normalizeText } from "@/lib/parser/normalizers";

export type ParsedSection = {
  text: string;
  page?: number;
  section?: string;
};

async function parsePdf(filePath: string): Promise<ParsedSection[]> {
  const buffer = await fs.readFile(filePath);
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    const normalized = normalizeText(result.text ?? "");
    return normalized ? [{ text: normalized, page: 1, section: "PDF正文" }] : [];
  } finally {
    await parser.destroy();
  }
}

async function parseDocx(filePath: string): Promise<ParsedSection[]> {
  const buffer = await fs.readFile(filePath);
  const result = await mammoth.extractRawText({ buffer });
  return [{ text: normalizeText(result.value), page: 1, section: "DOCX正文" }];
}

async function parsePptx(filePath: string): Promise<ParsedSection[]> {
  // 首版使用轻量策略：把 pptx 当 zip/xml 文本提取关键可读段
  const buffer = await fs.readFile(filePath);
  const fallback = buffer.toString("utf-8").replace(/<[^>]+>/g, " ");
  return [{ text: normalizeText(fallback), page: 1, section: "PPTX提取文本" }];
}

export async function parseDocument(filePath: string): Promise<ParsedSection[]> {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".pdf") return parsePdf(filePath);
  if (ext === ".docx" || ext === ".doc") return parseDocx(filePath);
  if (ext === ".pptx" || ext === ".ppt") return parsePptx(filePath);

  // 兜底：按文本读取
  const content = await fs.readFile(filePath, "utf-8");
  return [{ text: normalizeText(content), page: 1, section: "通用文本" }];
}
