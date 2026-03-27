import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { EmailNotificationTemplateId } from "../auth/user.store";

const templatesDir = join(dirname(fileURLToPath(import.meta.url)), "templates");

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

function applyVariables(html: string, variables: Record<string, string>): string {
  let out = html;
  for (const [k, v] of Object.entries(variables)) {
    out = out.split(`{{${k}}}`).join(v);
  }
  return out;
}

export async function sendTemplateEmailAsync(params: {
  to: string;
  templateId: EmailNotificationTemplateId;
  subject: string;
  variables: Record<string, string>;
}): Promise<void> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    throw new Error("RESEND_API_KEY is not set");
  }
  const path = join(templatesDir, `${params.templateId}.html`);
  const raw = readFileSync(path, "utf8");
  const html = applyVariables(raw, params.variables);
  const from =
    process.env.RESEND_FROM_EMAIL?.trim() ?? "GaiaLynk <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject: params.subject,
      html,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`resend_http_${res.status}:${text}`);
  }
}
