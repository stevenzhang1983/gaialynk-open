import { randomUUID } from "node:crypto";
import { isPostgresEnabled, query } from "../../infra/db/client";
import type { Agent } from "../directory/agent.store";
import { requestAgent } from "../gateway/a2a.gateway";

export type RoutingMode = "auto" | "manual" | "constrained_auto";

export interface AskRequestInput {
  text: string;
  attachments?: Array<{ name: string; url: string }>;
  target_format?: "markdown" | "json" | "text";
  deadline_sec?: number;
  budget_tokens?: number;
  routing_mode?: RoutingMode;
  manual_agent_ids?: string[];
  blocked_agent_categories?: string[];
  blocked_agent_ids?: string[];
}

type FallbackAction = "initial" | "retry" | "alternative" | "degraded";

interface AskRun {
  id: string;
  action: FallbackAction;
  selected_agent_ids: string[];
  summary: string;
  evidence: string[];
  cost_estimate_tokens: number;
  duration_ms: number;
  created_at: string;
  timeline: Array<{ step: string; status: "ok" | "error"; detail: string }>;
}

export interface AskSession {
  id: string;
  request: AskRequestInput;
  route: {
    selected_agent_ids: string[];
    reason: string;
    route_reason_codes: string[];
    route_candidates: string[];
  };
  created_at: string;
  runs: AskRun[];
}

const sessions = new Map<string, AskSession>();

const nowIso = (): string => new Date().toISOString();

type RouteJson = {
  selected_agent_ids: string[];
  reason: string;
  route_reason_codes?: string[];
  route_candidates?: string[];
};

type AskSessionRow = {
  id: string;
  request_json: AskRequestInput | string;
  route_json: RouteJson | string;
  created_at: string;
};

type AskRunRow = {
  id: string;
  ask_id: string;
  action: FallbackAction;
  selected_agent_ids: string[] | string;
  summary: string;
  evidence: string[] | string;
  cost_estimate_tokens: number;
  duration_ms: number;
  timeline: Array<{ step: string; status: "ok" | "error"; detail: string }> | string;
  created_at: string;
};

const parseJsonField = <T>(value: T | string): T =>
  (typeof value === "string" ? (JSON.parse(value) as T) : value);

const fromAskRunRow = (row: AskRunRow): AskRun => ({
  id: row.id,
  action: row.action,
  selected_agent_ids: parseJsonField<string[]>(row.selected_agent_ids),
  summary: row.summary,
  evidence: parseJsonField<string[]>(row.evidence),
  cost_estimate_tokens: row.cost_estimate_tokens,
  duration_ms: row.duration_ms,
  timeline: parseJsonField<Array<{ step: string; status: "ok" | "error"; detail: string }>>(row.timeline),
  created_at: row.created_at,
});

const scoreAgentForAsk = (agent: Agent, text: string): number => {
  const query = text.toLowerCase();
  let score = 0;
  if (agent.name.toLowerCase().includes(query)) {
    score += 3;
  }
  if (agent.description.toLowerCase().includes(query)) {
    score += 2;
  }
  for (const capability of agent.capabilities) {
    if (capability.name.toLowerCase().includes(query)) {
      score += 4;
    }
  }
  return score;
};

const selectAgents = (agents: Agent[], text: string): Agent[] =>
  [...agents]
    .sort((a, b) => scoreAgentForAsk(b, text) - scoreAgentForAsk(a, text))
    .slice(0, Math.min(2, agents.length));

export class AskRoutingError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AskRoutingError";
  }
}

function resolveRouting(
  input: AskRequestInput,
  availableAgents: Agent[],
): { selectedAgents: Agent[]; reason: string; route_reason_codes: string[]; route_candidates: string[] } {
  const mode = input.routing_mode ?? "auto";
  const blockedIds = new Set(input.blocked_agent_ids ?? []);
  const blockedCategories = new Set(input.blocked_agent_categories ?? []);

  if (mode === "manual") {
    const manualIds = input.manual_agent_ids ?? [];
    if (manualIds.length === 0) {
      throw new AskRoutingError(
        "ask_manual_routing_empty",
        "manual routing requires at least one manual_agent_id",
      );
    }
    const selectedAgents: Agent[] = [];
    for (const id of manualIds) {
      const agent = availableAgents.find((a) => a.id === id);
      if (!agent) {
        throw new AskRoutingError(
          "ask_manual_routing_agent_not_found",
          `Agent not found or not available: ${id}`,
          { agent_id: id },
        );
      }
      selectedAgents.push(agent);
    }
    return {
      selectedAgents,
      reason: "manual_selection",
      route_reason_codes: ["manual"],
      route_candidates: selectedAgents.map((a) => a.id),
    };
  }

  let pool = availableAgents;
  const reasonCodes: string[] = [];

  if (mode === "constrained_auto") {
    reasonCodes.push("constrained_auto");
    pool = pool.filter((a) => {
      if (blockedIds.has(a.id)) return false;
      if (blockedCategories.has(a.agent_type)) return false;
      return true;
    });
  } else {
    reasonCodes.push("auto");
  }

  const selectedAgents = selectAgents(pool, input.text);
  const candidateIds = [...pool]
    .sort((a, b) => scoreAgentForAsk(b, input.text) - scoreAgentForAsk(a, input.text))
    .slice(0, Math.min(5, pool.length))
    .map((a) => a.id);
  return {
    selectedAgents,
    reason: mode === "constrained_auto" ? "capability_match_constrained" : "capability_and_semantic_match",
    route_reason_codes: reasonCodes,
    route_candidates: candidateIds,
  };
}

