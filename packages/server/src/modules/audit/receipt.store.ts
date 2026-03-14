import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
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

const RECEIPT_SECRET = "phase0-local-receipt-secret";
const RECEIPT_SIGNER = "gaialynk-phase0";
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

const signPayloadHash = (payloadHash: string): string => {
  return createHmac("sha256", RECEIPT_SECRET).update(payloadHash).digest("hex");
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
    signer: RECEIPT_SIGNER,
    issued_at: new Date().toISOString(),
    prev_receipt_hash: lastInConversation?.payload_hash,
  };

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
    signer: RECEIPT_SIGNER,
    issued_at: new Date().toISOString(),
    prev_receipt_hash: previousRows[0]?.payload_hash,
  };

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
