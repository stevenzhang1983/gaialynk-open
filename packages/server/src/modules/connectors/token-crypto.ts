import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const AUTH_TAG_LEN = 16;

function getKey(): Buffer {
  const raw = process.env.CONNECTOR_TOKEN_ENCRYPTION_KEY?.trim();
  if (raw && raw.length >= 32) {
    return createHash("sha256").update(raw, "utf8").digest();
  }
  if (process.env.NODE_ENV === "test" || process.env.VITEST === "true") {
    return createHash("sha256").update("test-connector-token-key-min-32-chars!!", "utf8").digest();
  }
  throw new Error("CONNECTOR_TOKEN_ENCRYPTION_KEY must be set (min 32 chars) for cloud connector OAuth storage");
}

/** Returns base64(iv || ciphertext+tag). */
export function encryptConnectorSecret(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, enc, tag]).toString("base64url");
}

export function decryptConnectorSecret(encoded: string): string {
  const key = getKey();
  const buf = Buffer.from(encoded, "base64url");
  if (buf.length < IV_LEN + AUTH_TAG_LEN + 1) {
    throw new Error("invalid ciphertext");
  }
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(buf.length - AUTH_TAG_LEN);
  const data = buf.subarray(IV_LEN, buf.length - AUTH_TAG_LEN);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
