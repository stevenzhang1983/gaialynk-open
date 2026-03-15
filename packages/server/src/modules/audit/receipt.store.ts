import {
  createHash,
  createHmac,
  createPrivateKey,
  createPublicKey,
  randomUUID,
  sign,
  timingSafeEqual,
  verify,
} from "node:crypto";
import { isPostgresEnabled, query } from "../../infra/db/client";

export interface Receipt {
  id: string;
  audit_event_id: string;
  conversation_id: string;
  receipt_type: string;
  payload_hash: string;
  signature: string;
  signer: string;
  issued_at: string;
  prev_receipt_hash?: string;
}

interface IssueReceiptInput {
  auditEventId: string;
  conversationId: string;
  receiptType: string;
  payload: Record<string, unknown>;
}

const RECEIPT_HMAC_SECRET = process.env.RECEIPT_HMAC_SECRET ?? "dev-insecure-receipt-secret";
const RECEIPT_HMAC_SIGNER = "gaialynk-phase0-hmac";
const RECEIPT_ED25519_SIGNER = "gaialynk-phase1-ed25519";
const RECEIPT_ED25519_KID = process.env.RECEIPT_ED25519_KEY_ID ?? "phase1-default";
const receipts: Receipt[] = [];
const payloadByReceiptId = new Map<string, Record<string, unknown>>();

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => canonicalize(item));
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
    const output: Record<string, unknown> = {};
    for (const [key, nestedValue] of entries) {
      output[key] = canonicalize(nestedValue);
    }
    return output;
  }

  return value;
};

const hashPayload = (payload: Record<string, unknown>): string => {
  const canonicalPayload = canonicalize(payload);
  return createHash("sha256").update(JSON.stringify(canonicalPayload)).digest("hex");
};

const base64UrlEncode = (input: Buffer | string): string => {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
};

const base64UrlDecode = (input: string): Buffer => {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return Buffer.from(padded, "base64");
};

const getEd25519PrivateKey = () => {
  const pem = process.env.RECEIPT_ED25519_PRIVATE_KEY_PEM;
  if (!pem) {
    return null;
  }
  return createPrivateKey(pem.replace(/\\n/g, "\n"));
};

const getEd25519PublicKey = () => {
  const pem = process.env.RECEIPT_ED25519_PUBLIC_KEY_PEM;
  if (!pem) {
    return null;
  }
  return createPublicKey(pem.replace(/\\n/g, "\n"));
};

const signEd25519Jws = (receipt: Receipt): string | null => {
  const privateKey = getEd25519PrivateKey();
  if (!privateKey) {
    return null;
  }

  const header = {
    alg: "EdDSA",
    typ: "JOSE",
    kid: RECEIPT_ED25519_KID,
  };
  const payload = {
    payload_hash: receipt.payload_hash,
    conversation_id: receipt.conversation_id,
    audit_event_id: receipt.audit_event_id,
    issued_at: receipt.issued_at,
    prev_receipt_hash: receipt.prev_receipt_hash ?? null,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = sign(null, Buffer.from(signingInput, "utf8"), privateKey);

  return `${signingInput}.${base64UrlEncode(signature)}`;
};

const signPayloadHash = (payloadHash: string): string => {
  return createHmac("sha256", RECEIPT_HMAC_SECRET).update(payloadHash).digest("hex");
};

const verifyEd25519Jws = (receipt: Receipt): boolean => {
  const publicKey = getEd25519PublicKey();
  if (!publicKey) {
    return false;
  }

  const parts = receipt.signature.split(".");
  if (parts.length !== 3) {
    return false;
  }

  const encodedHeader = parts[0];
  const encodedPayload = parts[1];
  const encodedSignature = parts[2];
  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    return false;
  }
  const payloadBuffer = base64UrlDecode(encodedPayload);
  const payload = JSON.parse(payloadBuffer.toString("utf8")) as {
    payload_hash?: string;
    conversation_id?: string;
    audit_event_id?: string;
    issued_at?: string;
  };

  if (
    payload.payload_hash !== receipt.payload_hash ||
    payload.conversation_id !== receipt.conversation_id ||
    payload.audit_event_id !== receipt.audit_event_id ||
    payload.issued_at !== receipt.issued_at
  ) {
    return false;
  }

  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signatureBuffer = base64UrlDecode(encodedSignature);
  return verify(null, Buffer.from(signingInput, "utf8"), publicKey, signatureBuffer);
};