const getAlternativeAgent = (agents: Agent[], excluded: string[]): Agent | null => {
  for (const agent of agents) {
    if (!excluded.includes(agent.id)) {
      return agent;
    }
  }
  return null;
};

const executeRunAsync = async (
  session: AskSession,
  action: FallbackAction,
  selectedAgents: Agent[],
): Promise<AskRun> => {
  if (action === "degraded") {
    return {
      id: randomUUID(),
      action,
      selected_agent_ids: [],
      summary: "degraded result: produced from lightweight fallback mode",
      evidence: ["degraded_mode"],
      cost_estimate_tokens: 80,
      duration_ms: 5,
      created_at: nowIso(),
      timeline: [{ step: "fallback.degraded", status: "ok", detail: "Generated degraded summary" }],
    };
  }

  const timeline: Array<{ step: string; status: "ok" | "error"; detail: string }> = [];
  const startAt = Date.now();
  for (const agent of selectedAgents) {
    try {
      const response = await requestAgent({
        conversationId: `ask-${session.id}`,
        agent,
        userText: session.request.text,
      });
      const durationMs = Date.now() - startAt;
      timeline.push({ step: `invoke.${agent.id}`, status: "ok", detail: "agent completed" });
      return {
        id: randomUUID(),
        action,
        selected_agent_ids: selectedAgents.map((item) => item.id),
        summary: response.text,
        evidence: [`agent:${agent.id}`],
        cost_estimate_tokens: Math.max(120, session.request.text.length * 2),
        duration_ms: durationMs,
        created_at: nowIso(),
        timeline,
      };
    } catch (error) {
      timeline.push({
        step: `invoke.${agent.id}`,
        status: "error",
        detail: error instanceof Error ? error.message : "unknown_error",
      });
    }
  }

  return {
    id: randomUUID(),
    action,
    selected_agent_ids: selectedAgents.map((item) => item.id),
    summary: "degraded result: all selected agents failed",
    evidence: ["all_agents_failed"],
    cost_estimate_tokens: 60,
    duration_ms: Date.now() - startAt,
    created_at: nowIso(),
    timeline,
  };
};

const saveAskSessionAsync = async (session: AskSession): Promise<void> => {
  if (!isPostgresEnabled()) {
    sessions.set(session.id, session);
    return;
  }
  await query(
    `INSERT INTO ask_sessions (id, request_json, route_json, created_at)
     VALUES ($1, $2::jsonb, $3::jsonb, $4)`,
    [session.id, JSON.stringify(session.request), JSON.stringify(session.route), session.created_at],
  );
};

const saveAskRunAsync = async (askId: string, run: AskRun): Promise<void> => {
  if (!isPostgresEnabled()) {
    return;
  }
  await query(
    `INSERT INTO ask_runs
     (id, ask_id, action, selected_agent_ids, summary, evidence, cost_estimate_tokens, duration_ms, timeline, created_at)
     VALUES ($1, $2, $3, $4::jsonb, $5, $6::jsonb, $7, $8, $9::jsonb, $10)`,
    [
      run.id,
      askId,
      run.action,
      JSON.stringify(run.selected_agent_ids),
      run.summary,
      JSON.stringify(run.evidence),
      run.cost_estimate_tokens,
      run.duration_ms,
      JSON.stringify(run.timeline),
      run.created_at,
    ],
  );
};

export const createAskSessionAsync = async (
  input: AskRequestInput,
  availableAgents: Agent[],
): Promise<AskSession> => {
  const { selectedAgents, reason, route_reason_codes, route_candidates } = resolveRouting(
    input,
    availableAgents,
  );
  const session: AskSession = {
    id: randomUUID(),
    request: input,
    route: {
      selected_agent_ids: selectedAgents.map((agent) => agent.id),
      reason,
      route_reason_codes,
      route_candidates,
    },
    created_at: nowIso(),
    runs: [],
  };
  const firstRun = await executeRunAsync(session, "initial", selectedAgents);
  session.runs.push(firstRun);
  await saveAskSessionAsync(session);
  await saveAskRunAsync(session.id, firstRun);
  if (!isPostgresEnabled()) {
    sessions.set(session.id, session);
  }
  return session;
};

