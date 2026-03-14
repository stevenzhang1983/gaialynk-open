import { describe, expect, it } from "vitest";
import {
  getReceiptById,
  issueReceipt,
  resetReceiptStore,
  verifyReceipt,
} from "../src/modules/audit/receipt.store";

describe("receipt.store", () => {
  it("issues and verifies receipt signature", () => {
    resetReceiptStore();

    const receipt = issueReceipt({
      auditEventId: "audit-1",
      conversationId: "conv-1",
      receiptType: "invocation_completed",
      payload: { value: "hello" },
    });

    const persisted = getReceiptById(receipt.id);
    expect(persisted).not.toBeNull();
    expect(verifyReceipt(receipt)).toBe(true);
  });

  it("chains receipts with prev_receipt_hash", () => {
    resetReceiptStore();

    const first = issueReceipt({
      auditEventId: "audit-1",
      conversationId: "conv-1",
      receiptType: "invocation_completed",
      payload: { index: 1 },
    });

    const second = issueReceipt({
      auditEventId: "audit-2",
      conversationId: "conv-1",
      receiptType: "invocation_completed",
      payload: { index: 2 },
    });

    expect(second.prev_receipt_hash).toBe(first.payload_hash);
  });

  it("fails verification for tampered signature", () => {
    resetReceiptStore();

    const receipt = issueReceipt({
      auditEventId: "audit-1",
      conversationId: "conv-1",
      receiptType: "invocation_completed",
      payload: { value: "hello" },
    });

    const tampered = { ...receipt, signature: "invalid" };
    expect(verifyReceipt(tampered)).toBe(false);
  });
});