export const issueReceipt = (input: IssueReceiptInput): Receipt => {
  if (isPostgresEnabled()) {
    throw new Error("Use issueReceiptAsync in PostgreSQL mode");
  }

  const payloadHash = hashPayload(input.payload);
  const signature = signPayloadHash(payloadHash);

  const lastInConversation = [...receipts]
    .reverse()
    .find((receipt) => receipt.conversation_id === input.conversationId);

  const receipt: Receipt = {
    id: randomUUID(),
    audit_event_id: input.auditEventId,
    conversation_id: input.conversationId,
    receipt_type: input.receiptType,
    payload_hash: payloadHash,
    signature,
    signer: RECEIPT_HMAC_SIGNER,
    issued_at: new Date().toISOString(),
    prev_receipt_hash: lastInConversation?.payload_hash,
  };

  const jwsSignature = signEd25519Jws(receipt);
  if (jwsSignature) {
    receipt.signature = jwsSignature;
    receipt.signer = `${RECEIPT_ED25519_SIGNER}:${RECEIPT_ED25519_KID}`;
  }

  receipts.push(receipt);
  payloadByReceiptId.set(receipt.id, input.payload);

  return receipt;
};

export const getReceiptById = (receiptId: string): Receipt | null => {
  if (isPostgresEnabled()) {
    throw new Error("Use getReceiptByIdAsync in PostgreSQL mode");
  }

  return receipts.find((receipt) => receipt.id === receiptId) ?? null;
};

export const verifyReceipt = (receipt: Receipt): boolean => {
  const payload = payloadByReceiptId.get(receipt.id);
  if (!payload) {
    return false;
  }

  const recomputedHash = hashPayload(payload);
  if (recomputedHash !== receipt.payload_hash) {
    return false;
  }

  if (receipt.signer.startsWith(RECEIPT_ED25519_SIGNER)) {
    return verifyEd25519Jws(receipt);
  }

  const expectedSignature = signPayloadHash(receipt.payload_hash);
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const actualBuffer = Buffer.from(receipt.signature, "utf8");

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
};

export const resetReceiptStore = (): void => {
  receipts.length = 0;
  payloadByReceiptId.clear();
};

export const issueReceiptAsync = async (input: IssueReceiptInput): Promise<Receipt> => {
  if (!isPostgresEnabled()) {
    return issueReceipt(input);
  }

  const payloadHash = hashPayload(input.payload);
  const signature = signPayloadHash(payloadHash);

  const previousRows = await query<{ payload_hash: string }>(
    `SELECT payload_hash
     FROM receipts
     WHERE conversation_id = $1
     ORDER BY issued_at DESC
     LIMIT 1`,
    [input.conversationId],
  );

  const receipt: Receipt = {
    id: randomUUID(),
    audit_event_id: input.auditEventId,
    conversation_id: input.conversationId,
    receipt_type: input.receiptType,
    payload_hash: payloadHash,
    signature,
    signer: RECEIPT_HMAC_SIGNER,
    issued_at: new Date().toISOString(),
    prev_receipt_hash: previousRows[0]?.payload_hash,
  };

  const jwsSignature = signEd25519Jws(receipt);
  if (jwsSignature) {
    receipt.signature = jwsSignature;
    receipt.signer = `${RECEIPT_ED25519_SIGNER}:${RECEIPT_ED25519_KID}`;
  }

  await query(
    `INSERT INTO receipts
     (id, audit_event_id, conversation_id, receipt_type, payload_hash, signature, signer, issued_at, prev_receipt_hash, payload)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)`,
    [
      receipt.id,
      receipt.audit_event_id,
      receipt.conversation_id,
      receipt.receipt_type,
      receipt.payload_hash,
      receipt.signature,
      receipt.signer,
      receipt.issued_at,
      receipt.prev_receipt_hash ?? null,
      JSON.stringify(input.payload),
    ],
  );

  return receipt;
};

export const getReceiptByIdAsync = async (receiptId: string): Promise<Receipt | null> => {
  if (!isPostgresEnabled()) {
    return getReceiptById(receiptId);
  }

  const rows = await query<Receipt>(
    `SELECT id, audit_event_id, conversation_id, receipt_type, payload_hash, signature, signer, issued_at::text, prev_receipt_hash
     FROM receipts
     WHERE id = $1`,
    [receiptId],
  );

  return rows[0] ?? null;
};

export const verifyReceiptAsync = async (receipt: Receipt): Promise<boolean> => {
  if (!isPostgresEnabled()) {
    return verifyReceipt(receipt);
  }

  const rows = await query<{ payload: Record<string, unknown> | string }>(
    `SELECT payload FROM receipts WHERE id = $1`,
    [receipt.id],
  );

  const payloadRaw = rows[0]?.payload;
  if (!payloadRaw) {
    return false;
  }

  const payload = typeof payloadRaw === "string" ? (JSON.parse(payloadRaw) as Record<string, unknown>) : payloadRaw;

  const recomputedHash = hashPayload(payload);
  if (recomputedHash !== receipt.payload_hash) {
    return false;
  }

  if (receipt.signer.startsWith(RECEIPT_ED25519_SIGNER)) {
    return verifyEd25519Jws(receipt);
  }

  const expectedSignature = signPayloadHash(receipt.payload_hash);
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const actualBuffer = Buffer.from(receipt.signature, "utf8");

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
};

export const countReceiptsAsync = async (): Promise<number> => {
  if (!isPostgresEnabled()) {
    return receipts.length;
  }

  const rows = await query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM receipts`);
  return Number(rows[0]?.count ?? "0");
};