export const getAskRunByIdAsync = async (
  runId: string,
): Promise<{ askId: string; run: AskRun } | null> => {
  if (!isPostgresEnabled()) {
    for (const [askId, session] of sessions) {
      const run = session.runs.find((r) => r.id === runId);
      if (run) return { askId, run };
    }
    return null;
  }
  const runRows = await query<AskRunRow & { ask_id: string }>(
    `SELECT id, ask_id, action, selected_agent_ids, summary, evidence, cost_estimate_tokens, duration_ms, timeline, created_at::text
     FROM ask_runs
     WHERE id = $1`,
    [runId],
  );
  const row = runRows[0];
  if (!row) return null;
  return {
    askId: row.ask_id,
    run: fromAskRunRow(row),
  };
};

export const getAskSessionAsync = async (askId: string): Promise<AskSession | null> => {
  if (!isPostgresEnabled()) {
    return sessions.get(askId) ?? null;
  }
  const sessionRows = await query<AskSessionRow>(
    `SELECT id, request_json, route_json, created_at::text
     FROM ask_sessions
     WHERE id = $1`,
    [askId],
  );
  const sessionRow = sessionRows[0];
  if (!sessionRow) {
    return null;
  }
  const runRows = await query<AskRunRow>(
    `SELECT id, ask_id, action, selected_agent_ids, summary, evidence, cost_estimate_tokens, duration_ms, timeline, created_at::text
     FROM ask_runs
     WHERE ask_id = $1
     ORDER BY created_at ASC`,
    [askId],
  );
  const route = parseJsonField<RouteJson>(sessionRow.route_json);
  const routeWithDefaults = {
    ...route,
    route_reason_codes: route.route_reason_codes ?? [],
    route_candidates: route.route_candidates ?? route.selected_agent_ids ?? [],
  };
  return {
    id: sessionRow.id,
    request: parseJsonField<AskRequestInput>(sessionRow.request_json),
    route: routeWithDefaults,
    created_at: sessionRow.created_at,
    runs: runRows.map(fromAskRunRow),
  };
};

export const runAskFallbackAsync = async (
  askId: string,
  action: Exclude<FallbackAction, "initial">,
  availableAgents: Agent[],
): Promise<AskRun | null> => {
  const session = await getAskSessionAsync(askId);
  if (!session) {
    return null;
  }
  const latest = session.runs[session.runs.length - 1];
  let selectedAgents: Agent[] = availableAgents.filter((agent) =>
    session.route.selected_agent_ids.includes(agent.id),
  );

  if (action === "alternative") {
    const alternative = getAlternativeAgent(availableAgents, latest?.selected_agent_ids ?? []);
    selectedAgents = alternative ? [alternative] : selectedAgents;
  }

  const run = await executeRunAsync(session, action, selectedAgents);
  await saveAskRunAsync(askId, run);
  if (!isPostgresEnabled()) {
    session.runs.push(run);
    sessions.set(askId, session);
  }
  return run;
};

export interface AskVisualizationResult {
  level: "l1" | "l2";
  route_summary: string;
  path_summary: string;
  risk_hints: string[];
  key_evidence_refs: string[];
  rerun_token: string;
  timeline?: Array<{ step: string; status: "ok" | "error"; detail: string }>;
}

export const buildAskVisualization = (
  session: AskSession,
  level: "l1" | "l2",
): AskVisualizationResult => {
  const latest = session.runs[session.runs.length - 1];
  const routeSummary = `Selected ${session.route.selected_agent_ids.length} agent(s), last action=${latest?.action ?? "none"}`;
  const pathSummary = `Ask ${session.id}: ${session.runs.length} run(s), route=${session.route.reason}`;
  const riskHints: string[] = latest?.evidence?.includes("degraded_mode")
    ? ["degraded_fallback_used"]
    : [];
  const keyEvidenceRefs = latest?.evidence ?? [];
  const base = {
    level,
    route_summary: routeSummary,
    path_summary: pathSummary,
    risk_hints: riskHints,
    key_evidence_refs: keyEvidenceRefs,
    rerun_token: session.id,
  };
  if (level === "l1") {
    return base;
  }
  return {
    ...base,
    timeline: latest?.timeline ?? [],
  };
};

export const rerunAskAsync = async (
  askId: string,
  availableAgents: Agent[],
): Promise<AskRun | null> => {
  const session = await getAskSessionAsync(askId);
  if (!session) return null;
  const selectedAgents = availableAgents.filter((a) =>
    session.route.selected_agent_ids.includes(a.id),
  );
  if (selectedAgents.length === 0) return null;
  const run = await executeRunAsync(session, "initial", selectedAgents);
  session.runs.push(run);
  await saveAskRunAsync(askId, run);
  if (!isPostgresEnabled()) {
    sessions.set(askId, session);
  }
  return run;
};

export const resetAskStore = (): void => {
  if (isPostgresEnabled()) {
    return;
  }
  sessions.clear();
};
