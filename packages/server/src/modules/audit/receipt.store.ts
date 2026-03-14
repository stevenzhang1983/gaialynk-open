import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";

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

const hashPayload = (payload: Record<string, unknown>): string => {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
};

const signPayloadHash = (payloadHash: string): string => {
  return createHmac("sha256", RECEIPT_SECRET).update(payloadHash).digest("hex");
};

export const issueReceipt = (input: IssueReceiptInput): Receipt => {
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
