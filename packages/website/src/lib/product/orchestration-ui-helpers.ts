export type CronPreset = "daily9" | "weeklyMon9" | "custom";

/** 标准 5 段 cron（UTC），与主线 orchestration-cron 一致 */
export function cronExpressionFromPicker(v: { preset: CronPreset; customCron: string }): string {
  if (v.preset === "daily9") return "0 9 * * *";
  if (v.preset === "weeklyMon9") return "0 9 * * 1";
  return v.customCron.trim();
}

/** W-20：编排步骤输出摘要（用于气泡与预览） */
export function summarizeOrchestrationOutput(o: Record<string, unknown> | null | undefined): string {
  if (!o || typeof o !== "object") return "—";
  const text = o.text;
  if (typeof text === "string" && text.trim()) return text.trim().slice(0, 140);
  const keys = Object.keys(o).slice(0, 4);
  if (keys.length === 0) return "—";
  return keys
    .map((k) => {
      const v = o[k];
      const s = typeof v === "string" ? v : JSON.stringify(v);
      return `${k}: ${s.slice(0, 48)}`;
    })
    .join(" · ");
}
