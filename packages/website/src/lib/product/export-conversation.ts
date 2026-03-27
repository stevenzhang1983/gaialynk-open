import type { ApiMessage } from "@/lib/product/chat-types";

function redactMessageText(text: string): string {
  return text
    .replace(/@user:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "@user:***")
    .replace(/@agent:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "@agent:***");
}

function roleLabel(senderType: string): string {
  if (senderType === "user") return "User";
  if (senderType === "agent") return "Agent";
  return "System";
}

/**
 * W-6：导出为 Markdown；`redact` 时弱化 @user/@agent UUID（与审计可见范围对齐的轻量脱敏）。
 */
export function buildConversationMarkdownExport(
  title: string,
  messages: ApiMessage[],
  opts: { redact: boolean },
): string {
  const lines: string[] = [`# ${title}`, ""];
  for (const m of messages) {
    let text = m.content?.text ?? "";
    if (opts.redact) {
      text = redactMessageText(text);
    }
    lines.push(`## ${roleLabel(m.sender_type)} · ${m.created_at}`, "", text, "");
  }
  return lines.join("\n");
}

/** W-6：纯文本导出（同内容，无 Markdown 标题层级）。 */
export function buildConversationPlainExport(
  title: string,
  messages: ApiMessage[],
  opts: { redact: boolean },
): string {
  const lines: string[] = [`${title}`, "=".repeat(Math.min(title.length, 60)), ""];
  for (const m of messages) {
    let text = m.content?.text ?? "";
    if (opts.redact) {
      text = redactMessageText(text);
    }
    lines.push(`[${roleLabel(m.sender_type)}] ${m.created_at}`, text, "");
  }
  return lines.join("\n");
}
