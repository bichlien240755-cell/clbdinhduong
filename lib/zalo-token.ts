import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { createServiceClient } from "@/lib/supabase-admin";

type TokenRow = { id: number; encrypted_access_token: string | null; encrypted_refresh_token: string; access_expires_at: string | null };
function encryptionKey() {
  const raw = process.env.ZALO_TOKEN_ENCRYPTION_KEY;
  if (!raw) throw new Error("Missing token encryption key");
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("ZALO_TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key");
  return key;
}
function encrypt(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return `${iv.toString("base64")}.${cipher.getAuthTag().toString("base64")}.${encrypted.toString("base64")}`;
}
function decrypt(value: string) {
  const [iv, tag, encrypted] = value.split(".");
  if (!iv || !tag || !encrypted) throw new Error("Invalid encrypted token value");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(encrypted, "base64")), decipher.final()]).toString("utf8");
}

export async function getZaloAccessToken() {
  const appId = process.env.ZALO_APP_ID;
  const appSecret = process.env.ZALO_APP_SECRET;
  const bootstrapRefresh = process.env.ZALO_REFRESH_TOKEN;
  if (!appId || !appSecret) throw new Error("Missing Zalo App credentials");
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("zalo_token_state").select("id,encrypted_access_token,encrypted_refresh_token,access_expires_at").eq("id", 1).maybeSingle();
  if (error) throw new Error("Could not read encrypted Zalo token state");

  let row = data as TokenRow | null;
  if (!row) {
    if (!bootstrapRefresh) throw new Error("Missing initial Zalo refresh token");
    const { error: insertError } = await supabase.from("zalo_token_state").insert({ id: 1, encrypted_refresh_token: encrypt(bootstrapRefresh) });
    if (insertError && insertError.code !== "23505") throw new Error("Could not initialize Zalo token state");
    const { data: refreshed } = await supabase.from("zalo_token_state").select("id,encrypted_access_token,encrypted_refresh_token,access_expires_at").eq("id", 1).single();
    row = refreshed as TokenRow;
  }

  const expiry = row.access_expires_at ? new Date(row.access_expires_at).getTime() : 0;
  if (row.encrypted_access_token && expiry > Date.now() + 5 * 60 * 1000) return decrypt(row.encrypted_access_token);

  const form = new URLSearchParams({ app_id: appId, grant_type: "refresh_token", refresh_token: decrypt(row.encrypted_refresh_token) });
  const response = await fetch("https://oauth.zaloapp.com/v4/oa/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", secret_key: appSecret },
    body: form.toString(), cache: "no-store",
  });
  const payload = await response.json().catch(() => ({})) as { access_token?: string; refresh_token?: string; expires_in?: string | number; error?: number; message?: string };
  if (!response.ok || !payload.access_token || !payload.refresh_token) {
    // Never expose the provider's raw response because it may include operational details.
    throw new Error(`Zalo token refresh failed (${payload.error ?? response.status})`);
  }
  const expiresIn = Number(payload.expires_in ?? 90000);
  const expiresAt = new Date(Date.now() + Math.max(60, expiresIn) * 1000).toISOString();
  const { error: updateError } = await supabase.from("zalo_token_state").update({
    encrypted_access_token: encrypt(payload.access_token),
    encrypted_refresh_token: encrypt(payload.refresh_token),
    access_expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  }).eq("id", 1);
  if (updateError) throw new Error("Could not persist rotated Zalo tokens");
  return payload.access_token;
}
