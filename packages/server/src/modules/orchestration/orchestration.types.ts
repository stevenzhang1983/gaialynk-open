export type TopologySource = "dynamic" | "package";

export type OrchestrationRunStatus =
  | "scheduled"
  | "schedule_paused"
  | "running"
  | "awaiting_human_review"
  | "awaiting_user"
  | "paused_timeout"
  | "lease_expired"
  | "completed"
  | "failed"
  | "partial_completed"
  | "canceled";

export type OrchestrationStepStatus =
  | "pending"
  | "running"
  | "completed"
  | "completed_with_warnings"
  | "failed"
  | "awaiting_user"
  | "awaiting_human_review"
  | "lease_expired";

export interface TopologyStepSpec {
  agent_id: string;
  capability_name?: string;
  expected_input: { template: string; description?: string };
  expected_output: { required_fields: string[] };
  /** D-ORC-2 legacy: maps placeholder names → dot paths in prior step output_json */
  field_mapping?: Record<string, string>;
  /** E-14: same as field_mapping; persisted on orchestration_steps.input_mapping */
  input_mapping?: Record<string, string>;
  /** E-14: optional JSON Schema subset for soft validation → completed_with_warnings */
  output_schema?: Record<string, unknown>;
}

export interface OrchestrationRun {
  id: string;
  conversation_id: string;
  user_id: string;
  topology_source: TopologySource;
  steps_json: TopologyStepSpec[];
  current_step: number;
  status: OrchestrationRunStatus;
  user_message: string;
  idempotency_key: string | null;
  step_timeout_ms: number;
  cancel_requested: boolean;
  paused_reason: string | null;
  created_at: string;
  updated_at: string;
  finished_at: string | null;
  schedule_cron: string | null;
  next_run_at: string | null;
}

export interface OrchestrationStepRow {
  id: string;
  run_id: string;
  step_index: number;
  agent_id: string;
  status: OrchestrationStepStatus;
  input_json: Record<string, unknown> | null;
  output_json: Record<string, unknown> | null;
  run_id_per_step: string;
  started_at: string | null;
  finished_at: string | null;
  pending_invocation_id: string | null;
  error_message: string | null;
  output_schema: Record<string, unknown> | null;
  input_mapping: Record<string, unknown> | null;
  output_snapshot: Record<string, unknown> | null;
  lease_expires_at: string | null;
}
