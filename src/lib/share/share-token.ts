import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const ENV_KEY = "SHARE_TOKEN_HMAC_SECRET";

function getSecret(): string {
  const apiKey = process.env.SHARE_TOKEN_HMAC_SECRET;
  if (!apiKey || apiKey.length === 0) {
    throw new Error(
      `${ENV_KEY} is not configured — set it on Vercel before issuing share links.`,
    );
  }
  return apiKey;
}

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): Buffer {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

function hmac(payload: string): string {
  const secret = getSecret();
  return b64url(createHmac("sha256", secret).update(payload).digest());
}

export function signShareToken(payload: string): string {
  const nonce = b64url(randomBytes(12));
  const body = `${payload}.${nonce}`;
  const sig = hmac(body);
  return `${body}.${sig}`;
}

export function verifyShareToken(token: string): string | null {
  if (typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [payload, nonce, sig] = parts;
  const expected = hmac(`${payload}.${nonce}`);
  const a = fromB64url(sig);
  const b = fromB64url(expected);
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;
  return payload;
}
