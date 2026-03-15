import { describe, expect, it } from "vitest";
import { generateKeyPairSync } from "node:crypto";
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

  it("supports Ed25519/JWS signing when keys are configured", () => {
    resetReceiptStore();
    const { privateKey, publicKey } = generateKeyPairSync("ed25519");
    const previousPrivate = process.env.RECEIPT_ED25519_PRIVATE_KEY_PEM;
    const previousPublic = process.env.RECEIPT_ED25519_PUBLIC_KEY_PEM;

    try {
      process.env.RECEIPT_ED25519_PRIVATE_KEY_PEM = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
      process.env.RECEIPT_ED25519_PUBLIC_KEY_PEM = publicKey.export({ type: "spki", format: "pem" }).toString();

      const receipt = issueReceipt({
        auditEventId: "audit-ed25519",
        conversationId: "conv-ed25519",
        receiptType: "invocation_completed",
        payload: { value: "secure" },
      });

      expect(receipt.signer.startsWith("gaialynk-phase1-ed25519")).toBe(true);
      expect(receipt.signature.split(".")).toHaveLength(3);
      expect(verifyReceipt(receipt)).toBe(true);
    } finally {
      if (previousPrivate === undefined) {
        delete process.env.RECEIPT_ED25519_PRIVATE_KEY_PEM;
      } else {
        process.env.RECEIPT_ED25519_PRIVATE_KEY_PEM = previousPrivate;
      }

      if (previousPublic === undefined) {
        delete process.env.RECEIPT_ED25519_PUBLIC_KEY_PEM;
      } else {
        process.env.RECEIPT_ED25519_PUBLIC_KEY_PEM = previousPublic;
      }
    }
  });
});
