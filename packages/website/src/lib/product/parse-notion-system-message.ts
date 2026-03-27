/** Must match server `cloud-proxy.router.ts` GL_NOTION_RECEIPT_V1 */
export const GL_NOTION_RECEIPT_V1 = "gl_notion_receipt_v1";

export type ParsedNotionReceiptPayload = {
  receipt_id: string;
  action: string;
  status: "ok" | "error" | "connector_expired";
  target_label?: string;
};

export type ParseNotionSystemMessageResult = {
  humanText: string;
  receipt: ParsedNotionReceiptPayload;
};

/**
 * Parses system messages from Notion cloud connector (`title` line "Notion" + optional human lines + JSON receipt line).
 */
export function parseNotionSystemMessage(raw: string): ParseNotionSystemMessageResult | null {
  const lines = raw.split("\n");
  if (lines.length < 2 || lines[0]?.trim() !== "Notion") return null;

  let receipt: ParsedNotionReceiptPayload | null = null;
  const human: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    try {
      const j = JSON.parse(line) as {
        v?: number;
        t?: string;
        receipt_id?: string;
        action?: string;
        status?: string;
        target_label?: string;
      };
      if (
        j?.t === GL_NOTION_RECEIPT_V1 &&
        typeof j.receipt_id === "string" &&
        typeof j.action === "string" &&
        (j.status === "ok" || j.status === "error" || j.status === "connector_expired")
      ) {
        receipt = {
          receipt_id: j.receipt_id,
          action: j.action,
          status: j.status,
          target_label: typeof j.target_label === "string" ? j.target_label : undefined,
        };
        continue;
      }
    } catch {
      /* not JSON */
    }
    human.push(line);
  }
  if (!receipt) return null;
  return { humanText: human.join("\n").trim(), receipt };
}
