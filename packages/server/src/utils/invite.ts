/**
 * 邀请码工具：使用 HMAC 签名生成/验证邀请码
 * 邀请码编码了 fromUserId + petId，无需额外数据库表
 */

const INVITE_SECRET =
  process.env.INVITE_SECRET ?? "yehey-invite-secret-dev";

interface InvitePayload {
  fromUserId: string;
  petId: string;
}

export async function generateInviteCode(
  payload: InvitePayload
): Promise<string> {
  const data = btoa(JSON.stringify(payload));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(INVITE_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data)
  );
  const signature = btoa(String.fromCharCode(...new Uint8Array(sig)));
  // URL-safe: replace +/= with -_
  return `${data}.${signature}`
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export async function verifyInviteCode(
  code: string
): Promise<InvitePayload | null> {
  try {
    // Restore base64 padding
    const restored = code.replace(/-/g, "+").replace(/_/g, "/");
    const [data, signature] = restored.split(".");
    if (!data || !signature) return null;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(INVITE_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    // Pad base64 if needed
    const pad = (s: string) => s + "=".repeat((4 - (s.length % 4)) % 4);
    const sigBytes = Uint8Array.from(atob(pad(signature)), (c) =>
      c.charCodeAt(0)
    );
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      new TextEncoder().encode(data)
    );
    if (!valid) return null;

    return JSON.parse(atob(pad(data)));
  } catch {
    return null;
  }
}
