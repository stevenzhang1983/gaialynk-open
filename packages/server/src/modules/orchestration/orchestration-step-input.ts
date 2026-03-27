import type { TopologyStepSpec } from "./orchestration.types";

function getDotPath(obj: unknown, path: string): unknown {
  const parts = path.split(".").filter(Boolean);
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as object)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return cur;
}

/** Merge field_mapping (legacy), topology input_mapping, and persisted row mapping (DB). */
export function mergeStepInputMapping(
  spec: TopologyStepSpec,
  rowMapping: Record<string, unknown> | null | undefined,
): Record<string, string> {
  const out: Record<string, string> = {};
  const apply = (o?: Record<string, string>): void => {
    if (!o) return;
    for (const [k, v] of Object.entries(o)) {
      out[k] = v;
    }
  };
  apply(spec.field_mapping);
  apply(spec.input_mapping);
  if (rowMapping && typeof rowMapping === "object" && !Array.isArray(rowMapping)) {
    for (const [k, v] of Object.entries(rowMapping)) {
      if (typeof v === "string") {
        out[k] = v;
      }
    }
  }
  return out;
}

export function resolveMappedPlaceholders(
  prevOutput: Record<string, unknown> | null,
  mapping: Record<string, string>,
): Record<string, string> {
  const placeholders: Record<string, string> = {};
  if (!prevOutput) {
    return placeholders;
  }
  for (const [key, path] of Object.entries(mapping)) {
    const v = getDotPath(prevOutput, path);
    placeholders[key] = v === undefined || v === null ? "" : typeof v === "string" ? v : JSON.stringify(v);
  }
  return placeholders;
}

export function buildStepUserText(
  spec: TopologyStepSpec,
  userMessage: string,
  prevOutput: Record<string, unknown> | null,
  pathMapping: Record<string, string>,
): string {
  const prevStr = prevOutput ? JSON.stringify(prevOutput) : "";
  const pathPlaceholders = resolveMappedPlaceholders(prevOutput, pathMapping);
  let text = spec.expected_input.template
    .replace(/\{\{user_message\}\}/g, userMessage)
    .replace(/\{\{prev\}\}/g, prevStr);
  for (const [k, v] of Object.entries(pathPlaceholders)) {
    text = text.split(`{{${k}}}`).join(v);
  }
  return text;
}
