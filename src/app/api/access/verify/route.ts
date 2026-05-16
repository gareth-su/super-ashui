import { NextResponse } from "next/server";
import { verifyAccessCode } from "@/lib/access/access-control";

const ACCESS_COOKIE_NAME = "ashui_access";
const ACCESS_CODE_ID_COOKIE_NAME = "ashui_access_code_id";
const ACCESS_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请输入访问码。" }, { status: 400 });
  }

  const accessCode = body && typeof body === "object" && "accessCode" in body
    ? (body as { accessCode?: unknown }).accessCode
    : undefined;

  if (typeof accessCode !== "string" || !accessCode.trim()) {
    return NextResponse.json({ error: "请输入访问码。" }, { status: 400 });
  }

  const result = verifyAccessCode(accessCode);

  if (!result.ok) {
    if (result.reason === "not_configured") {
      return NextResponse.json({ error: "访问码暂未配置，请联系管理员。" }, { status: 503 });
    }

    return NextResponse.json({ error: "访问码不正确，请重新输入。" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  const secure = process.env.NODE_ENV === "production";

  response.cookies.set(ACCESS_COOKIE_NAME, result.token, {
    httpOnly: true,
    maxAge: ACCESS_COOKIE_MAX_AGE,
    sameSite: "lax",
    secure,
    path: "/",
  });

  response.cookies.set(ACCESS_CODE_ID_COOKIE_NAME, result.codeId, {
    httpOnly: false,
    maxAge: ACCESS_COOKIE_MAX_AGE,
    sameSite: "lax",
    secure,
    path: "/",
  });

  return response;
}
