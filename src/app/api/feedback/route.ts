import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isAccessControlConfigured, isAccessTokenValid } from "@/lib/access/access-control";

const FEEDBACK_TYPES = ["内容错误", "看不懂", "页面问题", "功能建议", "其他"] as const;
const MAX_CONTENT_LENGTH = 1000;
const MAX_CONTACT_LENGTH = 100;
const MAX_PAGE_URL_LENGTH = 500;

function getStringField(body: Record<string, unknown>, field: string) {
  const value = body[field];
  return typeof value === "string" ? value.trim() : "";
}

function isFeedbackType(value: string): value is typeof FEEDBACK_TYPES[number] {
  return FEEDBACK_TYPES.includes(value as typeof FEEDBACK_TYPES[number]);
}

function formatOptional(value: string) {
  return value || "未填写";
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("ashui_access")?.value;

  if (!isAccessControlConfigured() || !isAccessTokenValid(accessToken)) {
    return NextResponse.json({ error: "未授权。" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "提交失败，请稍后再试。" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "提交失败，请稍后再试。" }, { status: 400 });
  }

  const fields = body as Record<string, unknown>;
  const type = getStringField(fields, "type");
  const content = getStringField(fields, "content");
  const contact = getStringField(fields, "contact");
  const courseId = getStringField(fields, "courseId");
  const pageUrl = getStringField(fields, "pageUrl");

  if (!isFeedbackType(type)) {
    return NextResponse.json({ error: "请选择反馈类型。" }, { status: 400 });
  }

  if (!content) {
    return NextResponse.json({ error: "请填写具体反馈内容。" }, { status: 400 });
  }

  if (content.length > MAX_CONTENT_LENGTH || contact.length > MAX_CONTACT_LENGTH || pageUrl.length > MAX_PAGE_URL_LENGTH) {
    return NextResponse.json({ error: "提交失败，请稍后再试。" }, { status: 400 });
  }

  const webhookUrl = process.env.FEISHU_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error("Feishu feedback webhook is not configured.");
    return NextResponse.json({ error: "提交失败，请稍后再试。" }, { status: 500 });
  }

  const accessCodeId = cookieStore.get("ashui_access_code_id")?.value ?? "未获取";
  const userAgent = request.headers.get("user-agent") ?? "未获取";
  const submittedAt = new Date().toISOString();
  const message = [
    "超级阿水反馈",
    "",
    `类型：${type}`,
    `课程：${formatOptional(courseId)}`,
    `页面：${formatOptional(pageUrl)}`,
    `访问码标识：${accessCodeId}`,
    `内容：${content}`,
    `联系方式：${formatOptional(contact)}`,
    `时间：${submittedAt}`,
    `User-Agent：${userAgent}`,
    "来源：超级阿水学习平台",
  ].join("\n");

  try {
    const feishuResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        msg_type: "text",
        content: { text: message },
      }),
    });

    if (!feishuResponse.ok) {
      console.error("Feishu feedback webhook request failed.", { status: feishuResponse.status });
      return NextResponse.json({ error: "提交失败，请稍后再试。" }, { status: 502 });
    }
  } catch {
    console.error("Feishu feedback webhook request failed.");
    return NextResponse.json({ error: "提交失败，请稍后再试。" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
