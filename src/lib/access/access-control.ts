import { createHash, timingSafeEqual } from "crypto";

const ACCESS_CODES_ENV = "ASHUI_ACCESS_CODES";
const ACCESS_TOKEN_PREFIX = "ashui-access-token:";
const ACCESS_CODE_ID_PREFIX = "ashui-access-code-id:";

export type AccessVerificationResult =
  | { ok: true; codeId: string; token: string }
  | { ok: false; reason: "not_configured" | "invalid" };

export function getConfiguredAccessCodes() {
  return (process.env[ACCESS_CODES_ENV] ?? "")
    .split(",")
    .map((code) => code.trim())
    .filter(Boolean);
}

export function isAccessControlConfigured() {
  return getConfiguredAccessCodes().length > 0;
}

export function getAccessCodeId(code: string) {
  return createHash("sha256")
    .update(`${ACCESS_CODE_ID_PREFIX}${code}`)
    .digest("hex")
    .slice(0, 12);
}

function getAccessToken(code: string) {
  return createHash("sha256")
    .update(`${ACCESS_TOKEN_PREFIX}${code}`)
    .digest("hex");
}

function safeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) return false;

  return timingSafeEqual(aBuffer, bBuffer);
}

export function verifyAccessCode(input: string): AccessVerificationResult {
  const accessCodes = getConfiguredAccessCodes();
  const normalizedInput = input.trim();

  if (accessCodes.length === 0) {
    return { ok: false, reason: "not_configured" };
  }

  if (!normalizedInput) {
    return { ok: false, reason: "invalid" };
  }

  const matchedCode = accessCodes.find((code) => safeEqual(code, normalizedInput));

  if (!matchedCode) {
    return { ok: false, reason: "invalid" };
  }

  return {
    ok: true,
    codeId: getAccessCodeId(matchedCode),
    token: getAccessToken(matchedCode),
  };
}

export function isAccessTokenValid(token: string | undefined) {
  if (!token) return false;

  return getConfiguredAccessCodes().some((code) => safeEqual(getAccessToken(code), token));
}
