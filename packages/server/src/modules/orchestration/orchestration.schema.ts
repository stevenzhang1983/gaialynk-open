import { z } from "zod";

export const topologyStepSpecSchema = z.object({
  agent_id: z.string().uuid(),
  capability_name: z.string().min(1).optional(),
  expected_input: z.object({
    template: z.string().min(1),
    description: z.string().optional(),
  }),
  expected_output: z.object({
    required_fields: z.array(z.string().min(1)).min(1),
  }),
  field_mapping: z.record(z.string(), z.string()).optional(),
  input_mapping: z.record(z.string(), z.string()).optional(),
  output_schema: z.record(z.string(), z.unknown()).optional(),
});

export const orchestrationRecommendBodySchema = z.object({
  conversation_id: z.string().uuid(),
  user_message: z.string().min(1).max(32_000),
});

export const orchestrationExecuteBodySchema = z.object({
  conversation_id: z.string().uuid(),
  user_message: z.string().min(1).max(32_000),
  topology_source: z.enum(["dynamic", "package"]).default("dynamic"),
  steps: z.array(topologyStepSpecSchema).min(1).max(12),
  idempotency_key: z.string().min(1).max(256).optional(),
  step_timeout_ms: z.number().int().min(1000).max(600_000).optional(),
  /** B 类：标准 5 段 cron；若设置则 Run 以 `scheduled` 创建，由调度器触发执行 */
  schedule_cron: z.string().min(1).max(256).optional(),
});

export const orchestrationCancelBodySchema = z.object({
  actor_id: z.string().min(1),
});

export const orchestrationRetryBodySchema = z.object({
  actor_id: z.string().min(1),
});

export const orchestrationResumeBodySchema = z.object({
  actor_id: z.string().min(1),
  action: z.enum(["retry_after_timeout", "abandon_run"]),
});

/** B 类定时：暂停 / 恢复下一轮调度（仅 `schedule_paused` ↔ `scheduled`） */
export const orchestrationScheduledPatchBodySchema = z.object({
  action: z.enum(["pause", "resume"]),
});
