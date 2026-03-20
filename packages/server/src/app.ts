import { randomUUID } from "node:crypto";
import { Hono } from "hono";
import { z } from "zod";
import {
  addParticipantAsync,
  appendMessageAsync,
  createConversationAsync,
  deleteConversationAsync,
  getConversationDetailAsync,
  listConversations,
  listMessagesAsync,
  type ListConversationsResult,
  type Message,
  resetConversationStore,
} from "./modules/conversation/conversation.store";
import { publish as publishMessageStream, subscribe as subscribeMessageStream } from "./modules/conversation/message-stream";
import {
  createDelegationTicketAsync,
  getDelegationTicketByIdAsync,
  revokeDelegationTicketAsync,
} from "./modules/delegations/delegation-ticket.store";
import {
  interruptT5DelegationAsync,
  recordT5PhaseSummaryAsync,
} from "./modules/delegations/t5-summary.service";
import {
  createInvitationAsync,
  getInvitationAsync,
  listInvitationsByConversationAsync,
  markInvitationAcceptedAsync,
  resetInvitationStore,
} from "./modules/conversation/invitation.store";
import type { Agent } from "./modules/directory/agent.store";
import {
  getAgentDetailEnrichedAsync,
  getAgentStatsAsync,
} from "./modules/directory/agent-directory.service";
import {
  getAgentByIdAsync,
  listAgentsAsync,
  registerAgentAsync,
  resetAgentStore,
  type ListAgentsResult,
  upsertAgentFromNodeAsync,
} from "./modules/directory/agent.store";
import { requestAgent } from "./modules/gateway/a2a.gateway";
import {
  claimInvocationForProcessingAsync,
  createPendingInvocationAsync,
  getInvocationByIdAsync,
  listInvocationsAsync,
  markInvocationCompletedAsync,
  rollbackInvocationProcessingAsync,
  resetInvocationStore,
} from "./modules/gateway/invocation.store";
import {
  denyInvocationAsync,
  getDeniedDecisionAsync,
  resetReviewDecisionStore,
} from "./modules/gateway/review-decision.store";
import {
  approvalConfirmSchema,
  approvalRejectSchema,
} from "./modules/approvals/approval.schema";
import {
  listApprovalsAsync,
  getApprovalDetailAsync,
  getApprovalChainAsync,
} from "./modules/approvals/approval.service";
import {
  emitAuditEventAsync,
  getAuditEventByIdAsync,
  listAuditEventsAsync,
  resetAuditStore,
} from "./modules/audit/audit.store";
import {
  getReceiptByIdAsync,
  issueReceiptAsync,
  resetReceiptStore,
  verifyReceiptAsync,
} from "./modules/audit/receipt.store";
import { getPhase0Metrics } from "./modules/metrics/metrics.service";
import {
  getDeploymentByIdAsync,
  getDeployTemplateByIdAsync,
  instantiateTemplateAsync,
  listDeployTemplatesAsync,
  markDeploymentReadyAsync,
  resetDeployTemplateStore,
} from "./modules/deploy/template.store";
import {
  addQualityEvaluationAsync,
  applyTemplateGovernanceDecisionAsync,
  createListingApplicationAsync,
  createPublicAgentTemplateAsync,
  decideListingApplicationAsync,
  evaluateTemplateGovernance,
  getPublicAgentTemplateByIdAsync,
  getLatestListingApplicationByTemplateAsync,
  getQualityWindowSummaryAsync,
  listTemplateIdsByPublisherAsync,
  listFailureSemantics,
  listPublicAgentTemplatesAsync,
  resetPublicTemplateStore,
  runPreflightChecks,
} from "./modules/supply/public-template.store";
import {
  createPublisherAsync,
  getPublisherAsync,
  updatePublisherTierAsync,
} from "./modules/supply/publisher.store";
import {
  getAgentFeedbackSummaryAsync,
  submitAgentRunFeedbackAsync,
} from "./modules/feedback/agent-run-feedback.store";
import {
  getNotificationPreferencesAsync,
  listNotificationEventsAsync,
  recordNotificationEventAsync,
  setNotificationPreferencesAsync,
} from "./modules/notifications/notification.store";
import {
  AskRoutingError,
  buildAskVisualization,
  createAskSessionAsync,
  getAskSessionAsync,
  resetAskStore,
  rerunAskAsync,
  runAskFallbackAsync,
} from "./modules/ask/ask.store";
import {
  cancelQueuedRunAsync,
  cloudDegradeQueuedRunAsync,
  enqueueOfflineRunAsync,
  getOfflineQueueItemAsync,
  listOfflineQueueByUserAsync,
} from "./modules/tasks/offline-queue.store";
import {
  appendUserTaskRunAsync,
  createUserTaskInstanceAsync,
  getUserTaskInstanceByIdAsync,
  listUserTaskInstancesAsync,
  listUserTaskRunsAsync,
  resetUserTaskStore,
  updateUserTaskInstanceParamsAsync,
  updateUserTaskStatusAsync,
} from "./modules/tasks/user-task.store";
import {
  arbitrateDisputeAsync,
  createDisputeAsync,
  getDisputeByIdAsync,
  resetDisputeStore,
} from "./modules/disputes/dispute.store";
import {
  createConnectorAuthorizationAsync,
  executeLocalActionAsync,
  getConnectorAuthorizationByIdAsync,
  getLocalActionReceiptByIdAsync,
  listConnectorAuthorizationsByUserIdAsync,
  resetConnectorStore,
  revokeConnectorAuthorizationAsync,
  revokeConnectorAuthorizationsByDeviceAsync,
} from "./modules/connectors/connector.store";
import {
  getA2AVisualizationDataVersion,
  getA2AVisualizationL1,
  getA2AVisualizationL2Page,
  getA2AVisualizationL3Export,
  getA2AVisualizationL3Page,
  type VisualizationMode,
} from "./modules/visualization/a2a-visualization.service";
import {
  heartbeatNodeAsync,
  getNodeByNodeIdAsync,
  listNodesAsync,
  registerNodeAsync,
  resetNodeStore,
} from "./modules/node-hub/node.store";
import {
  consumeQuotaAsync,
  getQuotaStatusAsync,
  resetQuotaStore,
} from "./modules/usage/quota.store";
import { evaluateTrustDecision } from "./modules/trust/trust.engine";
import { evaluateDataBoundaryPolicy } from "./modules/trust/data-boundary.policy";
import {
  getRiskDisclaimerForCategory,
  REASON_CODE_NOT_FOR_RETRAINING_BOUNDARY,
} from "./modules/trust/sensitive-domain.policy";
import {
  ACTOR_CONTEXT_KEY,
  parseActorFromHeaders,
  type ActorContext,
} from "./infra/identity/actor-context";
import { registerAuthRoutes } from "./modules/auth/auth.routes";
import { resetAuthStore } from "./modules/auth/user.store";
import { registerAgentProviderRoutes } from "./modules/directory/agent-provider.routes";

const conversationTopologyEnum = z.enum(["T1", "T2", "T3", "T4", "T5"]);
const authorizationModeEnum = z.enum(["user_explicit", "policy_based", "delegated"]);
const visibilityModeEnum = z.enum(["full", "summarized", "restricted"]);
const riskLevelEnum = z.enum(["low", "medium", "high", "critical"]);

const createConversationSchema = z.object({
  title: z.string().min(1).max(255),
  conversation_topology: conversationTopologyEnum.optional(),
  authorization_mode: authorizationModeEnum.optional(),
  visibility_mode: visibilityModeEnum.optional(),
  risk_level: riskLevelEnum.optional(),
});

const registerAgentSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(1),
  agent_type: z.enum(["logical", "execution"]),
  source_url: z.url(),
  capabilities: z.array(
    z.object({
      name: z.string().min(1),
      risk_level: z.enum(["low", "medium", "high", "critical"]),
    }),
  ),
  source_origin: z.enum(["official", "self_hosted", "connected_node", "vendor"]).optional(),
  node_id: z.string().uuid().optional(),
  status: z.enum(["active", "deprecated", "pending_review"]).optional(),
});

const joinAgentSchema = z.object({
  agent_id: z.string().min(1),
});

const sendMessageSchema = z.object({
  sender_id: z.string().min(1),
  text: z.string().min(1),
  thread_id: z.string().min(1).max(128).optional(),
  mentions: z.array(z.string().min(1)).max(20).optional(),
  target_agent_ids: z.array(z.string().min(1)).optional(),
  delegation_ticket_id: z.string().uuid().optional(),
});

const confirmInvocationSchema = z.object({
  approver_id: z.string().min(1),
});

const createInvitationSchema = z.object({
  inviter_id: z.string().min(1),
  invitee_type: z.enum(["user", "agent"]),
  invitee_id: z.string().min(1),
  role: z.enum(["member", "admin", "readonly"]).default("member"),
  message: z.string().min(1).max(280).optional(),
});

const acceptInvitationSchema = z.object({
  actor_id: z.string().min(1),
});

const reviewQueueApproveSchema = z.object({
  approver_id: z.string().min(1),
});

const reviewQueueDenySchema = z.object({
  approver_id: z.string().min(1),
  reason: z.string().min(1).max(280).optional(),
});

const reviewQueueAskMoreInfoSchema = z.object({
  approver_id: z.string().min(1),
  question: z.string().min(1).max(500),
});

const reviewQueueDelegateSchema = z.object({
  approver_id: z.string().min(1),
  delegate_to: z.string().min(1),
});

const instantiateTemplateSchema = z.object({
  actor_id: z.string().min(1),
  agent_name: z.string().min(1).max(120),
});

const usageLimitsQuerySchema = z.object({
  actor_id: z.string().min(1),
  feature: z.string().min(1),
});

const activateDeploymentSchema = z.object({
  actor_id: z.string().min(1),
});

const nodeConnectionWizardValidateSchema = z.object({
  endpoint: z.url(),
  node_protocol_version: z
    .string()
    .regex(/^\d+\.\d+\.\d+$/, "node_protocol_version must be semver-like x.y.z"),
});

const injectionAlertsQuerySchema = z.object({
  conversation_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

const registerNodeSchema = z.object({
  name: z.string().min(1).max(255),
  endpoint: z.url(),
  capabilities: z.record(z.string(), z.unknown()).optional(),
});

const heartbeatNodeSchema = z.object({
  node_id: z.string().min(1),
});

const relayInvokeSchema = z.object({
  node_id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  agent_id: z.string().uuid(),
  sender_id: z.string().min(1),
  text: z.string().min(1),
  thread_id: z.string().min(1).max(128).optional(),
  mentions: z.array(z.string().min(1)).max(20).optional(),
  retry_max: z.number().int().min(0).max(3).optional(),
  stale_after_sec: z.number().int().min(1).max(86400).optional(),
});

const recommendationQuerySchema = z.object({
  intent: z.string().min(1),
  risk_max: z.enum(["low", "medium", "high", "critical"]).optional(),
  limit: z.coerce.number().int().min(1).max(20).optional(),
});

const nodesHealthQuerySchema = z.object({
  stale_after_sec: z.coerce.number().int().min(1).max(86400).optional(),
});

const usageCountersQuerySchema = z.object({
  actor_id: z.string().min(1).optional(),
  window_days: z.coerce.number().int().min(1).max(365).optional(),
});

const taskBillingSummaryQuerySchema = z.object({
  actor_id: z.string().min(1),
  window_days: z.coerce.number().int().min(1).max(365).optional(),
});

const isActionWithinScope = (input: {
  action: string;
  scopeLevel: "directory" | "application" | "action";
  scopeValue: string;
}): boolean => {
  if (input.scopeLevel === "action") {
    return input.action === input.scopeValue;
  }
  if (input.scopeLevel === "application") {
    return input.action === input.scopeValue || input.action.startsWith(`${input.scopeValue}.`);
  }
  return input.action.startsWith(input.scopeValue);
};

const isActionForConnector = (input: { action: string; connector: string }): boolean =>
  input.action.startsWith(`${input.connector}.`);

const auditEventsQuerySchema = z.object({
  event_type: z.string().min(1).optional(),
  conversation_id: z.string().uuid().optional(),
  agent_id: z.string().uuid().optional(),
  actor_type: z.enum(["user", "agent", "system"]).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

const auditTimelineQuerySchema = z.object({
  conversation_id: z.string().uuid().optional(),
  agent_id: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  sort: z.enum(["created_at:asc", "created_at:desc"]).optional(),
});

const createPublicTemplateSchema = z.object({
  name: z.string().min(1).max(120),
  category: z.string().min(1).max(64),
  major_version: z.number().int().min(1).max(99),
  minor_version: z.number().int().min(0).max(99),
  source_url: z.url(),
  publisher_id: z.string().uuid().optional(),
});

const createPublisherSchema = z.object({
  identity_tier: z.enum(["anonymous", "verified", "certified"]),
});

const agentRunFeedbackSchema = z.object({
  ask_run_id: z.string().uuid(),
  agent_id: z.string().min(1),
  quality: z.number().min(1).max(5),
  speed: z.number().min(1).max(5),
  stability: z.number().min(1).max(5),
  meets_expectation: z.number().min(1).max(5),
});

const notificationPreferencesSchema = z.object({
  channels: z.array(z.enum(["in_app", "email"])).min(1).max(2).optional(),
  strategy: z.enum(["only_exceptions", "all_runs"]).optional(),
});

const preflightCheckSchema = z.object({
  connectivity_ok: z.boolean(),
  p95_latency_ms: z.number().int().min(1).max(60000),
  error_rate: z.number().min(0).max(1),
  rate_limit_ok: z.boolean(),
});

const qualityEvaluationSchema = z.object({
  samples: z
    .array(
      z.object({
        success: z.boolean(),
        timed_out: z.boolean(),
        complaint: z.boolean(),
        withdrawn: z.boolean(),
      }),
    )
    .min(10),
});

const qualityWindowQuerySchema = z.object({
  window_days: z.coerce.number().int().min(1).max(30).optional(),
});

const publisherMetricsQuerySchema = z.object({
  window_days: z.coerce.number().int().min(1).max(30).optional(),
});

const governanceEventsQuerySchema = z.object({
  window_days: z.coerce.number().int().min(1).max(30).optional(),
});

const publisherDashboardQuerySchema = z.object({
  window_days: z.coerce.number().int().min(1).max(30).optional(),
});

const patchPublisherSchema = z.object({
  identity_tier: z.enum(["anonymous", "verified", "certified"]),
});

const mainlineEvidenceQuerySchema = z.object({
  window_days: z.coerce.number().int().min(1).max(30).optional(),
});

const phaseBReportQuerySchema = z.object({
  window_days: z.coerce.number().int().min(1).max(30).optional(),
});

const phaseCReportQuerySchema = z.object({
  window_days: z.coerce.number().int().min(1).max(30).optional(),
});

const phaseDReportQuerySchema = z.object({
  window_days: z.coerce.number().int().min(1).max(30).optional(),
});

const a2aVisualizationQuerySchema = z.object({
  mode: z.enum(["mock", "real"]).optional(),
  window_days: z.coerce.number().int().min(1).max(30).optional(),
  replay_anchor_ts: z.string().min(1).optional(),
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const listingApplySchema = z.object({
  actor_id: z.string().min(1),
});

const listingDecisionSchema = z.object({
  reviewer_id: z.string().min(1),
  decision: z.enum(["approved", "rejected"]),
  note: z.string().min(1).max(500).optional(),
});

const publicEntryEventSchema = z.object({
  event_name: z.enum([
    "page_view",
    "cta_click",
    "docs_click",
    "demo_click",
    "waitlist_submit",
    "demo_submit",
    "lang_switch",
  ]),
  locale: z.enum(["en", "zh-Hant", "zh-Hans"]),
  page: z.string().min(1).max(128),
  referrer: z.string().min(1).max(512).optional(),
  timestamp: z.string().min(1).max(64).optional(),
  cta_id: z.string().min(1).max(128).optional(),
  source: z.string().max(256).optional(),
  device_type: z.enum(["mobile", "desktop"]).optional(),
});

const askRequestSchema = z.object({
  text: z.string().min(1),
  attachments: z.array(z.object({ name: z.string().min(1), url: z.url() })).optional(),
  target_format: z.enum(["markdown", "json", "text"]).optional(),
  deadline_sec: z.number().int().min(1).max(3600).optional(),
  budget_tokens: z.number().int().min(1).max(200000).optional(),
  routing_mode: z.enum(["auto", "manual", "constrained_auto"]).optional(),
  manual_agent_ids: z.array(z.string().min(1)).optional(),
  blocked_agent_categories: z.array(z.string().min(1)).optional(),
  blocked_agent_ids: z.array(z.string().min(1)).optional(),
  category: z.string().min(1).max(64).optional(),
  data_use_boundary: z.enum(["not_for_retraining"]).optional(),
  privacy_mode: z.boolean().optional(),
  age_category: z.enum(["minor", "adult"]).optional(),
});

const askVisualizationQuerySchema = z.object({
  level: z.enum(["l1", "l2"]).optional(),
});

const createUserTaskInstanceSchema = z.object({
  user_id: z.string().min(1),
  name: z.string().min(1).max(120),
  schedule_cron: z.string().min(1).max(120),
});

const runUserTaskSchema = z.object({
  actor_id: z.string().min(1),
});

const taskActorSchema = z.object({
  actor_id: z.string().min(1),
});

const patchUserTaskInstanceSchema = z.object({
  actor_id: z.string().min(1),
  name: z.string().min(1).max(120).optional(),
  schedule_cron: z.string().min(1).max(120).optional(),
});

const taskExportQuerySchema = z.object({
  format: z.enum(["json", "csv"]),
  actor_id: z.string().min(1),
});

const listUserTaskInstancesQuerySchema = z.object({
  user_id: z.string().min(1),
  status: z.enum(["draft", "active", "paused", "archived"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const taskHistoryQuerySchema = z.object({
  actor_id: z.string().min(1),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const schedulerTickSchema = z.object({
  actor_id: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  retry_max: z.coerce.number().int().min(0).max(3).optional(),
  retry_backoff_base_ms: z.coerce.number().int().min(1).max(60000).optional(),
  selection_strategy: z.enum(["updated_at_desc", "updated_at_asc"]).optional(),
  simulate_failure_task_ids: z.array(z.string().min(1)).optional(),
});

const createDisputeSchema = z.object({
  task_instance_id: z.string().min(1),
  reporter_id: z.string().min(1),
  reason: z.string().min(1).max(500),
  evidence_refs: z.array(z.string().min(1)).min(1),
});

const arbitrateDisputeSchema = z.object({
  arbitrator_id: z.string().min(1),
  decision: z.enum(["accepted", "rejected"]),
  note: z.string().min(1).max(500),
});

const getDisputeQuerySchema = z.object({
  actor_id: z.string().min(1),
});

const getLocalActionReceiptQuerySchema = z.object({
  actor_id: z.string().min(1),
});

const createConnectorAuthorizationSchema = z.object({
  user_id: z.string().min(1),
  device_id: z.string().min(1).max(120).optional(),
  connector: z.string().min(1).max(64),
  scope_level: z.enum(["directory", "application", "action"]),
  scope_value: z.string().min(1).max(120),
  expires_in_sec: z.number().int().min(60).max(60 * 60 * 24 * 30),
});

const revokeConnectorAuthorizationSchema = z.object({
  actor_id: z.string().min(1),
});

const revokeByDeviceSchema = z.object({
  user_id: z.string().min(1),
  device_id: z.string().min(1).max(120),
  actor_id: z.string().min(1),
});

const listConnectorAuthorizationsQuerySchema = z.object({
  user_id: z.string().min(1),
  device_id: z.string().min(1).max(120).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const executeLocalActionSchema = z.object({
  authorization_id: z.string().min(1),
  action: z.string().min(1).max(120),
  risk_level: z.enum(["low", "medium", "high", "critical"]),
  confirmed: z.boolean().optional(),
  params_summary: z.record(z.string(), z.unknown()).optional(),
});

const toDecisionEventType = (
  decision: "allow" | "allow_limited" | "deny" | "need_confirmation",
): string => {
  if (decision === "allow") {
    return "invocation.allowed";
  }
  if (decision === "deny") {
    return "invocation.denied";
  }
  return "invocation.need_confirmation";
};

const riskRank = (risk: "low" | "medium" | "high" | "critical"): number => {
  if (risk === "low") return 0;
  if (risk === "medium") return 1;
  if (risk === "high") return 2;
  return 3;
};

const compareSemver = (left: string, right: string): number => {
  const leftParts = left.split(".").map((part) => Number(part));
  const rightParts = right.split(".").map((part) => Number(part));
  for (let index = 0; index < 3; index += 1) {
    const l = leftParts[index] ?? 0;
    const r = rightParts[index] ?? 0;
    if (l > r) {
      return 1;
    }
    if (l < r) {
      return -1;
    }
  }
  return 0;
};

const syncNodeDirectorySchema = z.object({
  node_id: z.string().uuid(),
  agents: z.array(
    z.object({
      name: z.string().min(1).max(255),
      description: z.string().min(1),
      agent_type: z.enum(["logical", "execution"]),
      source_url: z.url(),
      capabilities: z.array(
        z.object({
          name: z.string().min(1),
          risk_level: z.enum(["low", "medium", "high", "critical"]),
        }),
      ),
      status: z.enum(["active", "deprecated", "pending_review"]).optional(),
    }),
  ),
});

const resetAllStores = (): void => {
  resetConversationStore();
  resetInvitationStore();
  resetDeployTemplateStore();
  resetQuotaStore();
  resetAgentStore();
  resetInvocationStore();
  resetReviewDecisionStore();
  resetAuditStore();
  resetReceiptStore();
  resetNodeStore();
  resetPublicTemplateStore();
  resetAskStore();
  resetUserTaskStore();
  resetDisputeStore();
  resetConnectorStore();
  resetAuthStore();
};

const escapeCsv = (value: string): string => {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

const isDelegationTicketExpired = (expiresAt: string): boolean => {
  const expiresAtMs = Date.parse(expiresAt);
  return Number.isFinite(expiresAtMs) && expiresAtMs <= Date.now();
};

const isConversationScopeAllowed = (scopeObjects: string[], conversationId: string): boolean => {
  if (scopeObjects.length === 0) {
    return true;
  }
  return scopeObjects.includes("*") || scopeObjects.includes(conversationId) || scopeObjects.includes(`conversation:${conversationId}`);
};

const isAgentScopeAllowed = (scopeObjects: string[], agentId: string): boolean => {
  const scopedAgentIds = scopeObjects
    .filter((value) => value.startsWith("agent:"))
    .map((value) => value.slice("agent:".length));
  if (scopedAgentIds.length === 0) {
    return true;
  }
  return scopedAgentIds.includes(agentId);
};

const isCapabilityScopeAllowed = (scopeCapabilities: string[], capabilityName?: string): boolean => {
  if (scopeCapabilities.length === 0) {
    return true;
  }
  if (scopeCapabilities.includes("*")) {
    return true;
  }
  if (!capabilityName) {
    return false;
  }
  return scopeCapabilities.includes(capabilityName);
};

const isDataDomainScopeAllowed = (scopeDataDomain: string, visibilityMode: "full" | "summarized" | "restricted"): boolean => {
  const normalized = scopeDataDomain.trim().toLowerCase();
  if (normalized === "" || normalized === "*" || normalized === "all" || normalized === "any") {
    return true;
  }
  const conversationDomain = visibilityMode === "restricted" ? "restricted" : "internal";
  return normalized === conversationDomain;
};

/** Unified 403 response (Launch Closure 1.2). */
const forbiddenResponse = (
  c: { json: (body: unknown, status: number) => Response },
  message: string,
  details?: Record<string, unknown>,
) =>
  c.json(
    {
      error: {
        code: "forbidden",
        message,
        ...(details ? { details } : {}),
      },
    },
    403,
  );

type AppVariables = { actor?: ActorContext };

export const createApp = (): Hono<{ Variables: AppVariables }> => {
  resetAllStores();
  const app = new Hono<{ Variables: AppVariables }>();

  app.onError((error, c) => {
    if (error instanceof z.ZodError) {
      return c.json(
        {
          error: {
            code: "validation_error",
            message: "Invalid request payload",
            details: {
              issues: error.issues.map((issue) => ({
                path: issue.path.join("."),
                message: issue.message,
              })),
            },
          },
        },
        400,
      );
    }

    return c.json(
      {
        error: {
          code: "internal_error",
          message: "Internal server error",
        },
      },
      500,
    );
  });

  // 1.1 Unified identity: parse actor from headers; body/query actor_id is deprecated (see delegation routes).
  app.use("/api/*", async (c, next) => {
    const actor = parseActorFromHeaders(c.req.raw.headers);
    c.set(ACTOR_CONTEXT_KEY, actor ?? undefined);
    await next();
  });

  // 2.2 Health check for app and critical dependencies (Launch Closure 2.2).
  app.get("/api/v1/health", async (c) => {
    const checks: Record<string, { status: string; detail?: string }> = {};
    try {
      if (process.env.DATABASE_URL) {
        const { getPool } = await import("./infra/db/client");
        const pool = getPool();
        if (pool) {
          await pool.query("SELECT 1");
          checks.database = { status: "up" };
        } else {
          checks.database = { status: "down", detail: "pool not initialized" };
        }
      } else {
        checks.database = { status: "skipped", detail: "DATABASE_URL not set" };
      }
    } catch (e) {
      checks.database = { status: "down", detail: e instanceof Error ? e.message : "unknown" };
    }
    const allUp = Object.values(checks).every((v) => v.status === "up" || v.status === "skipped");
    const status = allUp ? 200 : 503;
    return c.json(
      {
        data: {
          status: allUp ? "healthy" : "degraded",
          checks,
        },
      },
      status,
    );
  });

  // 2.1 Preflight: gate passes only when healthy (Launch Closure 2.1).
  app.get("/api/v1/preflight", async (c) => {
    const checks: Record<string, { status: string; detail?: string }> = {};
    try {
      if (process.env.DATABASE_URL) {
        const { getPool } = await import("./infra/db/client");
        const pool = getPool();
        if (pool) {
          await pool.query("SELECT 1");
          checks.database = { status: "up" };
        } else {
          checks.database = { status: "down", detail: "pool not initialized" };
        }
      } else {
        checks.database = { status: "skipped", detail: "DATABASE_URL not set" };
      }
    } catch (e) {
      checks.database = { status: "down", detail: e instanceof Error ? e.message : "unknown" };
    }
    const allUp = Object.values(checks).every((v) => v.status === "up" || v.status === "skipped");
    const status = allUp ? 200 : 503;
    return c.json(
      { data: { status: allUp ? "healthy" : "degraded", checks }, meta: { preflight: true } },
      status,
    );
  });

  // 1.1 Expose unified actor context for IA / gateway (Launch Closure 3.1).
  app.get("/api/v1/me", async (c) => {
    const actor = c.get(ACTOR_CONTEXT_KEY) as ActorContext | undefined;
    if (!actor?.fromTrustedSource) {
      return c.json(
        { error: { code: "actor_required", message: "X-Actor-Id header required for identity context" } },
        401,
      );
    }
    return c.json({
      data: {
        actor: {
          id: actor.id,
          role: actor.role,
          scopes: actor.scopes,
        },
      },
    }, 200);
  });

  app.post("/api/v1/conversations", async (c) => {
    const payload = createConversationSchema.parse(await c.req.json());
    const conversation = await createConversationAsync({
      title: payload.title,
      conversation_topology: payload.conversation_topology,
      authorization_mode: payload.authorization_mode,
      visibility_mode: payload.visibility_mode,
      risk_level: payload.risk_level,
    });

    return c.json({ data: conversation }, 201);
  });

  app.get("/api/v1/conversations", async (c) => {
    const cursor = c.req.query("cursor") ?? undefined;
    const limitRaw = c.req.query("limit");
    const limit = limitRaw != null ? parseInt(limitRaw, 10) : undefined;
    const sort = (c.req.query("sort") as "created_at:desc" | "created_at:asc") ?? undefined;
    const opts =
      cursor !== undefined || limit !== undefined || sort !== undefined
        ? { cursor, limit: limit !== undefined && Number.isFinite(limit) ? limit : undefined, sort }
        : undefined;
    const result = await listConversations(opts);
    if (Array.isArray(result)) {
      return c.json({ data: result }, 200);
    }
    const meta = (result as ListConversationsResult).next_cursor
      ? { next_cursor: (result as ListConversationsResult).next_cursor }
      : undefined;
    return c.json({ data: (result as ListConversationsResult).data, meta }, 200);
  });

  app.get("/api/v1/conversations/:id", async (c) => {
    const conversationId = c.req.param("id");
    const detail = await getConversationDetailAsync(conversationId);

    if (!detail) {
      return c.json({ error: { code: "conversation_not_found", message: "Conversation not found" } }, 404);
    }

    return c.json({ data: detail }, 200);
  });

  app.delete("/api/v1/conversations/:id", async (c) => {
    const conversationId = c.req.param("id");
    const deleted = await deleteConversationAsync(conversationId);
    if (!deleted) {
      return c.json({ error: { code: "conversation_not_found", message: "Conversation not found" } }, 404);
    }
    return c.json({ data: { id: conversationId, deleted: true } }, 200);
  });

  app.get("/api/v1/conversations/:id/messages", async (c) => {
    const conversationId = c.req.param("id");
    const cursor = c.req.query("cursor") ?? undefined;
    const limitRaw = c.req.query("limit");
    const limit = limitRaw != null ? parseInt(limitRaw, 10) : undefined;
    const sort = (c.req.query("sort") as "created_at:desc" | "created_at:asc") ?? undefined;
    const opts =
      cursor !== undefined || limit !== undefined || sort !== undefined
        ? { cursor, limit: limit !== undefined && Number.isFinite(limit) ? limit : undefined, sort }
        : undefined;
    const result = await listMessagesAsync(conversationId, opts);
    if (result === null) {
      return c.json({ error: { code: "conversation_not_found", message: "Conversation not found" } }, 404);
    }
    const meta = result.next_cursor ? { next_cursor: result.next_cursor } : undefined;
    return c.json({ data: result.data, meta }, 200);
  });

  app.get("/api/v1/conversations/:id/messages/stream", async (c) => {
    const conversationId = c.req.param("id");
    const detail = await getConversationDetailAsync(conversationId);
    if (!detail) {
      return c.json({ error: { code: "conversation_not_found", message: "Conversation not found" } }, 404);
    }
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        const send = (event: string, data: string) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${data}\n\n`));
        };
        const unsubscribe = subscribeMessageStream(conversationId, (message) => {
          send("message", JSON.stringify(message));
        });
        c.req.raw.signal?.addEventListener?.("abort", () => {
          unsubscribe();
          controller.close();
        });
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  });

  app.get("/api/v1/conversations/:id/presence", async (c) => {
    const conversationId = c.req.param("id");
    const detail = await getConversationDetailAsync(conversationId);
    if (!detail) {
      return c.json({ error: { code: "conversation_not_found", message: "Conversation not found" } }, 404);
    }

    const items = [];
    for (const participant of detail.participants) {
      if (participant.participant_type === "user") {
        items.push({
          participant_id: participant.participant_id,
          participant_type: "user",
          status: "online",
          last_seen_at: participant.joined_at,
        });
        continue;
      }

      const agent = await getAgentByIdAsync(participant.participant_id);
      if (!agent) {
        items.push({
          participant_id: participant.participant_id,
          participant_type: "agent",
          status: "offline",
          last_seen_at: participant.joined_at,
        });
        continue;
      }

      if (agent.source_origin === "connected_node" && agent.node_id) {
        const node = await getNodeByNodeIdAsync(agent.node_id);
        items.push({
          participant_id: participant.participant_id,
          participant_type: "agent",
          status: node?.status ?? "offline",
          source_origin: agent.source_origin,
          node_id: agent.node_id,
          last_seen_at: node?.last_heartbeat ?? participant.joined_at,
        });
        continue;
      }

      items.push({
        participant_id: participant.participant_id,
        participant_type: "agent",
        status: "online",
        source_origin: agent.source_origin ?? "official",
        last_seen_at: participant.joined_at,
      });
    }

    return c.json({ data: { conversation_id: conversationId, participants: items } }, 200);
  });

  const createDelegationTicketSchema = z.object({
    actor_id: z.string().min(1),
    granter_id: z.string().min(1),
    grantee_id: z.string().min(1),
    scope_capabilities: z.array(z.string()).optional(),
    scope_objects: z.array(z.string()).optional(),
    scope_data_domain: z.string().optional(),
    expires_at: z.string().datetime(),
  });

  app.post("/api/v1/delegations/tickets", async (c) => {
    const payload = createDelegationTicketSchema.parse(await c.req.json());
    const trustedActor = c.get(ACTOR_CONTEXT_KEY) as ActorContext | undefined;
    if (trustedActor?.fromTrustedSource && trustedActor.id !== payload.actor_id) {
      return forbiddenResponse(c, "Authenticated actor does not match actor_id.");
    }
    if (payload.actor_id !== payload.granter_id) {
      return c.json(
        { error: { code: "forbidden", message: "actor_id must match granter_id when creating ticket" } },
        403,
      );
    }
    const ticket = await createDelegationTicketAsync({
      granter_id: payload.granter_id,
      grantee_id: payload.grantee_id,
      scope_capabilities: payload.scope_capabilities,
      scope_objects: payload.scope_objects,
      scope_data_domain: payload.scope_data_domain,
      expires_at: payload.expires_at,
    });
    return c.json({ data: ticket }, 201);
  });

  app.get("/api/v1/delegations/tickets/:id", async (c) => {
    const id = c.req.param("id");
    const trustedActor = c.get(ACTOR_CONTEXT_KEY) as ActorContext | undefined;
    let actorId = trustedActor?.fromTrustedSource ? trustedActor.id : undefined;
    if (!actorId) {
      actorId = c.req.query("actor_id")?.trim();
      if (actorId) {
        await emitAuditEventAsync({
          eventType: "identity.deprecated_actor_id_used",
          actorType: "user",
          actorId: "system",
          payload: { endpoint: "GET /api/v1/delegations/tickets/:id", source: "query" },
          correlationId: randomUUID(),
        });
      }
    }
    if (!actorId || actorId === "") {
      return c.json(
        { error: { code: "actor_id_required", message: "X-Actor-Id header or query actor_id is required" } },
        400,
      );
    }
    const ticket = await getDelegationTicketByIdAsync(id);
    if (!ticket) {
      return c.json({ error: { code: "ticket_not_found", message: "Delegation ticket not found" } }, 404);
    }
    if (actorId !== ticket.granter_id && actorId !== ticket.grantee_id) {
      return c.json(
        { error: { code: "forbidden", message: "Only granter or grantee may read this ticket" } },
        403,
      );
    }
    return c.json({ data: ticket }, 200);
  });

  app.post("/api/v1/delegations/tickets/:id/revoke", async (c) => {
    const id = c.req.param("id");
    const trustedActor = c.get(ACTOR_CONTEXT_KEY) as ActorContext | undefined;
    let actorId = trustedActor?.fromTrustedSource ? trustedActor.id : undefined;
    if (!actorId) {
      const body = await c.req.json().catch(() => ({}));
      const fromBody = body && typeof body === "object" && "actor_id" in body ? (body as { actor_id?: string }).actor_id : undefined;
      actorId = (typeof fromBody === "string" ? fromBody : undefined) ?? c.req.query("actor_id")?.trim();
      if (actorId) {
        await emitAuditEventAsync({
          eventType: "identity.deprecated_actor_id_used",
          actorType: "user",
          actorId: "system",
          payload: { endpoint: "POST /api/v1/delegations/tickets/:id/revoke", source: body && fromBody ? "body" : "query" },
          correlationId: randomUUID(),
        });
      }
    }
    if (!actorId || actorId.trim() === "") {
      return c.json(
        { error: { code: "actor_id_required", message: "X-Actor-Id header or body/query actor_id is required" } },
        400,
      );
    }
    const existing = await getDelegationTicketByIdAsync(id);
    if (!existing) {
      return c.json({ error: { code: "ticket_not_found", message: "Delegation ticket not found" } }, 404);
    }
    if (actorId !== existing.granter_id) {
      return c.json(
        { error: { code: "forbidden", message: "Only granter may revoke this ticket" } },
        403,
      );
    }
    const ticket = await revokeDelegationTicketAsync(id);
    return c.json({ data: ticket! }, 200);
  });

  registerAgentProviderRoutes(app as unknown as import("hono").Hono);

  app.post("/api/v1/agents", async (c) => {
    const payload = registerAgentSchema.parse(await c.req.json());
    const agent = await registerAgentAsync(payload);

    return c.json({ data: agent }, 201);
  });

  app.get("/api/v1/agents", async (c) => {
    const cursor = c.req.query("cursor") ?? undefined;
    const limitRaw = c.req.query("limit");
    const limit = limitRaw != null ? parseInt(limitRaw, 10) : undefined;
    const sort = (c.req.query("sort") as "created_at:desc" | "created_at:asc") ?? undefined;
    const search = c.req.query("search")?.trim() ?? undefined;
    const status = (c.req.query("status") as "active" | "deprecated" | "pending_review") ?? undefined;
    const source_origin = (c.req.query("source_origin") as
      | "official"
      | "self_hosted"
      | "connected_node"
      | "vendor") ?? undefined;
    const agent_type = (c.req.query("agent_type") as "logical" | "execution") ?? undefined;
    const opts =
      cursor !== undefined ||
      limit !== undefined ||
      sort !== undefined ||
      (search !== undefined && search.length > 0) ||
      status !== undefined ||
      source_origin !== undefined ||
      agent_type !== undefined
        ? {
            cursor,
            limit: limit !== undefined && Number.isFinite(limit) ? limit : undefined,
            sort,
            search: search && search.length > 0 ? search : undefined,
            status,
            source_origin,
            agent_type,
          }
        : undefined;
    const result = await listAgentsAsync(opts);
    if (Array.isArray(result)) {
      return c.json({ data: result }, 200);
    }
    const meta = (result as ListAgentsResult).next_cursor
      ? { next_cursor: (result as ListAgentsResult).next_cursor }
      : undefined;
    return c.json({ data: (result as ListAgentsResult).data, meta }, 200);
  });

  app.get("/api/v1/agents/recommendations", async (c) => {
    const parsed = recommendationQuerySchema.safeParse({
      intent: c.req.query("intent"),
      risk_max: c.req.query("risk_max"),
      limit: c.req.query("limit"),
    });
    if (!parsed.success) {
      return c.json(
        {
          error: {
            code: "invalid_recommendation_query",
            message: "Invalid recommendation query",
          },
        },
        400,
      );
    }

    const { intent, risk_max: riskMax, limit } = parsed.data;
    const intentLower = intent.toLowerCase();
    const maxRank = riskMax ? riskRank(riskMax) : Number.POSITIVE_INFINITY;

    const agents = await listAgentsAsync();
    const scored = agents
      .map((agent) => {
        if (agent.capabilities.length === 0) {
          return null;
        }

        const matchedCapabilities = agent.capabilities.filter((capability) =>
          capability.name.toLowerCase().includes(intentLower),
        );
        const riskCandidates = matchedCapabilities.length > 0 ? matchedCapabilities : agent.capabilities;
        const bestRiskRank = Math.min(...riskCandidates.map((capability) => riskRank(capability.risk_level)));
        if (bestRiskRank > maxRank) {
          return null;
        }

        let score = 0;
        for (const capability of agent.capabilities) {
          if (capability.name.toLowerCase().includes(intentLower)) {
            score += 3;
          }
        }
        if (agent.name.toLowerCase().includes(intentLower)) {
          score += 2;
        }
        if (agent.description.toLowerCase().includes(intentLower)) {
          score += 1;
        }

        return {
          agent,
          score,
          reason: score > 0 ? "semantic_match" : "fallback_risk_filtered",
        };
      })
      .filter((item): item is { agent: Agent; score: number; reason: string } => Boolean(item))
      .sort((a, b) => b.score - a.score || b.agent.created_at.localeCompare(a.agent.created_at))
      .slice(0, limit ?? 5)
      .map((item) => ({
        agent: item.agent,
        score: item.score,
        reason: item.reason,
      }));

    return c.json({ data: scored }, 200);
  });

  app.get("/api/v1/agents/:id/stats", async (c) => {
    const agentId = c.req.param("id");
    const stats = await getAgentStatsAsync(agentId);
    if (!stats) {
      return c.json({ error: { code: "agent_not_found", message: "Agent not found" } }, 404);
    }
    return c.json({ data: stats }, 200);
  });

  app.get("/api/v1/agents/:id", async (c) => {
    const agentId = c.req.param("id");
    const enriched = await getAgentDetailEnrichedAsync(agentId);
    if (!enriched) {
      return c.json({ error: { code: "agent_not_found", message: "Agent not found" } }, 404);
    }
    return c.json(
      {
        data: {
          ...enriched.agent,
          identity_verified: enriched.identity_verified,
          reputation_score: enriched.reputation_score,
          reputation_grade: enriched.reputation_grade,
          success_rate: enriched.success_rate,
          risk_level: enriched.risk_level,
          feedback_summary: enriched.feedback_summary,
        },
      },
      200,
    );
  });

  app.post("/api/v1/public-agent-templates", async (c) => {
    const payload = createPublicTemplateSchema.parse(await c.req.json());
    const created = await createPublicAgentTemplateAsync({
      name: payload.name,
      category: payload.category,
      majorVersion: payload.major_version,
      minorVersion: payload.minor_version,
      sourceUrl: payload.source_url,
      publisherId: payload.publisher_id,
    });
    return c.json({ data: created }, 201);
  });

  app.get("/api/v1/public-agent-templates", async () => {
    return new Response(JSON.stringify({ data: await listPublicAgentTemplatesAsync() }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  });

  app.post("/api/v1/public-agent-templates/:id/preflight-check", async (c) => {
    const templateId = c.req.param("id");
    const template = await getPublicAgentTemplateByIdAsync(templateId);
    if (!template) {
      return c.json({ error: { code: "template_not_found", message: "Template not found" } }, 404);
    }
    const payload = preflightCheckSchema.parse(await c.req.json());
    const result = runPreflightChecks(payload);
    return c.json({ data: { template_id: templateId, ...result } }, 200);
  });

  app.post("/api/v1/public-agent-templates/:id/quality-evaluations", async (c) => {
    const templateId = c.req.param("id");
    const template = await getPublicAgentTemplateByIdAsync(templateId);
    if (!template) {
      return c.json({ error: { code: "template_not_found", message: "Template not found" } }, 404);
    }
    const payload = qualityEvaluationSchema.parse(await c.req.json());
    const evaluation = await addQualityEvaluationAsync(templateId, payload.samples);
    const summary7 = await getQualityWindowSummaryAsync(templateId, 7);
    const governance = evaluateTemplateGovernance(summary7);
    await applyTemplateGovernanceDecisionAsync({ templateId, decision: governance });
    if (governance.action !== "none") {
      const correlationId = randomUUID();
      await emitAuditEventAsync({
        eventType: "template.governance.triggered",
        actorType: "system",
        actorId: "system",
        payload: {
          template_id: templateId,
          action: governance.action,
          reason_codes: governance.reason_codes,
          window_days: 7,
        },
        correlationId,
      });
      const latestApplication = await getLatestListingApplicationByTemplateAsync(templateId);
      if (latestApplication) {
        await emitAuditEventAsync({
          eventType: "template.publisher.notified",
          actorType: "system",
          actorId: "system",
          payload: {
            template_id: templateId,
            actor_id: latestApplication.actor_id,
            action: governance.action,
            reason_codes: governance.reason_codes,
          },
          correlationId,
        });
      }
    }
    return c.json({ data: evaluation, meta: { governance } }, 201);
  });

  app.get("/api/v1/public-agent-templates/:id/quality", async (c) => {
    const templateId = c.req.param("id");
    const template = await getPublicAgentTemplateByIdAsync(templateId);
    if (!template) {
      return c.json({ error: { code: "template_not_found", message: "Template not found" } }, 404);
    }
    const parsed = qualityWindowQuerySchema.safeParse({ window_days: c.req.query("window_days") });
    if (!parsed.success) {
      return c.json(
        {
          error: {
            code: "invalid_quality_window_query",
            message: "Invalid quality window query",
          },
        },
        400,
      );
    }
    const summary = await getQualityWindowSummaryAsync(templateId, parsed.data.window_days ?? 7);
    return c.json({ data: summary }, 200);
  });

  app.get("/api/v1/public-agent-templates/failure-semantics", async (c) => {
    return c.json({ data: listFailureSemantics() }, 200);
  });

  app.post("/api/v1/public-agent-templates/:id/listing/apply", async (c) => {
    const templateId = c.req.param("id");
    const template = await getPublicAgentTemplateByIdAsync(templateId);
    if (!template) {
      return c.json({ error: { code: "template_not_found", message: "Template not found" } }, 404);
    }
    const payload = listingApplySchema.parse(await c.req.json());
    const application = await createListingApplicationAsync({
      templateId,
      actorId: payload.actor_id,
    });
    return c.json({ data: application }, 201);
  });

  app.post("/api/v1/public-agent-templates/:id/listing/decide", async (c) => {
    const templateId = c.req.param("id");
    const template = await getPublicAgentTemplateByIdAsync(templateId);
    if (!template) {
      return c.json({ error: { code: "template_not_found", message: "Template not found" } }, 404);
    }
    const payload = listingDecisionSchema.parse(await c.req.json());
    const decided = await decideListingApplicationAsync({
      templateId,
      reviewerId: payload.reviewer_id,
      decision: payload.decision,
      note: payload.note,
    });
    if (!decided) {
      return c.json(
        {
          error: {
            code: "listing_application_not_found",
            message: "Listing application not found",
          },
        },
        404,
      );
    }
    return c.json({ data: decided }, 200);
  });

  app.get("/api/v1/public-agent-templates/:id/listing/status", async (c) => {
    const templateId = c.req.param("id");
    const template = await getPublicAgentTemplateByIdAsync(templateId);
    if (!template) {
      return c.json({ error: { code: "template_not_found", message: "Template not found" } }, 404);
    }
    const latest = await getLatestListingApplicationByTemplateAsync(templateId);
    return c.json(
      {
        data: {
          template_id: templateId,
          template_status: template.status,
          latest_application: latest,
        },
      },
      200,
    );
  });

  app.get("/api/v1/public-agent-templates/:id/publisher-metrics", async (c) => {
    const templateId = c.req.param("id");
    const template = await getPublicAgentTemplateByIdAsync(templateId);
    if (!template) {
      return c.json({ error: { code: "template_not_found", message: "Template not found" } }, 404);
    }
    const parsed = publisherMetricsQuerySchema.safeParse({ window_days: c.req.query("window_days") });
    if (!parsed.success) {
      return c.json(
        {
          error: {
            code: "invalid_publisher_metrics_query",
            message: "Invalid publisher metrics query",
          },
        },
        400,
      );
    }
    const windowDays = parsed.data.window_days ?? 7;
    const from = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();
    const agents = await listAgentsAsync();
    const templateAgentIds = agents
      .filter((agent) => agent.source_url === template.source_url)
      .map((agent) => agent.id);
    if (templateAgentIds.length === 0) {
      return c.json(
        {
          data: {
            template_id: templateId,
            window_days: windowDays,
            invocation_total: 0,
            success_rate: 0,
            failure_types: {
              denied: 0,
              failed: 0,
              need_confirmation: 0,
            },
          },
        },
        200,
      );
    }

    const events = (await listAuditEventsAsync({ from, limit: 5000 })).data.filter(
      (event) => event.agent_id && templateAgentIds.includes(event.agent_id),
    );
    const completed = events.filter((event) => event.event_type === "invocation.completed").length;
    const failed = events.filter((event) => event.event_type === "invocation.failed").length;
    const denied = events.filter((event) => event.event_type === "invocation.denied").length;
    const needConfirmation = events.filter(
      (event) => event.event_type === "invocation.need_confirmation",
    ).length;
    const invocationTotal = completed + failed + denied;
    const successRate = invocationTotal === 0 ? 0 : Number((completed / invocationTotal).toFixed(4));
    return c.json(
      {
        data: {
          template_id: templateId,
          window_days: windowDays,
          invocation_total: invocationTotal,
          success_rate: successRate,
          failure_types: {
            denied,
            failed,
            need_confirmation: needConfirmation,
          },
        },
      },
      200,
    );
  });

  app.get("/api/v1/public-agent-templates/:id/governance/events", async (c) => {
    const templateId = c.req.param("id");
    const template = await getPublicAgentTemplateByIdAsync(templateId);
    if (!template) {
      return c.json({ error: { code: "template_not_found", message: "Template not found" } }, 404);
    }
    const parsed = governanceEventsQuerySchema.safeParse({ window_days: c.req.query("window_days") });
    if (!parsed.success) {
      return c.json(
        {
          error: {
            code: "invalid_governance_events_query",
            message: "Invalid governance events query",
          },
        },
        400,
      );
    }
    const windowDays = parsed.data.window_days ?? 7;
    const from = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();
    const events = (await listAuditEventsAsync({ from, limit: 5000 })).data.filter(
      (event) =>
        (event.event_type === "template.governance.triggered" ||
          event.event_type === "template.publisher.notified") &&
        event.payload.template_id === templateId,
    );
    return c.json(
      {
        data: {
          template_id: templateId,
          window_days: windowDays,
          events,
        },
      },
      200,
    );
  });

  app.post("/api/v1/publishers", async (c) => {
    const payload = createPublisherSchema.parse(await c.req.json());
    const publisher = await createPublisherAsync({ identity_tier: payload.identity_tier });
    return c.json({ data: publisher }, 201);
  });

  app.get("/api/v1/publishers/:id", async (c) => {
    const publisherId = c.req.param("id");
    const publisher = await getPublisherAsync(publisherId);
    if (!publisher) {
      return c.json({ error: { code: "publisher_not_found", message: "Publisher not found" } }, 404);
    }
    return c.json({ data: publisher }, 200);
  });

  app.patch("/api/v1/publishers/:id", async (c) => {
    const publisherId = c.req.param("id");
    const payload = patchPublisherSchema.parse(await c.req.json());
    const publisher = await updatePublisherTierAsync(publisherId, payload.identity_tier);
    if (!publisher) {
      return c.json({ error: { code: "publisher_not_found", message: "Publisher not found" } }, 404);
    }
    return c.json({ data: publisher }, 200);
  });

  app.get("/api/v1/publishers/:id/dashboard", async (c) => {
    const publisherId = c.req.param("id");
    const parsed = publisherDashboardQuerySchema.safeParse({ window_days: c.req.query("window_days") });
    if (!parsed.success) {
      return c.json(
        {
          error: {
            code: "invalid_publisher_dashboard_query",
            message: "Invalid publisher dashboard query",
          },
        },
        400,
      );
    }
    const windowDays = parsed.data.window_days ?? 7;
    const templateIds = await listTemplateIdsByPublisherAsync(publisherId);
    const templateMetrics = [];
    for (const templateId of templateIds) {
      const template = await getPublicAgentTemplateByIdAsync(templateId);
      if (!template) {
        continue;
      }
      const from = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();
      const agents = await listAgentsAsync();
      const templateAgentIds = agents
        .filter((agent) => agent.source_url === template.source_url)
        .map((agent) => agent.id);
      const events = (await listAuditEventsAsync({ from, limit: 5000 })).data.filter(
        (event) => event.agent_id && templateAgentIds.includes(event.agent_id),
      );
      const completed = events.filter((event) => event.event_type === "invocation.completed").length;
      const failed = events.filter((event) => event.event_type === "invocation.failed").length;
      const denied = events.filter((event) => event.event_type === "invocation.denied").length;
      const total = completed + failed + denied;
      templateMetrics.push({
        template_id: templateId,
        template_name: template.name,
        template_status: template.status,
        invocation_total: total,
        success_rate: total === 0 ? 0 : Number((completed / total).toFixed(4)),
      });
    }
    return c.json(
      {
        data: {
          publisher_id: publisherId,
          window_days: windowDays,
          template_count: templateMetrics.length,
          templates: templateMetrics,
        },
      },
      200,
    );
  });

  app.get("/api/v1/publishers/:id/dashboard/trends", async (c) => {
    const publisherId = c.req.param("id");
    const parsed = publisherDashboardQuerySchema.safeParse({ window_days: c.req.query("window_days") });
    if (!parsed.success) {
      return c.json(
        {
          error: {
            code: "invalid_publisher_dashboard_trends_query",
            message: "Invalid publisher dashboard trends query",
          },
        },
        400,
      );
    }
    const windowDays = parsed.data.window_days ?? 7;
    const templateIds = await listTemplateIdsByPublisherAsync(publisherId);
    const templates = (
      await Promise.all(templateIds.map((templateId) => getPublicAgentTemplateByIdAsync(templateId)))
    ).filter((template): template is NonNullable<typeof template> => Boolean(template));
    const sourceUrls = new Set(templates.map((template) => template.source_url));
    const agents = await listAgentsAsync();
    const templateAgentIds = agents
      .filter((agent) => sourceUrls.has(agent.source_url))
      .map((agent) => agent.id);
    const from = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();
    const events = (await listAuditEventsAsync({ from, limit: 5000 })).data;
    const dailyMap = new Map<string, { date: string; invocation_total: number; governance_events: number }>();
    for (let index = windowDays - 1; index >= 0; index -= 1) {
      const day = new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      dailyMap.set(day, { date: day, invocation_total: 0, governance_events: 0 });
    }
    for (const event of events) {
      const key = event.created_at.slice(0, 10);
      const day = dailyMap.get(key);
      if (!day) {
        continue;
      }
      if (
        event.agent_id &&
        templateAgentIds.includes(event.agent_id) &&
        (event.event_type === "invocation.allowed" ||
          event.event_type === "invocation.denied" ||
          event.event_type === "invocation.need_confirmation")
      ) {
        day.invocation_total += 1;
      }
      if (
        event.event_type === "template.governance.triggered" &&
        typeof event.payload.template_id === "string" &&
        templateIds.includes(event.payload.template_id)
      ) {
        day.governance_events += 1;
      }
    }
    return c.json(
      {
        data: {
          publisher_id: publisherId,
          window_days: windowDays,
          daily: [...dailyMap.values()],
        },
      },
      200,
    );
  });

  app.get("/api/v1/publishers/:id/alerts", async (c) => {
    const publisherId = c.req.param("id");
    const parsed = publisherDashboardQuerySchema.safeParse({ window_days: c.req.query("window_days") });
    if (!parsed.success) {
      return c.json(
        {
          error: {
            code: "invalid_publisher_alerts_query",
            message: "Invalid publisher alerts query",
          },
        },
        400,
      );
    }
    const windowDays = parsed.data.window_days ?? 7;
    const templateIds = await listTemplateIdsByPublisherAsync(publisherId);
    const alerts = [];
    for (const templateId of templateIds) {
      const template = await getPublicAgentTemplateByIdAsync(templateId);
      if (!template) {
        continue;
      }
      const quality = await getQualityWindowSummaryAsync(templateId, windowDays);
      const decision = evaluateTemplateGovernance(quality);
      if (decision.action !== "none") {
        alerts.push({
          template_id: templateId,
          template_name: template.name,
          severity: decision.action === "suspend" ? "critical" : "warning",
          reason_codes: decision.reason_codes,
          suggested_action: decision.action,
        });
      }
    }
    return c.json(
      {
        data: {
          publisher_id: publisherId,
          window_days: windowDays,
          alerts,
        },
      },
      200,
    );
  });

  app.get("/api/v1/mainline/evidence", async (c) => {
    const parsed = mainlineEvidenceQuerySchema.safeParse({ window_days: c.req.query("window_days") });
    if (!parsed.success) {
      return c.json(
        {
          error: {
            code: "invalid_mainline_evidence_query",
            message: "Invalid mainline evidence query",
          },
        },
        400,
      );
    }
    const windowDays = parsed.data.window_days ?? 7;
    const from = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();
    const events = (await listAuditEventsAsync({ from, limit: 5000 })).data;
    const governanceTriggeredCount = events.filter(
      (event) => event.event_type === "template.governance.triggered",
    ).length;
    const publisherNotifiedCount = events.filter(
      (event) => event.event_type === "template.publisher.notified",
    ).length;
    const templates = await listPublicAgentTemplatesAsync();
    const suspendedTemplates = templates.filter((template) => template.status === "suspended").length;
    const metricsSnapshot = await getPhase0Metrics();
    const thresholds = {
      key_receipt_coverage_ratio_min: 0.95,
      ttfr_ms_max: 180000,
      fallback_success_rate_min: 0.5,
      task_stability_rate_min: 0.95,
    };
    const observed = {
      key_receipt_coverage_ratio: metricsSnapshot.key_receipt_coverage_ratio,
      ttfr_ms: metricsSnapshot.ttfr_ms,
      fallback_success_rate: metricsSnapshot.fallback_success_rate,
      task_stability_rate: metricsSnapshot.subscription_task_stable_completion_rate,
    };
    const releaseGate = {
      receipt_traceability_ok: metricsSnapshot.key_receipt_coverage_ratio >= 0.95,
      rollback_strategy_available: true,
      ttfr_ok: metricsSnapshot.ttfr_ms <= 180000,
      fallback_ok: metricsSnapshot.fallback_success_rate >= 0.5,
      task_stability_ok: metricsSnapshot.subscription_task_stable_completion_rate >= 0.95,
    };
    const failedChecks = Object.entries(releaseGate)
      .filter(([, passed]) => !passed)
      .map(([key]) => key);
    return c.json(
      {
        data: {
          window_days: windowDays,
          generated_at: new Date().toISOString(),
          metrics_snapshot: metricsSnapshot,
          supply_governance_summary: {
            governance_triggered_count: governanceTriggeredCount,
            publisher_notified_count: publisherNotifiedCount,
            suspended_templates: suspendedTemplates,
          },
          release_gate: {
            ...releaseGate,
            go_no_go: failedChecks.length === 0,
            failed_checks: failedChecks,
            thresholds,
            observed,
            decision_reason:
              failedChecks.length === 0
                ? "all_release_gate_checks_passed"
                : `failed_checks:${failedChecks.join(",")}`,
          },
        },
      },
      200,
    );
  });

  app.get("/api/v1/ops/reports/phase-b", async (c) => {
    const parsed = phaseBReportQuerySchema.safeParse({ window_days: c.req.query("window_days") });
    if (!parsed.success) {
      return c.json(
        {
          error: {
            code: "invalid_phase_b_report_query",
            message: "Invalid phase B report query",
          },
        },
        400,
      );
    }
    const windowDays = parsed.data.window_days ?? 7;
    const from = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();
    const events = (await listAuditEventsAsync({ from, limit: 5000 })).data;

    const fallbackAttempted = events.filter((event) => event.event_type === "ask.fallback.attempted").length;
    const fallbackCompleted = events.filter((event) => event.event_type === "ask.fallback.completed").length;
    const fallbackSuccessRate =
      fallbackAttempted === 0 ? 0 : Number((fallbackCompleted / fallbackAttempted).toFixed(4));

    const pendingByInvocation = new Map<string, number>();
    const completionLatencies: number[] = [];
    let completedReviews = 0;
    for (const event of events) {
      if (event.event_type === "invocation.pending_confirmation") {
        const invocationId = event.payload.invocation_id;
        if (typeof invocationId === "string") {
          pendingByInvocation.set(invocationId, Date.parse(event.created_at));
        }
        continue;
      }
      if (
        event.event_type === "invocation.confirmed" ||
        event.event_type === "invocation.denied_by_reviewer"
      ) {
        const invocationId = event.payload.invocation_id;
        if (typeof invocationId !== "string") {
          continue;
        }
        const pendingAt = pendingByInvocation.get(invocationId);
        if (pendingAt === undefined) {
          continue;
        }
        const latency = Date.parse(event.created_at) - pendingAt;
        if (Number.isFinite(latency) && latency >= 0) {
          completionLatencies.push(latency);
          completedReviews += 1;
        }
      }
    }
    completionLatencies.sort((a, b) => a - b);
    const p95Index =
      completionLatencies.length === 0
        ? -1
        : Math.min(completionLatencies.length - 1, Math.floor(completionLatencies.length * 0.95));
    const approvalSlaMsP95 = p95Index < 0 ? 0 : completionLatencies[p95Index];

    return c.json(
      {
        data: {
          window_days: windowDays,
          fallback_success_rate: fallbackSuccessRate,
          hitl: {
            completed_reviews: completedReviews,
            approval_sla_ms_p95: approvalSlaMsP95,
          },
        },
      },
      200,
    );
  });

  app.get("/api/v1/contracts/mainline-summary", async (c) => {
    return c.json(
      {
        data: {
          version: "mainline-v1",
          generated_at: new Date().toISOString(),
          consumer_groups: ["website", "console", "ops"],
          contracts: {
            a2a_visualization: {
              version: "a2a-visualization-v1",
              success_example: {
                request: "GET /api/v1/a2a/visualization/l2?mode=real&window_days=7&limit=2",
                response_shape: {
                  data: {
                    data_version: "a2a-vis-v1-real-w7",
                    source_mode: "real",
                    level: "l2",
                    window_days: 7,
                    replay_anchor_ts: "2026-03-16T00:00:00.000Z",
                    window_start_ts: "2026-03-09T00:00:00.000Z",
                    timeline: [
                      {
                        timestamp: "2026-03-15T12:00:00.000Z",
                        event_type: "invocation.completed",
                        status: "ok",
                        correlation_id: "example-correlation-1",
                      },
                    ],
                  },
                  meta: {
                    next_cursor: "opaque-cursor",
                    has_more: true,
                    page_size: 2,
                    returned_count: 1,
                    remaining_items: 3,
                  },
                },
              },
              error_examples: {
                invalid_a2a_cursor: {
                  status: 400,
                  response_shape: {
                    error: {
                      code: "invalid_a2a_cursor",
                      message: "Invalid a2a cursor",
                    },
                    meta: {
                      recoverable: true,
                      recovery_hint: "Drop cursor and request first page again",
                    },
                  },
                },
                a2a_cursor_context_mismatch: {
                  status: 400,
                  response_shape: {
                    error: {
                      code: "a2a_cursor_context_mismatch",
                      message: "Cursor does not match mode/window",
                    },
                    meta: {
                      recoverable: true,
                      recovery_hint: "Use cursor with original mode/window or reset pagination",
                    },
                  },
                },
                a2a_cursor_anchor_mismatch: {
                  status: 400,
                  response_shape: {
                    error: {
                      code: "a2a_cursor_anchor_mismatch",
                      message: "Cursor anchor does not match replay anchor",
                    },
                    meta: {
                      recoverable: true,
                      recovery_hint:
                        "Use either cursor-only replay or explicit replay_anchor_ts-only replay",
                    },
                  },
                },
              },
              consumer_decision_matrix: {
                evaluation_priority: ["recoverable_error_first", "then_has_more_state"],
                has_more_true: "show_load_more",
                has_more_false: "show_end_of_replay",
                recoverable_errors: {
                  invalid_a2a_cursor: "reset_replay_session",
                  a2a_cursor_context_mismatch: "reset_replay_session",
                  a2a_cursor_anchor_mismatch: "reset_replay_session",
                },
              },
              field_stability: {
                schema_version: "field-stability-v1",
                deprecated_fields: [],
                deprecation_template: {
                  field: "string",
                  replacement: "string",
                  sunset_after: "ISO-8601",
                  migration_note: "string",
                },
                migration_hints: {
                  none: "no_migration_required",
                },
                data_version: "stable",
                replay_anchor_ts: "stable",
                window_start_ts: "stable",
                timeline_event_type: "stable",
                timeline_status: "stable",
                meta_next_cursor: "stable",
                meta_has_more: "stable",
                meta_page_size: "stable",
                meta_returned_count: "stable",
                meta_remaining_items: "stable",
              },
            },
          },
          routes: [
            "POST /api/v1/ask",
            "POST /api/v1/ask/:id/fallback/retry",
            "POST /api/v1/ask/:id/fallback/alternative",
            "POST /api/v1/ask/:id/fallback/degraded",
            "POST /api/v1/ask/:id/rerun",
            "GET /api/v1/ask/:id/visualization",
            "GET /api/v1/a2a/visualization/l1",
            "GET /api/v1/a2a/visualization/l2",
            "GET /api/v1/a2a/visualization/l3",
            "GET /api/v1/a2a/visualization/l3/export",
            "GET /api/v1/mainline/evidence",
            "GET /api/v1/ops/reports/phase-b",
            "GET /api/v1/publishers/:id/dashboard",
            "GET /api/v1/publishers/:id/dashboard/trends",
            "GET /api/v1/publishers/:id/alerts",
          ],
        },
      },
      200,
    );
  });

  app.get("/api/v1/a2a/visualization/l1", async (c) => {
    const parsed = a2aVisualizationQuerySchema.safeParse({
      mode: c.req.query("mode"),
      window_days: c.req.query("window_days"),
      replay_anchor_ts: c.req.query("replay_anchor_ts"),
    });
    if (!parsed.success) {
      return c.json(
        {
          error: {
            code: "invalid_a2a_visualization_query",
            message: "Invalid a2a visualization query",
          },
        },
        400,
      );
    }
    const mode = (parsed.data.mode ?? "real") as VisualizationMode;
    const windowDays = parsed.data.window_days ?? 7;
    const l1 = await getA2AVisualizationL1({
      mode,
      windowDays,
      replayAnchorTs: parsed.data.replay_anchor_ts,
    });
    return c.json(
      {
        data: {
          data_version: getA2AVisualizationDataVersion({ mode, windowDays }),
          source_mode: mode,
          level: "l1",
          window_days: windowDays,
          replay_anchor_ts: l1.replay_anchor_ts,
          window_start_ts: l1.window_start_ts,
          summary: l1.summary,
        },
      },
      200,
    );
  });

  app.get("/api/v1/a2a/visualization/l2", async (c) => {
    const parsed = a2aVisualizationQuerySchema.safeParse({
      mode: c.req.query("mode"),
      window_days: c.req.query("window_days"),
      replay_anchor_ts: c.req.query("replay_anchor_ts"),
      cursor: c.req.query("cursor"),
      limit: c.req.query("limit"),
    });
    if (!parsed.success) {
      return c.json(
        {
          error: {
            code: "invalid_a2a_visualization_query",
            message: "Invalid a2a visualization query",
          },
        },
        400,
      );
    }
    const mode = (parsed.data.mode ?? "real") as VisualizationMode;
    const windowDays = parsed.data.window_days ?? 7;
    const page = await getA2AVisualizationL2Page({
      mode,
      windowDays,
      replayAnchorTs: parsed.data.replay_anchor_ts,
      cursor: parsed.data.cursor,
      limit: parsed.data.limit ?? 50,
    });
    if (!page.ok) {
      return c.json(
        {
          error: {
            code: page.error.code,
            message: page.error.message,
          },
          meta: {
            recoverable: true,
            recovery_hint: page.error.recovery_hint,
          },
        },
        400,
      );
    }
    return c.json(
      {
        data: {
          data_version: getA2AVisualizationDataVersion({ mode, windowDays }),
          source_mode: mode,
          level: "l2",
          window_days: windowDays,
          replay_anchor_ts: page.page.replay_anchor_ts,
          window_start_ts: page.page.window_start_ts,
          timeline: page.page.items,
        },
        meta: {
          next_cursor: page.page.next_cursor,
          has_more: page.page.has_more,
          page_size: page.page.page_size,
          returned_count: page.page.returned_count,
          remaining_items: page.page.remaining_items,
        },
      },
      200,
    );
  });

  app.get("/api/v1/a2a/visualization/l3", async (c) => {
    const parsed = a2aVisualizationQuerySchema.safeParse({
      mode: c.req.query("mode"),
      window_days: c.req.query("window_days"),
      replay_anchor_ts: c.req.query("replay_anchor_ts"),
      cursor: c.req.query("cursor"),
      limit: c.req.query("limit"),
    });
    if (!parsed.success) {
      return c.json(
        {
          error: {
            code: "invalid_a2a_visualization_query",
            message: "Invalid a2a visualization query",
          },
        },
        400,
      );
    }
    const mode = (parsed.data.mode ?? "real") as VisualizationMode;
    const windowDays = parsed.data.window_days ?? 7;
    const page = await getA2AVisualizationL3Page({
      mode,
      windowDays,
      replayAnchorTs: parsed.data.replay_anchor_ts,
      cursor: parsed.data.cursor,
      limit: parsed.data.limit ?? 50,
    });
    if (!page.ok) {
      return c.json(
        {
          error: {
            code: page.error.code,
            message: page.error.message,
          },
          meta: {
            recoverable: true,
            recovery_hint: page.error.recovery_hint,
          },
        },
        400,
      );
    }
    return c.json(
      {
        data: {
          data_version: getA2AVisualizationDataVersion({ mode, windowDays }),
          source_mode: mode,
          level: "l3",
          window_days: windowDays,
          replay_anchor_ts: page.page.replay_anchor_ts,
          window_start_ts: page.page.window_start_ts,
          items: page.page.items,
        },
        meta: {
          next_cursor: page.page.next_cursor,
          has_more: page.page.has_more,
          page_size: page.page.page_size,
          returned_count: page.page.returned_count,
          remaining_items: page.page.remaining_items,
        },
      },
      200,
    );
  });

  app.get("/api/v1/a2a/visualization/l3/export", async (c) => {
    const parsed = a2aVisualizationQuerySchema.safeParse({
      mode: c.req.query("mode"),
      window_days: c.req.query("window_days"),
      replay_anchor_ts: c.req.query("replay_anchor_ts"),
    });
    if (!parsed.success) {
      return c.json(
        {
          error: {
            code: "invalid_a2a_visualization_query",
            message: "Invalid a2a visualization query",
          },
        },
        400,
      );
    }
    const mode = (parsed.data.mode ?? "real") as VisualizationMode;
    const windowDays = parsed.data.window_days ?? 7;
    const exportData = await getA2AVisualizationL3Export({
      mode,
      windowDays,
      replayAnchorTs: parsed.data.replay_anchor_ts,
    });
    return c.json(
      {
        data: {
          export_type: "a2a_l3_evidence_audit",
          replay_anchor_ts: exportData.replay_anchor_ts,
          window_start_ts: exportData.window_start_ts,
          items: exportData.items,
        },
      },
      200,
    );
  });

  app.get("/api/v1/ops/reports/phase-c", async (c) => {
    const parsed = phaseCReportQuerySchema.safeParse({ window_days: c.req.query("window_days") });
    if (!parsed.success) {
      return c.json(
        {
          error: {
            code: "invalid_phase_c_report_query",
            message: "Invalid phase C report query",
          },
        },
        400,
      );
    }
    const windowDays = parsed.data.window_days ?? 7;
    const from = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();
    const events = (await listAuditEventsAsync({ from, limit: 5000 })).data;

    const taskRunCompleted = events.filter((event) => event.event_type === "user_task.run.completed").length;
    const taskRunFailed = events.filter((event) => event.event_type === "user_task.run.failed").length;
    const taskRunTotal = taskRunCompleted + taskRunFailed;
    const taskStableRate =
      taskRunTotal === 0 ? 0 : Number((taskRunCompleted / taskRunTotal).toFixed(4));

    const disputeCreatedAtById = new Map<string, number>();
    const disputeSlaSamples: number[] = [];
    let completedCases = 0;
    for (const event of events) {
      if (event.event_type === "dispute.created") {
        const disputeId = event.payload.dispute_id;
        if (typeof disputeId === "string") {
          disputeCreatedAtById.set(disputeId, Date.parse(event.created_at));
        }
        continue;
      }
      if (event.event_type === "dispute.arbitrated") {
        const disputeId = event.payload.dispute_id;
        if (typeof disputeId !== "string") {
          continue;
        }
        const createdAt = disputeCreatedAtById.get(disputeId);
        if (createdAt === undefined) {
          continue;
        }
        const latency = Date.parse(event.created_at) - createdAt;
        if (Number.isFinite(latency) && latency >= 0) {
          disputeSlaSamples.push(latency);
          completedCases += 1;
        }
      }
    }
    disputeSlaSamples.sort((a, b) => a - b);
    const p95Index =
      disputeSlaSamples.length === 0
        ? -1
        : Math.min(disputeSlaSamples.length - 1, Math.floor(disputeSlaSamples.length * 0.95));
    const disputeSlaMsP95 = p95Index < 0 ? 0 : disputeSlaSamples[p95Index];

    return c.json(
      {
        data: {
          window_days: windowDays,
          subscription_task_stable_completion_rate: taskStableRate,
          dispute: {
            completed_cases: completedCases,
            sla_ms_p95: disputeSlaMsP95,
          },
        },
      },
      200,
    );
  });

  app.get("/api/v1/ops/reports/phase-d", async (c) => {
    const parsed = phaseDReportQuerySchema.safeParse({ window_days: c.req.query("window_days") });
    if (!parsed.success) {
      return c.json(
        {
          error: {
            code: "invalid_phase_d_report_query",
            message: "Invalid phase D report query",
          },
        },
        400,
      );
    }
    const windowDays = parsed.data.window_days ?? 7;
    const from = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();
    const events = (await listAuditEventsAsync({ from, limit: 5000 })).data;

    const blockedOverreach = events.filter(
      (event) =>
        event.event_type === "connector.local_action.blocked_overreach" ||
        event.event_type === "connector.local_action.blocked_scope" ||
        event.event_type === "connector.local_action.blocked_connector_mismatch",
    ).length;
    const blockedRevoked = events.filter(
      (event) => event.event_type === "connector.local_action.blocked_revoked",
    ).length;
    const completedHighRisk = events.filter(
      (event) =>
        event.event_type === "connector.local_action.completed" &&
        (event.payload.risk_level === "high" || event.payload.risk_level === "critical"),
    ).length;
    const overreachDenominator = blockedOverreach + completedHighRisk;
    const connectorOverreachBlockRate =
      overreachDenominator === 0 ? 0 : Number((blockedOverreach / overreachDenominator).toFixed(4));
    const highRiskConfirmationPassRate =
      overreachDenominator === 0 ? 0 : Number((completedHighRisk / overreachDenominator).toFixed(4));
    const revokeDenominator = blockedRevoked + completedHighRisk;
    const revokeBlockRate =
      revokeDenominator === 0 ? 0 : Number((blockedRevoked / revokeDenominator).toFixed(4));

    return c.json(
      {
        data: {
          window_days: windowDays,
          connector_overreach_block_rate: connectorOverreachBlockRate,
          high_risk_confirmation_pass_rate: highRiskConfirmationPassRate,
          revoke_block_rate: revokeBlockRate,
        },
      },
      200,
    );
  });

  app.post("/api/v1/ask", async (c) => {
    const payload = askRequestSchema.parse(await c.req.json());
    const agents = await listAgentsAsync();
    if (agents.length === 0) {
      return c.json(
        {
          error: {
            code: "ask_no_agents_available",
            message: "No available agents for ask routing",
          },
        },
        409,
      );
    }
    const askPayload = {
      ...payload,
      ...(payload.privacy_mode === true && {
        text: "[privacy: summary only]",
      }),
    };
    let session;
    try {
      session = await createAskSessionAsync(askPayload, agents);
    } catch (err) {
      if (err instanceof AskRoutingError) {
        return c.json(
          {
            error: {
              code: err.code,
              message: err.message,
              ...(err.details ? { details: err.details } : {}),
            },
          },
          400,
        );
      }
      throw err;
    }
    const latest = session.runs[session.runs.length - 1];
    const meta: Record<string, unknown> = {};
    if (payload.category) {
      const sensitive = getRiskDisclaimerForCategory(payload.category);
      if (sensitive) {
        meta.risk_disclaimer = sensitive.disclaimer;
        meta.risk_disclaimer_reason_code = sensitive.reason_code;
      }
    }
    if (payload.data_use_boundary === "not_for_retraining") {
      meta.data_use_boundary_reason_code = REASON_CODE_NOT_FOR_RETRAINING_BOUNDARY;
      await emitAuditEventAsync({
        eventType: "ask.data_use_boundary",
        actorType: "user",
        actorId: "ask-client",
        payload: {
          ask_id: session.id,
          boundary: "not_for_retraining",
          reason_code: REASON_CODE_NOT_FOR_RETRAINING_BOUNDARY,
        },
        correlationId: randomUUID(),
      });
    }
    if (payload.privacy_mode === true) {
      meta.privacy_mode = true;
    }
    if (payload.age_category === "minor") {
      meta.minor_gating_applied = true;
      meta.minor_gating_disclaimer =
        "未成年人保护：部分能力受限，请在有监护人指导下使用。";
    }
    return c.json(
      {
        data: {
          ask_id: session.id,
          run_id: latest?.id,
          route: session.route,
          result: {
            summary: latest?.summary ?? "",
            evidence: latest?.evidence ?? [],
            cost_estimate_tokens: latest?.cost_estimate_tokens ?? 0,
            duration_ms: latest?.duration_ms ?? 0,
          },
        },
        ...(Object.keys(meta).length > 0 ? { meta } : {}),
      },
      201,
    );
  });

  app.post("/api/v1/ask/:id/fallback/retry", async (c) => {
    const askId = c.req.param("id");
    await emitAuditEventAsync({
      eventType: "ask.fallback.attempted",
      actorType: "user",
      actorId: "ask-system",
      payload: { ask_id: askId, action: "retry" },
      correlationId: randomUUID(),
    });
    const run = await runAskFallbackAsync(askId, "retry", await listAgentsAsync());
    if (!run) {
      return c.json({ error: { code: "ask_not_found", message: "Ask session not found" } }, 404);
    }
    await emitAuditEventAsync({
      eventType: "ask.fallback.completed",
      actorType: "user",
      actorId: "ask-system",
      payload: { ask_id: askId, action: "retry", run_id: run.id },
      correlationId: randomUUID(),
    });
    return c.json({ data: { action: "retry", result: run } }, 200);
  });

  app.post("/api/v1/ask/:id/fallback/alternative", async (c) => {
    const askId = c.req.param("id");
    await emitAuditEventAsync({
      eventType: "ask.fallback.attempted",
      actorType: "user",
      actorId: "ask-system",
      payload: { ask_id: askId, action: "alternative" },
      correlationId: randomUUID(),
    });
    const run = await runAskFallbackAsync(askId, "alternative", await listAgentsAsync());
    if (!run) {
      return c.json({ error: { code: "ask_not_found", message: "Ask session not found" } }, 404);
    }
    await emitAuditEventAsync({
      eventType: "ask.fallback.completed",
      actorType: "user",
      actorId: "ask-system",
      payload: { ask_id: askId, action: "alternative", run_id: run.id },
      correlationId: randomUUID(),
    });
    return c.json({ data: { action: "alternative", result: run } }, 200);
  });

  app.post("/api/v1/ask/:id/fallback/degraded", async (c) => {
    const askId = c.req.param("id");
    await emitAuditEventAsync({
      eventType: "ask.fallback.attempted",
      actorType: "user",
      actorId: "ask-system",
      payload: { ask_id: askId, action: "degraded" },
      correlationId: randomUUID(),
    });
    const run = await runAskFallbackAsync(askId, "degraded", await listAgentsAsync());
    if (!run) {
      return c.json({ error: { code: "ask_not_found", message: "Ask session not found" } }, 404);
    }
    await emitAuditEventAsync({
      eventType: "ask.fallback.completed",
      actorType: "user",
      actorId: "ask-system",
      payload: { ask_id: askId, action: "degraded", run_id: run.id },
      correlationId: randomUUID(),
    });
    return c.json({ data: { action: "degraded", result: run } }, 200);
  });

  app.get("/api/v1/ask/:id/visualization", async (c) => {
    const askId = c.req.param("id");
    const session = await getAskSessionAsync(askId);
    if (!session) {
      return c.json({ error: { code: "ask_not_found", message: "Ask session not found" } }, 404);
    }
    const parsed = askVisualizationQuerySchema.safeParse({ level: c.req.query("level") });
    if (!parsed.success) {
      return c.json(
        {
          error: {
            code: "invalid_ask_visualization_query",
            message: "Invalid ask visualization query",
          },
        },
        400,
      );
    }
    const data = buildAskVisualization(session, parsed.data.level ?? "l1");
    return c.json({ data }, 200);
  });

  app.post("/api/v1/ask/:id/rerun", async (c) => {
    const askId = c.req.param("id");
    const agents = await listAgentsAsync();
    const run = await rerunAskAsync(askId, agents);
    if (!run) {
      return c.json(
        { error: { code: "ask_not_found", message: "Ask session not found or no route agents available" } },
        404,
      );
    }
    return c.json(
      {
        data: {
          ask_id: askId,
          rerun_token: askId,
          result: {
            summary: run.summary,
            evidence: run.evidence,
            cost_estimate_tokens: run.cost_estimate_tokens,
            duration_ms: run.duration_ms,
          },
        },
      },
      200,
    );
  });

  app.get("/api/v1/user-task-instances", async (c) => {
    const parsed = listUserTaskInstancesQuerySchema.safeParse({
      user_id: c.req.query("user_id"),
      status: c.req.query("status"),
      limit: c.req.query("limit"),
    });
    if (!parsed.success) {
      return c.json(
        {
          error: {
            code: "invalid_list_query",
            message: "Invalid list query: user_id required",
          },
        },
        400,
      );
    }
    const trustedActor = c.get(ACTOR_CONTEXT_KEY) as ActorContext | undefined;
    if (trustedActor?.fromTrustedSource && trustedActor.id !== parsed.data.user_id) {
      return forbiddenResponse(c, "Authenticated actor does not match user_id.");
    }
    const tasks = await listUserTaskInstancesAsync({
      userId: parsed.data.user_id,
      status: parsed.data.status,
      limit: parsed.data.limit ?? 20,
    });
    return c.json({ data: tasks }, 200);
  });

  app.post("/api/v1/user-task-instances", async (c) => {
    const payload = createUserTaskInstanceSchema.parse(await c.req.json());
    const trustedActor = c.get(ACTOR_CONTEXT_KEY) as ActorContext | undefined;
    if (trustedActor?.fromTrustedSource && trustedActor.id !== payload.user_id) {
      return forbiddenResponse(c, "Authenticated actor does not match user_id.");
    }
    const created = await createUserTaskInstanceAsync({
      userId: payload.user_id,
      name: payload.name,
      scheduleCron: payload.schedule_cron,
    });
    return c.json({ data: created }, 201);
  });

  app.post("/api/v1/user-task-instances/scheduler/tick", async (c) => {
    const payload = schedulerTickSchema.parse(await c.req.json());
    const retryMax = payload.retry_max ?? 0;
    const retryBackoffBaseMs = payload.retry_backoff_base_ms ?? 1000;
    const selectionStrategy = payload.selection_strategy ?? "updated_at_desc";
    const simulationSet = new Set(payload.simulate_failure_task_ids ?? []);
    const listedTasks = await listUserTaskInstancesAsync({
      userId: payload.actor_id,
      status: "active",
      limit: payload.limit ?? 20,
    });
    const tasks =
      selectionStrategy === "updated_at_asc"
        ? [...listedTasks].sort((a, b) => a.updated_at.localeCompare(b.updated_at))
        : [...listedTasks].sort((a, b) => b.updated_at.localeCompare(a.updated_at));

    let succeededCount = 0;
    let failedCount = 0;
    let retryAttempts = 0;
    let retryBackoffMsTotal = 0;
    const runs: Array<{
      task_instance_id: string;
      run_id?: string;
      status: "completed" | "failed";
      attempts: number;
    }> = [];

    for (const task of tasks) {
      let attempts = 0;
      let finalStatus: "completed" | "failed" = "completed";
      while (attempts <= retryMax) {
        attempts += 1;
        const shouldFailThisAttempt = simulationSet.has(task.id) && attempts === 1;
        if (!shouldFailThisAttempt) {
          finalStatus = "completed";
          break;
        }
        retryAttempts += 1;
        retryBackoffMsTotal += retryBackoffBaseMs * 2 ** (attempts - 1);
        if (attempts > retryMax) {
          finalStatus = "failed";
          break;
        }
        await emitAuditEventAsync({
          eventType: "user_task.run.retry",
          actorType: "system",
          actorId: payload.actor_id,
          payload: { task_instance_id: task.id, attempt: attempts },
          correlationId: randomUUID(),
        });
      }
      const run = await appendUserTaskRunAsync({
        taskInstanceId: task.id,
        actorId: payload.actor_id,
        status: finalStatus,
        summary:
          finalStatus === "completed"
            ? "scheduler task run completed"
            : `scheduler task run failed after ${attempts} attempts`,
      });
      if (finalStatus === "completed") {
        succeededCount += 1;
      } else {
        failedCount += 1;
        await recordNotificationEventAsync({
          user_id: task.user_id,
          event_type: "scheduler_run_failed",
          payload: {
            task_instance_id: task.id,
            run_id: run?.id,
            attempts,
            actor_id: payload.actor_id,
          },
        });
      }
      await emitAuditEventAsync({
        eventType: finalStatus === "completed" ? "user_task.run.completed" : "user_task.run.failed",
        actorType: "system",
        actorId: payload.actor_id,
        payload: { task_instance_id: task.id, run_id: run?.id, attempts },
        correlationId: randomUUID(),
      });
      runs.push({
        task_instance_id: task.id,
        run_id: run?.id,
        status: finalStatus,
        attempts,
      });
    }

    return c.json(
      {
        data: {
          actor_id: payload.actor_id,
          executed_count: runs.length,
          succeeded_count: succeededCount,
          failed_count: failedCount,
          retry_attempts: retryAttempts,
          retry_backoff_ms_total: retryBackoffMsTotal,
          selection_strategy: selectionStrategy,
          runs,
        },
      },
      200,
    );
  });

  app.post("/api/v1/user-task-instances/:id/pause", async (c) => {
    const payload = taskActorSchema.parse(await c.req.json());
    const existing = await getUserTaskInstanceByIdAsync(c.req.param("id"));
    if (!existing) {
      return c.json({ error: { code: "task_instance_not_found", message: "Task instance not found" } }, 404);
    }
    if (existing.user_id !== payload.actor_id) {
      return forbiddenResponse(c, "Only the task owner may perform this action.");
    }
    if (existing.status === "deleted") {
      return c.json(
        { error: { code: "task_instance_deleted", message: "Deleted task instance is immutable" } },
        409,
      );
    }
    const task = await updateUserTaskStatusAsync(c.req.param("id"), "paused");
    if (!task) {
      return c.json({ error: { code: "task_instance_not_found", message: "Task instance not found" } }, 404);
    }
    return c.json({ data: task }, 200);
  });

  app.post("/api/v1/user-task-instances/:id/resume", async (c) => {
    const payload = taskActorSchema.parse(await c.req.json());
    const existing = await getUserTaskInstanceByIdAsync(c.req.param("id"));
    if (!existing) {
      return c.json({ error: { code: "task_instance_not_found", message: "Task instance not found" } }, 404);
    }
    if (existing.user_id !== payload.actor_id) {
      return forbiddenResponse(c, "Only the task owner may perform this action.");
    }
    if (existing.status === "deleted") {
      return c.json(
        { error: { code: "task_instance_deleted", message: "Deleted task instance is immutable" } },
        409,
      );
    }
    const task = await updateUserTaskStatusAsync(c.req.param("id"), "active");
    if (!task) {
      return c.json({ error: { code: "task_instance_not_found", message: "Task instance not found" } }, 404);
    }
    return c.json({ data: task }, 200);
  });

  app.post("/api/v1/user-task-instances/:id/archive", async (c) => {
    const payload = taskActorSchema.parse(await c.req.json());
    const existing = await getUserTaskInstanceByIdAsync(c.req.param("id"));
    if (!existing) {
      return c.json({ error: { code: "task_instance_not_found", message: "Task instance not found" } }, 404);
    }
    if (existing.user_id !== payload.actor_id) {
      return forbiddenResponse(c, "Only the task owner may perform this action.");
    }
    if (existing.status === "deleted") {
      return c.json(
        { error: { code: "task_instance_deleted", message: "Deleted task instance is immutable" } },
        409,
      );
    }
    const task = await updateUserTaskStatusAsync(c.req.param("id"), "archived");
    if (!task) {
      return c.json({ error: { code: "task_instance_not_found", message: "Task instance not found" } }, 404);
    }
    return c.json({ data: task }, 200);
  });

  app.post("/api/v1/user-task-instances/:id/delete", async (c) => {
    const payload = taskActorSchema.parse(await c.req.json());
    const existing = await getUserTaskInstanceByIdAsync(c.req.param("id"));
    if (!existing) {
      return c.json({ error: { code: "task_instance_not_found", message: "Task instance not found" } }, 404);
    }
    if (existing.user_id !== payload.actor_id) {
      return forbiddenResponse(c, "Only the task owner may perform this action.");
    }
    const task = await updateUserTaskStatusAsync(c.req.param("id"), "deleted");
    if (!task) {
      return c.json({ error: { code: "task_instance_not_found", message: "Task instance not found" } }, 404);
    }
    return c.json({ data: task }, 200);
  });

  app.patch("/api/v1/user-task-instances/:id", async (c) => {
    const taskId = c.req.param("id");
    const payload = patchUserTaskInstanceSchema.parse(await c.req.json());
    const existing = await getUserTaskInstanceByIdAsync(taskId);
    if (!existing) {
      return c.json({ error: { code: "task_instance_not_found", message: "Task instance not found" } }, 404);
    }
    if (existing.user_id !== payload.actor_id) {
      return forbiddenResponse(c, "Only the task owner may perform this action.");
    }
    if (existing.status === "deleted") {
      return c.json(
        { error: { code: "task_instance_deleted", message: "Deleted task instance is immutable" } },
        409,
      );
    }
    const task = await updateUserTaskInstanceParamsAsync(taskId, {
      name: payload.name,
      schedule_cron: payload.schedule_cron,
    });
    if (!task) {
      return c.json({ error: { code: "task_instance_not_found", message: "Task instance not found" } }, 404);
    }
    return c.json({ data: task }, 200);
  });

  app.post("/api/v1/user-task-instances/:id/run", async (c) => {
    const taskId = c.req.param("id");
    const payload = runUserTaskSchema.parse(await c.req.json());
    const task = await getUserTaskInstanceByIdAsync(taskId);
    if (!task) {
      return c.json({ error: { code: "task_instance_not_found", message: "Task instance not found" } }, 404);
    }
    if (task.user_id !== payload.actor_id) {
      return forbiddenResponse(c, "Only the task owner may perform this action.");
    }
    if (task.status !== "active") {
      return c.json(
        {
          error: {
            code: "task_instance_not_active",
            message: "Task instance must be active before run",
          },
        },
        409,
      );
    }
    const quotaStatus = await getQuotaStatusAsync(payload.actor_id, "subscription_task_runs");
    if (!quotaStatus.allowed) {
      return c.json(
        {
          error: {
            code: "quota_exceeded",
            message: "Subscription task run quota exceeded",
            details: quotaStatus,
          },
        },
        429,
      );
    }
    await consumeQuotaAsync({
      actorId: payload.actor_id,
      feature: "subscription_task_runs",
      units: 1,
    });
    const run = await appendUserTaskRunAsync({
      taskInstanceId: taskId,
      actorId: payload.actor_id,
      status: "completed",
      summary: "task run completed",
    });
    if (run) {
      await emitAuditEventAsync({
        eventType: "user_task.run.completed",
        actorType: "user",
        actorId: payload.actor_id,
        payload: { task_instance_id: taskId, run_id: run.id },
        correlationId: randomUUID(),
      });
    }
    return c.json({ data: run }, 200);
  });

  app.post("/api/v1/user-task-instances/:id/queue", async (c) => {
    const taskId = c.req.param("id");
    const payload = taskActorSchema.parse(await c.req.json());
    const task = await getUserTaskInstanceByIdAsync(taskId);
    if (!task) {
      return c.json({ error: { code: "task_instance_not_found", message: "Task instance not found" } }, 404);
    }
    if (task.user_id !== payload.actor_id) {
      return forbiddenResponse(c, "Only the task owner may perform this action.");
    }
    const item = await enqueueOfflineRunAsync({ userId: payload.actor_id, taskInstanceId: taskId });
    if (!item) {
      return c.json({ error: { code: "queue_failed", message: "Failed to enqueue" } }, 500);
    }
    return c.json({ data: item }, 201);
  });

  app.post("/api/v1/user-task-instances/queued/:queueId/cancel", async (c) => {
    const queueId = c.req.param("queueId");
    const payload = taskActorSchema.parse(await c.req.json());
    const item = await cancelQueuedRunAsync(queueId, payload.actor_id);
    if (!item) {
      return c.json(
        { error: { code: "queue_item_not_found", message: "Queue item not found or not queued" } },
        404,
      );
    }
    return c.json({ data: item }, 200);
  });

  app.post("/api/v1/user-task-instances/queued/:queueId/cloud-degrade", async (c) => {
    const queueId = c.req.param("queueId");
    const payload = taskActorSchema.parse(await c.req.json());
    const item = await getOfflineQueueItemAsync(queueId);
    if (!item || item.user_id !== payload.actor_id || item.status !== "queued") {
      return c.json(
        { error: { code: "queue_item_not_found", message: "Queue item not found or not queued" } },
        404,
      );
    }
    const task = await getUserTaskInstanceByIdAsync(item.task_instance_id);
    if (!task || task.status !== "active") {
      return c.json(
        { error: { code: "task_instance_not_active", message: "Task not active for cloud run" } },
        409,
      );
    }
    const run = await appendUserTaskRunAsync({
      taskInstanceId: item.task_instance_id,
      actorId: payload.actor_id,
      status: "completed",
      summary: "cloud degraded run (offline queue)",
    });
    await cloudDegradeQueuedRunAsync(queueId, payload.actor_id);
    await emitAuditEventAsync({
      eventType: "user_task.run.cloud_degraded",
      actorType: "user",
      actorId: payload.actor_id,
      payload: { task_instance_id: item.task_instance_id, run_id: run?.id, queue_id: queueId },
      correlationId: randomUUID(),
    });
    return c.json({ data: { run, queue_status: "cloud_degraded" } }, 200);
  });

  app.get("/api/v1/user-task-instances/queued", async (c) => {
    const actorId = c.req.query("actor_id");
    if (!actorId) {
      return c.json(
        { error: { code: "actor_id_required", message: "Query actor_id is required" } },
        400,
      );
    }
    const status = c.req.query("status") as "queued" | "cancelled" | "cloud_degraded" | undefined;
    const items = await listOfflineQueueByUserAsync(actorId, status);
    return c.json({ data: items }, 200);
  });

  app.get("/api/v1/user-task-instances/:id/history", async (c) => {
    const taskId = c.req.param("id");
    const parsed = taskHistoryQuerySchema.safeParse({
      actor_id: c.req.query("actor_id"),
      cursor: c.req.query("cursor"),
      limit: c.req.query("limit"),
    });
    if (!parsed.success) {
      return c.json(
        {
          error: {
            code: "invalid_task_history_query",
            message: "Invalid task history query",
          },
        },
        400,
      );
    }
    const task = await getUserTaskInstanceByIdAsync(taskId);
    if (!task) {
      return c.json({ error: { code: "task_instance_not_found", message: "Task instance not found" } }, 404);
    }
    if (task.status === "deleted") {
      return c.json({ error: { code: "task_instance_not_found", message: "Task instance not found" } }, 404);
    }
    if (task.user_id !== parsed.data.actor_id) {
      return forbiddenResponse(c, "Only the task owner may perform this action.");
    }
    const runs = await listUserTaskRunsAsync(taskId);
    if (!runs) {
      return c.json({ error: { code: "task_instance_not_found", message: "Task instance not found" } }, 404);
    }
    const orderedRuns = [...runs].sort((a, b) => b.created_at.localeCompare(a.created_at));
    const offset = Number.parseInt(parsed.data.cursor ?? "0", 10);
    const safeOffset = Number.isFinite(offset) && offset >= 0 ? offset : 0;
    const pageSize = parsed.data.limit ?? 50;
    const pageRuns = orderedRuns.slice(safeOffset, safeOffset + pageSize);
    const nextOffset = safeOffset + pageSize;
    const hasMore = nextOffset < orderedRuns.length;
    const completedRuns = orderedRuns.filter((run) => run.status === "completed").length;
    const failedRuns = orderedRuns.filter((run) => run.status === "failed").length;
    return c.json(
      {
        data: {
          task_instance_id: taskId,
          runs: pageRuns,
          anomaly_summary: {
            total_runs: orderedRuns.length,
            completed_runs: completedRuns,
            failed_runs: failedRuns,
            failure_rate:
              orderedRuns.length === 0 ? 0 : Number((failedRuns / orderedRuns.length).toFixed(4)),
          },
        },
        meta: {
          page_size: pageSize,
          returned_count: pageRuns.length,
          has_more: hasMore,
          next_cursor: hasMore ? String(nextOffset) : undefined,
        },
      },
      200,
    );
  });

  app.get("/api/v1/user-task-instances/:id/export", async (c) => {
    const taskId = c.req.param("id");
    const parsed = taskExportQuerySchema.safeParse({
      format: c.req.query("format"),
      actor_id: c.req.query("actor_id"),
    });
    if (!parsed.success) {
      return c.json(
        {
          error: {
            code: "invalid_export_query",
            message: "Invalid export query: format and actor_id required",
          },
        },
        400,
      );
    }
    const task = await getUserTaskInstanceByIdAsync(taskId);
    if (!task) {
      return c.json({ error: { code: "task_instance_not_found", message: "Task instance not found" } }, 404);
    }
    if (task.user_id !== parsed.data.actor_id) {
      return forbiddenResponse(c, "Only the task owner may perform this action.");
    }
    if (task.status === "deleted") {
      return c.json({ error: { code: "task_instance_not_found", message: "Task instance not found" } }, 404);
    }
    const runs = await listUserTaskRunsAsync(taskId);
    const runList = runs ?? [];
    if (parsed.data.format === "json") {
      return c.json(
        {
          data: {
            task: {
              id: task.id,
              user_id: task.user_id,
              name: task.name,
              schedule_cron: task.schedule_cron,
              status: task.status,
              created_at: task.created_at,
              updated_at: task.updated_at,
            },
            runs: runList,
          },
        },
        200,
      );
    }
    const csvHeader =
      "task_id,user_id,name,schedule_cron,status,run_id,actor_id,run_status,summary,run_created_at";
    const csvRows = runList.length
      ? runList.map(
          (r) =>
            `${task.id},${task.user_id},${escapeCsv(task.name)},${task.schedule_cron},${task.status},${r.id},${r.actor_id},${r.status},${escapeCsv(r.summary)},${r.created_at}`,
        )
      : [`${task.id},${task.user_id},${escapeCsv(task.name)},${task.schedule_cron},${task.status},,,,,"`];
    const csv = [csvHeader, ...csvRows].join("\n");
    return new Response(csv, {
      status: 200,
      headers: { "Content-Type": "text/csv; charset=utf-8" },
    });
  });

  app.get("/api/v1/users/:id/notification-preferences", async (c) => {
    const userId = c.req.param("id");
    const trustedActor = c.get(ACTOR_CONTEXT_KEY) as ActorContext | undefined;
    if (trustedActor?.fromTrustedSource && trustedActor.id !== userId) {
      return forbiddenResponse(c, "Authenticated actor does not match user settings scope.");
    }
    const prefs = await getNotificationPreferencesAsync(userId);
    if (!prefs) {
      return c.json({
        data: {
          user_id: userId,
          channels: ["in_app"],
          strategy: "only_exceptions",
          updated_at: new Date().toISOString(),
        },
      }, 200);
    }
    return c.json({ data: prefs }, 200);
  });

  app.patch("/api/v1/users/:id/notification-preferences", async (c) => {
    const userId = c.req.param("id");
    const trustedActor = c.get(ACTOR_CONTEXT_KEY) as ActorContext | undefined;
    if (trustedActor?.fromTrustedSource && trustedActor.id !== userId) {
      return forbiddenResponse(c, "Authenticated actor does not match user settings scope.");
    }
    const payload = notificationPreferencesSchema.parse(await c.req.json());
    const prefs = await setNotificationPreferencesAsync(userId, {
      channels: payload.channels,
      strategy: payload.strategy,
    });
    await emitAuditEventAsync({
      eventType: "settings.notification_preferences_updated",
      actorType: "user",
      actorId: userId,
      payload: { user_id: userId, channels: prefs.channels, strategy: prefs.strategy },
      correlationId: randomUUID(),
    });
    return c.json({ data: prefs }, 200);
  });

  app.get("/api/v1/users/:id/notifications", async (c) => {
    const userId = c.req.param("id");
    const limit = Math.min(100, Math.max(1, Number(c.req.query("limit")) || 50));
    const events = await listNotificationEventsAsync(userId, limit);
    return c.json({ data: events }, 200);
  });

  app.post("/api/v1/disputes", async (c) => {
    const payload = createDisputeSchema.parse(await c.req.json());
    const dispute = await createDisputeAsync({
      taskInstanceId: payload.task_instance_id,
      reporterId: payload.reporter_id,
      reason: payload.reason,
      evidenceRefs: payload.evidence_refs,
    });
    await emitAuditEventAsync({
      eventType: "dispute.created",
      actorType: "user",
      actorId: payload.reporter_id,
      payload: {
        dispute_id: dispute.id,
        task_instance_id: payload.task_instance_id,
      },
      correlationId: randomUUID(),
    });
    return c.json({ data: dispute }, 201);
  });

  app.get("/api/v1/disputes/:id", async (c) => {
    const parsed = getDisputeQuerySchema.safeParse({ actor_id: c.req.query("actor_id") });
    if (!parsed.success) {
      return c.json(
        {
          error: {
            code: "invalid_dispute_query",
            message: "Invalid dispute query",
          },
        },
        400,
      );
    }
    const dispute = await getDisputeByIdAsync(c.req.param("id"));
    if (!dispute) {
      return c.json({ error: { code: "dispute_not_found", message: "Dispute not found" } }, 404);
    }
    if (dispute.reporter_id !== parsed.data.actor_id) {
      return c.json({ error: { code: "dispute_forbidden", message: "Dispute access denied" } }, 403);
    }
    return c.json({ data: dispute }, 200);
  });

  app.post("/api/v1/disputes/:id/arbitrate", async (c) => {
    const payload = arbitrateDisputeSchema.parse(await c.req.json());
    const dispute = await getDisputeByIdAsync(c.req.param("id"));
    if (!dispute) {
      return c.json({ error: { code: "dispute_not_found", message: "Dispute not found" } }, 404);
    }
    if (!payload.arbitrator_id.startsWith("ops-") && !payload.arbitrator_id.startsWith("reviewer-")) {
      return c.json({ error: { code: "dispute_forbidden", message: "Arbitration role required" } }, 403);
    }
    await emitAuditEventAsync({
      eventType: "dispute.arbitrated",
      actorType: "user",
      actorId: payload.arbitrator_id,
      payload: {
        dispute_id: dispute.id,
        decision: payload.decision,
      },
      correlationId: randomUUID(),
    });
    const resolved = await arbitrateDisputeAsync({
      disputeId: dispute.id,
      decision: payload.decision,
      note: payload.note,
    });
    return c.json({ data: resolved }, 200);
  });

  app.get("/api/v1/connectors/authorizations", async (c) => {
    const parsed = listConnectorAuthorizationsQuerySchema.safeParse({
      user_id: c.req.query("user_id"),
      device_id: c.req.query("device_id"),
      limit: c.req.query("limit"),
    });
    if (!parsed.success) {
      return c.json(
        {
          error: {
            code: "invalid_list_authorizations_query",
            message: "Invalid list query: user_id required",
          },
        },
        400,
      );
    }
    const trustedActor = c.get(ACTOR_CONTEXT_KEY) as ActorContext | undefined;
    if (trustedActor?.fromTrustedSource && trustedActor.id !== parsed.data.user_id) {
      return forbiddenResponse(c, "Authenticated actor does not match user_id.");
    }
    const list = await listConnectorAuthorizationsByUserIdAsync({
      userId: parsed.data.user_id,
      deviceId: parsed.data.device_id,
      limit: parsed.data.limit ?? 20,
    });
    return c.json({ data: list }, 200);
  });

  app.post("/api/v1/connectors/authorizations", async (c) => {
    const payload = createConnectorAuthorizationSchema.parse(await c.req.json());
    const trustedActor = c.get(ACTOR_CONTEXT_KEY) as ActorContext | undefined;
    if (trustedActor?.fromTrustedSource && trustedActor.id !== payload.user_id) {
      return forbiddenResponse(c, "Authenticated actor does not match user_id.");
    }
    const authorization = await createConnectorAuthorizationAsync({
      userId: payload.user_id,
      deviceId: payload.device_id,
      connector: payload.connector,
      scopeLevel: payload.scope_level,
      scopeValue: payload.scope_value,
      expiresInSec: payload.expires_in_sec,
    });
    return c.json({ data: authorization }, 201);
  });

  app.post("/api/v1/connectors/authorizations/revoke-by-device", async (c) => {
    const payload = revokeByDeviceSchema.parse(await c.req.json());
    const trustedActor = c.get(ACTOR_CONTEXT_KEY) as ActorContext | undefined;
    if (trustedActor?.fromTrustedSource && trustedActor.id !== payload.actor_id) {
      return forbiddenResponse(c, "Authenticated actor does not match actor_id.");
    }
    if (payload.user_id !== payload.actor_id) {
      return forbiddenResponse(c, "Only the user can revoke their own device authorizations.");
    }
    const count = await revokeConnectorAuthorizationsByDeviceAsync({
      userId: payload.user_id,
      deviceId: payload.device_id,
    });
    return c.json({ data: { revoked_count: count } }, 200);
  });

  app.post("/api/v1/connectors/authorizations/:id/revoke", async (c) => {
    const payload = revokeConnectorAuthorizationSchema.parse(await c.req.json());
    const trustedActor = c.get(ACTOR_CONTEXT_KEY) as ActorContext | undefined;
    if (trustedActor?.fromTrustedSource && trustedActor.id !== payload.actor_id) {
      return forbiddenResponse(c, "Authenticated actor does not match actor_id.");
    }
    const authorization = await getConnectorAuthorizationByIdAsync(c.req.param("id"));
    if (!authorization) {
      return c.json({ error: { code: "authorization_not_found", message: "Authorization not found" } }, 404);
    }
    if (authorization.user_id !== payload.actor_id) {
      return forbiddenResponse(c, "Only the authorization owner may revoke this authorization.");
    }
    const revoked = await revokeConnectorAuthorizationAsync(authorization.id);
    return c.json({ data: revoked }, 200);
  });

  app.post("/api/v1/connectors/local-actions/execute", async (c) => {
    const payload = executeLocalActionSchema.parse(await c.req.json());
    const authorization = await getConnectorAuthorizationByIdAsync(payload.authorization_id);
    if (!authorization) {
      return c.json({ error: { code: "authorization_not_found", message: "Authorization not found" } }, 404);
    }
    if (authorization.status !== "active") {
      await emitAuditEventAsync({
        eventType: "connector.local_action.blocked_revoked",
        actorType: "user",
        actorId: authorization.user_id,
        payload: {
          authorization_id: authorization.id,
          action: payload.action,
          risk_level: payload.risk_level,
        },
        correlationId: randomUUID(),
      });
      return c.json({ error: { code: "authorization_revoked", message: "Authorization already revoked" } }, 409);
    }
    if (Date.parse(authorization.expires_at) <= Date.now()) {
      await emitAuditEventAsync({
        eventType: "connector.local_action.blocked_expired",
        actorType: "user",
        actorId: authorization.user_id,
        payload: {
          authorization_id: authorization.id,
          action: payload.action,
          risk_level: payload.risk_level,
        },
        correlationId: randomUUID(),
      });
      return c.json({ error: { code: "authorization_expired", message: "Authorization expired" } }, 409);
    }
    if (!isActionForConnector({ action: payload.action, connector: authorization.connector })) {
      await emitAuditEventAsync({
        eventType: "connector.local_action.blocked_connector_mismatch",
        actorType: "user",
        actorId: authorization.user_id,
        payload: {
          authorization_id: authorization.id,
          connector: authorization.connector,
          action: payload.action,
        },
        correlationId: randomUUID(),
      });
      return c.json(
        {
          error: {
            code: "authorization_connector_mismatch",
            message: "Requested action does not match connector namespace",
          },
        },
        403,
      );
    }
    if (
      !isActionWithinScope({
        action: payload.action,
        scopeLevel: authorization.scope_level,
        scopeValue: authorization.scope_value,
      })
    ) {
      await emitAuditEventAsync({
        eventType: "connector.local_action.blocked_scope",
        actorType: "user",
        actorId: authorization.user_id,
        payload: {
          authorization_id: authorization.id,
          action: payload.action,
          scope_level: authorization.scope_level,
          scope_value: authorization.scope_value,
        },
        correlationId: randomUUID(),
      });
      return c.json(
        {
          error: {
            code: "authorization_scope_violation",
            message: "Requested action is outside authorization scope",
          },
        },
        403,
      );
    }
    if ((payload.risk_level === "high" || payload.risk_level === "critical") && !payload.confirmed) {
      await emitAuditEventAsync({
        eventType: "connector.local_action.blocked_overreach",
        actorType: "user",
        actorId: authorization.user_id,
        payload: {
          authorization_id: authorization.id,
          action: payload.action,
          risk_level: payload.risk_level,
        },
        correlationId: randomUUID(),
      });
      return c.json(
        {
          error: {
            code: "high_risk_confirmation_required",
            message: "High-risk local action requires explicit confirmation",
          },
        },
        403,
      );
    }
    const receipt = await executeLocalActionAsync({
      authorizationId: authorization.id,
      action: payload.action,
      riskLevel: payload.risk_level,
      paramsSummary: payload.params_summary ?? {},
    });
    await emitAuditEventAsync({
      eventType: "connector.local_action.completed",
      actorType: "user",
      actorId: authorization.user_id,
      payload: {
        authorization_id: authorization.id,
        action: payload.action,
        risk_level: payload.risk_level,
        receipt_id: receipt.id,
      },
      correlationId: randomUUID(),
    });
    return c.json({ data: { status: "completed", receipt_id: receipt.id } }, 200);
  });

  app.get("/api/v1/connectors/local-action-receipts/:id", async (c) => {
    const parsed = getLocalActionReceiptQuerySchema.safeParse({ actor_id: c.req.query("actor_id") });
    if (!parsed.success) {
      return c.json(
        {
          error: {
            code: "invalid_local_action_receipt_query",
            message: "Invalid local action receipt query",
          },
        },
        400,
      );
    }
    const trustedActor = c.get(ACTOR_CONTEXT_KEY) as ActorContext | undefined;
    if (trustedActor?.fromTrustedSource && trustedActor.id !== parsed.data.actor_id) {
      return forbiddenResponse(c, "Authenticated actor does not match actor_id.");
    }
    const receipt = await getLocalActionReceiptByIdAsync(c.req.param("id"));
    if (!receipt) {
      return c.json({ error: { code: "local_action_receipt_not_found", message: "Local action receipt not found" } }, 404);
    }
    const authorization = await getConnectorAuthorizationByIdAsync(receipt.authorization_id);
    if (!authorization) {
      return c.json({ error: { code: "authorization_not_found", message: "Authorization not found" } }, 404);
    }
    if (authorization.user_id !== parsed.data.actor_id) {
      return c.json(
        { error: { code: "local_action_receipt_forbidden", message: "Local action receipt access denied" } },
        403,
      );
    }
    return c.json({ data: receipt }, 200);
  });

  app.post("/api/v1/conversations/:id/agents", async (c) => {
    const conversationId = c.req.param("id");
    const payload = joinAgentSchema.parse(await c.req.json());
    const agent = await getAgentByIdAsync(payload.agent_id);

    if (!agent) {
      return c.json({ error: { code: "agent_not_found", message: "Agent not found" } }, 404);
    }

    const addedParticipant = await addParticipantAsync({
      conversationId,
      participantType: "agent",
      participantId: payload.agent_id,
      role: "member",
    });

    if (!addedParticipant) {
      return c.json({ error: { code: "conversation_not_found", message: "Conversation not found" } }, 404);
    }

    return c.json({ data: addedParticipant }, 201);
  });

  app.post("/api/v1/conversations/:id/invitations", async (c) => {
    const conversationId = c.req.param("id");
    const payload = createInvitationSchema.parse(await c.req.json());
    const invitation = await createInvitationAsync({
      conversationId,
      inviterId: payload.inviter_id,
      inviteeType: payload.invitee_type,
      inviteeId: payload.invitee_id,
      role: payload.role,
      message: payload.message,
    });

    if (!invitation) {
      return c.json({ error: { code: "conversation_not_found", message: "Conversation not found" } }, 404);
    }

    return c.json({ data: invitation }, 201);
  });

  app.get("/api/v1/conversations/:id/invitations", async (c) => {
    const conversationId = c.req.param("id");
    const invitations = await listInvitationsByConversationAsync(conversationId);
    if (!invitations) {
      return c.json({ error: { code: "conversation_not_found", message: "Conversation not found" } }, 404);
    }

    return c.json({ data: invitations }, 200);
  });

  app.post("/api/v1/conversations/:id/invitations/:invitationId/accept", async (c) => {
    const conversationId = c.req.param("id");
    const invitationId = c.req.param("invitationId");
    const payload = acceptInvitationSchema.parse(await c.req.json());
    const invitation = await getInvitationAsync(conversationId, invitationId);

    if (!invitation) {
      return c.json({ error: { code: "invitation_not_found", message: "Invitation not found" } }, 404);
    }

    if (invitation.invitee_id !== payload.actor_id) {
      return c.json({ error: { code: "invitation_actor_mismatch", message: "Invitation actor mismatch" } }, 403);
    }

    if (invitation.status === "accepted") {
      return c.json({ data: invitation, meta: { idempotent: true } }, 200);
    }

    if (invitation.status !== "pending") {
      return c.json({ error: { code: "invitation_not_actionable", message: "Invitation is not pending" } }, 409);
    }

    const participant = await addParticipantAsync({
      conversationId,
      participantType: invitation.invitee_type,
      participantId: invitation.invitee_id,
      role: invitation.role,
    });

    if (!participant) {
      return c.json({ error: { code: "conversation_not_found", message: "Conversation not found" } }, 404);
    }

    const accepted = await markInvitationAcceptedAsync(conversationId, invitationId);
    if (!accepted) {
      return c.json({ error: { code: "invitation_not_found", message: "Invitation not found" } }, 404);
    }

    return c.json({ data: accepted, meta: { participant_id: participant.id, idempotent: false } }, 200);
  });

  app.post("/api/v1/conversations/:id/messages", async (c) => {
    const conversationId = c.req.param("id");
    const payload = sendMessageSchema.parse(await c.req.json());
    const correlationId = randomUUID();
    const ingestBoundaryDecision = evaluateDataBoundaryPolicy({ text: payload.text });

    if (ingestBoundaryDecision.decision === "deny") {
      await emitAuditEventAsync({
        eventType: "boundary.denied",
        conversationId,
        actorType: "user",
        actorId: payload.sender_id,
        payload: {
          text: payload.text,
          reason_codes: ingestBoundaryDecision.reason_codes,
          stage: "ingest",
        },
        correlationId,
      });
      return c.json(
        {
          error: {
            code: "data_boundary_violation",
            message: "Message blocked by data boundary policy",
            details: { reason_codes: ingestBoundaryDecision.reason_codes, stage: "ingest" },
          },
        },
        422,
      );
    }
    const sanitizedText = ingestBoundaryDecision.sanitized_text ?? payload.text;

    const userMessage = await appendMessageAsync({
      conversationId,
      senderType: "user",
      senderId: payload.sender_id,
      text: sanitizedText,
      threadId: payload.thread_id,
      mentions: payload.mentions,
    });

    if (!userMessage) {
      return c.json({ error: { code: "conversation_not_found", message: "Conversation not found" } }, 404);
    }
    publishMessageStream(conversationId, userMessage);

    const detail = await getConversationDetailAsync(conversationId);
    if (!detail) {
      return c.json({ error: { code: "conversation_not_found", message: "Conversation not found" } }, 404);
    }

    let delegationTicket: Awaited<ReturnType<typeof getDelegationTicketByIdAsync>> = null;
    if (payload.delegation_ticket_id) {
      const conv = detail.conversation;
      if (conv.conversation_topology !== "T5" || conv.authorization_mode !== "delegated") {
        return c.json(
          {
            error: {
              code: "delegation_ticket_not_applicable",
              message: "delegation_ticket_id only allowed for T5 conversations with delegated authorization",
            },
          },
          400,
        );
      }
      const ticket = await getDelegationTicketByIdAsync(payload.delegation_ticket_id);
      if (!ticket || ticket.revoked) {
        return c.json(
          { error: { code: "delegation_ticket_invalid", message: "Delegation ticket not found or revoked" } },
          400,
        );
      }
      if (isDelegationTicketExpired(ticket.expires_at)) {
        return c.json(
          { error: { code: "delegation_ticket_expired", message: "Delegation ticket has expired" } },
          400,
        );
      }
      if (ticket.grantee_id !== payload.sender_id) {
        return c.json(
          { error: { code: "forbidden", message: "Only the grantee may send messages with this ticket" } },
          403,
        );
      }
      if (!isConversationScopeAllowed(ticket.scope_objects, conversationId)) {
        return c.json(
          { error: { code: "delegation_scope_violation", message: "Conversation is outside delegation scope" } },
          403,
        );
      }
      if (!isDataDomainScopeAllowed(ticket.scope_data_domain, conv.visibility_mode ?? "full")) {
        return c.json(
          { error: { code: "delegation_scope_violation", message: "Data domain is outside delegation scope" } },
          403,
        );
      }
      delegationTicket = ticket;
    }

    const joinedAgentIds = detail.participants
      .filter((participant) => participant.participant_type === "agent")
      .map((participant) => participant.participant_id);
    const firstAgentId = joinedAgentIds[0];

    if (!firstAgentId) {
      return c.json({ data: userMessage }, 201);
    }

    if (payload.target_agent_ids && payload.target_agent_ids.length > 0) {
      const targetIds = [...new Set(payload.target_agent_ids)];
      const invalidAgentId = targetIds.find((agentId) => !joinedAgentIds.includes(agentId));
      if (invalidAgentId) {
        return c.json(
          {
            error: {
              code: "agent_not_in_conversation",
              message: "Target agent is not part of this conversation",
              details: { agent_id: invalidAgentId },
            },
          },
          400,
        );
      }

      const pendingInvocations: Array<{ agent_id: string; invocation_id: string }> = [];
      const completedReceipts: Array<{ agent_id: string; receipt_id: string }> = [];
      const deniedAgents: Array<{ agent_id: string; reason_codes: string[] }> = [];
      const failedAgents: Array<{ agent_id: string; reason: string }> = [];
      let t5RoundSummary: string | null = null;

      for (const targetAgentId of targetIds) {
        const perAgentCorrelationId = randomUUID();
        const agent = await getAgentByIdAsync(targetAgentId);
        if (!agent) {
          return c.json({ error: { code: "agent_not_found", message: "Agent not found" } }, 404);
        }
        if (delegationTicket) {
          const firstCapabilityName = agent.capabilities[0]?.name;
          if (
            !isAgentScopeAllowed(delegationTicket.scope_objects, agent.id) ||
            !isCapabilityScopeAllowed(delegationTicket.scope_capabilities, firstCapabilityName)
          ) {
            deniedAgents.push({ agent_id: agent.id, reason_codes: ["delegation_scope_violation"] });
            await interruptT5DelegationAsync({
              conversation_id: conversationId,
              delegation_ticket_id: delegationTicket.id,
              granter_id: delegationTicket.granter_id,
              reason: "policy_violation",
              detail: `scope_violation: agent=${agent.id}, capability=${firstCapabilityName ?? "unknown"}`,
            });
            continue;
          }
        }

        const trustDecision = evaluateTrustDecision({
          agent,
          capability: agent.capabilities[0],
          context: {
            conversationId,
            actorId: payload.sender_id,
          },
        });

        const decisionEventType = toDecisionEventType(trustDecision.decision);

        await emitAuditEventAsync({
          eventType: decisionEventType,
          conversationId,
          agentId: agent.id,
          actorType: "user",
          actorId: payload.sender_id,
          payload: {
            message_id: userMessage.id,
            text: sanitizedText,
          },
          trustDecision,
          correlationId: perAgentCorrelationId,
        });

        if (trustDecision.decision === "need_confirmation") {
          const pendingInvocation = await createPendingInvocationAsync({
            conversationId,
            agentId: agent.id,
            requesterId: payload.sender_id,
            userText: sanitizedText,
          });
          await emitAuditEventAsync({
            eventType: "invocation.pending_confirmation",
            conversationId,
            agentId: agent.id,
            actorType: "user",
            actorId: payload.sender_id,
            payload: {
              invocation_id: pendingInvocation.id,
              reason_codes: trustDecision.reason_codes,
            },
            trustDecision,
            correlationId: perAgentCorrelationId,
          });
          pendingInvocations.push({ agent_id: agent.id, invocation_id: pendingInvocation.id });
          if (delegationTicket) {
            await interruptT5DelegationAsync({
              conversation_id: conversationId,
              delegation_ticket_id: delegationTicket.id,
              granter_id: delegationTicket.granter_id,
              reason: "policy_violation",
              detail: `need_confirmation: ${trustDecision.reason_codes?.join(",") ?? ""}`,
            });
          }
          continue;
        }

        if (trustDecision.decision === "deny") {
          deniedAgents.push({ agent_id: agent.id, reason_codes: trustDecision.reason_codes });
          if (delegationTicket) {
            await interruptT5DelegationAsync({
              conversation_id: conversationId,
              delegation_ticket_id: delegationTicket.id,
              granter_id: delegationTicket.granter_id,
              reason: "policy_violation",
              detail: `deny: ${trustDecision.reason_codes?.join(",") ?? ""}`,
            });
          }
          continue;
        }

        let agentMessage: Message | null = null;
        try {
          const forwardBoundaryDecision = evaluateDataBoundaryPolicy({ text: sanitizedText });
          if (forwardBoundaryDecision.decision === "deny") {
            await emitAuditEventAsync({
              eventType: "boundary.denied",
              conversationId,
              agentId: agent.id,
              actorType: "user",
              actorId: payload.sender_id,
              payload: {
                text: sanitizedText,
                reason_codes: forwardBoundaryDecision.reason_codes,
                stage: "forward",
              },
              correlationId: perAgentCorrelationId,
            });
            deniedAgents.push({ agent_id: agent.id, reason_codes: forwardBoundaryDecision.reason_codes });
            if (delegationTicket) {
              await interruptT5DelegationAsync({
                conversation_id: conversationId,
                delegation_ticket_id: delegationTicket.id,
                granter_id: delegationTicket.granter_id,
                reason: "policy_violation",
                detail: `boundary_deny: ${forwardBoundaryDecision.reason_codes?.join(",") ?? ""}`,
              });
            }
            continue;
          }
          const a2aResponse = await requestAgent({
            conversationId,
            agent,
            userText: sanitizedText,
          });
          if (delegationTicket && t5RoundSummary === null) {
            t5RoundSummary = (a2aResponse.text ?? "").slice(0, 500);
          }
          agentMessage = await appendMessageAsync({
            conversationId,
            senderType: "agent",
            senderId: agent.id,
            text: a2aResponse.text,
          });
          if (agentMessage) publishMessageStream(conversationId, agentMessage);
        } catch (error) {
          const reason = error instanceof Error ? error.message : "unknown_error";
          await emitAuditEventAsync({
            eventType: "invocation.failed",
            conversationId,
            agentId: agent.id,
            actorType: "system",
            actorId: "system",
            payload: { reason },
            trustDecision,
            correlationId: perAgentCorrelationId,
          });
          failedAgents.push({ agent_id: agent.id, reason });
          continue;
        }

        if (!agentMessage) {
          continue;
        }

        const completedEvent = await emitAuditEventAsync({
          eventType: "invocation.completed",
          conversationId,
          agentId: agent.id,
          actorType: "agent",
          actorId: agent.id,
          payload: {
            message_id: agentMessage.id,
          },
          trustDecision,
          correlationId: perAgentCorrelationId,
        });

        const receipt = await issueReceiptAsync({
          auditEventId: completedEvent.id,
          conversationId,
          receiptType: "invocation_completed",
          payload: {
            conversation_id: conversationId,
            user_message_id: userMessage.id,
            agent_message_id: agentMessage.id,
            agent_id: agent.id,
          },
        });
        completedReceipts.push({ agent_id: agent.id, receipt_id: receipt.id });
      }

      if (pendingInvocations.length > 0) {
        return c.json(
          {
            data: userMessage,
            meta: {
              pending_invocations: pendingInvocations,
              completed_receipts: completedReceipts,
              denied_agents: deniedAgents,
              failed_agents: failedAgents,
            },
          },
          202,
        );
      }

      if (completedReceipts.length > 0) {
        if (delegationTicket) {
          await recordT5PhaseSummaryAsync({
            conversation_id: conversationId,
            delegation_ticket_id: delegationTicket.id,
            granter_id: delegationTicket.granter_id,
            phase: "message_round",
            summary: t5RoundSummary ?? "Round completed.",
          });
        }
        return c.json(
          {
            data: userMessage,
            meta: {
              completed_receipts: completedReceipts,
              denied_agents: deniedAgents,
              failed_agents: failedAgents,
            },
          },
          201,
        );
      }

      if (failedAgents.length > 0 && deniedAgents.length === 0) {
        return c.json(
          {
            error: {
              code: "a2a_invocation_failed",
              message: "A2A invocation failed",
              details: { failed_agents: failedAgents },
            },
          },
          502,
        );
      }

      return c.json(
        {
          error: {
            code: "invocation_denied",
            message: "Invocation denied by trust policy",
            details: { denied_agents: deniedAgents, failed_agents: failedAgents },
          },
        },
        403,
      );
    }

    const agent = await getAgentByIdAsync(firstAgentId);

    if (!agent) {
      return c.json({ error: { code: "agent_not_found", message: "Agent not found" } }, 404);
    }
    if (delegationTicket) {
      const firstCapabilityName = agent.capabilities[0]?.name;
      if (
        !isAgentScopeAllowed(delegationTicket.scope_objects, agent.id) ||
        !isCapabilityScopeAllowed(delegationTicket.scope_capabilities, firstCapabilityName)
      ) {
        await interruptT5DelegationAsync({
          conversation_id: conversationId,
          delegation_ticket_id: delegationTicket.id,
          granter_id: delegationTicket.granter_id,
          reason: "policy_violation",
          detail: `scope_violation: agent=${agent.id}, capability=${firstCapabilityName ?? "unknown"}`,
        });
        return c.json(
          {
            error: {
              code: "delegation_scope_violation",
              message: "Agent or capability is outside delegation scope",
            },
          },
          403,
        );
      }
    }

    const trustDecision = evaluateTrustDecision({
      agent,
      capability: agent.capabilities[0],
      context: {
        conversationId,
        actorId: payload.sender_id,
      },
    });

    const decisionEventType = toDecisionEventType(trustDecision.decision);

    await emitAuditEventAsync({
      eventType: decisionEventType,
      conversationId,
      agentId: agent.id,
      actorType: "user",
      actorId: payload.sender_id,
      payload: {
        message_id: userMessage.id,
        text: sanitizedText,
      },
      trustDecision,
      correlationId,
    });

    if (trustDecision.decision === "need_confirmation") {
      const pendingInvocation = await createPendingInvocationAsync({
        conversationId,
        agentId: agent.id,
        requesterId: payload.sender_id,
        userText: sanitizedText,
      });

      await emitAuditEventAsync({
        eventType: "invocation.pending_confirmation",
        conversationId,
        agentId: agent.id,
        actorType: "user",
        actorId: payload.sender_id,
        payload: {
          invocation_id: pendingInvocation.id,
          reason_codes: trustDecision.reason_codes,
        },
        trustDecision,
        correlationId,
      });

      if (delegationTicket) {
        await interruptT5DelegationAsync({
          conversation_id: conversationId,
          delegation_ticket_id: delegationTicket.id,
          granter_id: delegationTicket.granter_id,
          reason: "policy_violation",
          detail: `need_confirmation: ${trustDecision.reason_codes?.join(",") ?? ""}`,
        });
      }

      return c.json(
        {
          data: userMessage,
          meta: {
            trust_decision: trustDecision,
            invocation_id: pendingInvocation.id,
          },
        },
        202,
      );
    }

    if (trustDecision.decision === "deny") {
      if (delegationTicket) {
        await interruptT5DelegationAsync({
          conversation_id: conversationId,
          delegation_ticket_id: delegationTicket.id,
          granter_id: delegationTicket.granter_id,
          reason: "policy_violation",
          detail: `deny: ${trustDecision.reason_codes?.join(",") ?? ""}`,
        });
      }
      return c.json(
        {
          error: {
            code: "invocation_denied",
            message: "Invocation denied by trust policy",
            details: { trust_decision: trustDecision },
          },
        },
        403,
      );
    }

    let agentMessage: Message | null = null;
    try {
      const forwardBoundaryDecision = evaluateDataBoundaryPolicy({ text: sanitizedText });
      if (forwardBoundaryDecision.decision === "deny") {
        await emitAuditEventAsync({
          eventType: "boundary.denied",
          conversationId,
          agentId: agent.id,
          actorType: "user",
          actorId: payload.sender_id,
          payload: {
            text: sanitizedText,
            reason_codes: forwardBoundaryDecision.reason_codes,
            stage: "forward",
          },
          correlationId,
        });
        if (delegationTicket) {
          await interruptT5DelegationAsync({
            conversation_id: conversationId,
            delegation_ticket_id: delegationTicket.id,
            granter_id: delegationTicket.granter_id,
            reason: "policy_violation",
            detail: `boundary_deny: ${forwardBoundaryDecision.reason_codes?.join(",") ?? ""}`,
          });
        }
        return c.json(
          {
            error: {
              code: "data_boundary_violation",
              message: "Forwarding blocked by data boundary policy",
              details: { reason_codes: forwardBoundaryDecision.reason_codes, stage: "forward" },
            },
          },
          422,
        );
      }
      const a2aResponse = await requestAgent({
        conversationId,
        agent,
        userText: sanitizedText,
      });

      agentMessage = await appendMessageAsync({
        conversationId,
        senderType: "agent",
        senderId: agent.id,
        text: a2aResponse.text,
      });
      if (agentMessage) publishMessageStream(conversationId, agentMessage);
    } catch (error) {
      await emitAuditEventAsync({
        eventType: "invocation.failed",
        conversationId,
        agentId: agent.id,
        actorType: "system",
        actorId: "system",
        payload: { reason: error instanceof Error ? error.message : "unknown_error" },
        trustDecision,
        correlationId,
      });

      return c.json(
        {
          error: {
            code: "a2a_invocation_failed",
            message: "A2A invocation failed",
          },
        },
        502,
      );
    }

    if (!agentMessage) {
      return c.json({ error: { code: "conversation_not_found", message: "Conversation not found" } }, 404);
    }

    const completedEvent = await emitAuditEventAsync({
      eventType: "invocation.completed",
      conversationId,
      agentId: agent.id,
      actorType: "agent",
      actorId: agent.id,
      payload: {
        message_id: agentMessage.id,
      },
      trustDecision,
      correlationId,
    });

    const receipt = await issueReceiptAsync({
      auditEventId: completedEvent.id,
      conversationId,
      receiptType: "invocation_completed",
      payload: {
        conversation_id: conversationId,
        user_message_id: userMessage.id,
        agent_message_id: agentMessage.id,
      },
    });

    if (delegationTicket) {
      const agentText = (agentMessage.content as { text?: string })?.text ?? "";
      await recordT5PhaseSummaryAsync({
        conversation_id: conversationId,
        delegation_ticket_id: delegationTicket.id,
        granter_id: delegationTicket.granter_id,
        phase: "message_round",
        summary: agentText.slice(0, 500) || "Round completed.",
      });
    }

    return c.json(
      {
        data: userMessage,
        meta: {
          trust_decision: trustDecision,
          receipt_id: receipt.id,
        },
      },
      201,
    );
  });

  app.post("/api/v1/invocations/:id/confirm", async (c) => {
    const invocationId = c.req.param("id");
    const payload = confirmInvocationSchema.parse(await c.req.json());

    const invocation = await getInvocationByIdAsync(invocationId);
    if (!invocation) {
      return c.json({ error: { code: "invocation_not_found", message: "Invocation not found" } }, 404);
    }

    if (invocation.status !== "pending_confirmation") {
      return c.json({ error: { code: "invocation_not_confirmable", message: "Invocation already processed" } }, 409);
    }

    const claimedInvocation = await claimInvocationForProcessingAsync(invocationId);
    if (!claimedInvocation) {
      return c.json({ error: { code: "invocation_not_confirmable", message: "Invocation already processed" } }, 409);
    }

    const agent = await getAgentByIdAsync(invocation.agent_id);
    if (!agent) {
      return c.json({ error: { code: "agent_not_found", message: "Agent not found" } }, 404);
    }

    const correlationId = randomUUID();

    await emitAuditEventAsync({
      eventType: "invocation.confirmed",
      conversationId: invocation.conversation_id,
      agentId: agent.id,
      actorType: "user",
      actorId: payload.approver_id,
      payload: { invocation_id: invocation.id },
      correlationId,
    });

    let agentMessage: Message | null = null;
    try {
      const forwardBoundaryDecision = evaluateDataBoundaryPolicy({ text: invocation.user_text });
      if (forwardBoundaryDecision.decision === "deny") {
        await emitAuditEventAsync({
          eventType: "boundary.denied",
          conversationId: invocation.conversation_id,
          agentId: agent.id,
          actorType: "user",
          actorId: payload.approver_id,
          payload: {
            text: invocation.user_text,
            reason_codes: forwardBoundaryDecision.reason_codes,
            stage: "confirm_forward",
            invocation_id: invocation.id,
          },
          correlationId,
        });
        await rollbackInvocationProcessingAsync(claimedInvocation.id);
        return c.json(
          {
            error: {
              code: "data_boundary_violation",
              message: "Forwarding blocked by data boundary policy",
              details: { reason_codes: forwardBoundaryDecision.reason_codes, stage: "confirm_forward" },
            },
          },
          422,
        );
      }
      const a2aResponse = await requestAgent({
        conversationId: invocation.conversation_id,
        agent,
        userText: invocation.user_text,
      });

      agentMessage = await appendMessageAsync({
        conversationId: invocation.conversation_id,
        senderType: "agent",
        senderId: agent.id,
        text: a2aResponse.text,
      });
      if (agentMessage) publishMessageStream(invocation.conversation_id, agentMessage);
    } catch (error) {
      await emitAuditEventAsync({
        eventType: "invocation.failed",
        conversationId: claimedInvocation.conversation_id,
        agentId: agent.id,
        actorType: "system",
        actorId: "system",
        payload: { reason: error instanceof Error ? error.message : "unknown_error" },
        correlationId,
      });
      await rollbackInvocationProcessingAsync(claimedInvocation.id);

      return c.json(
        {
          error: {
            code: "a2a_invocation_failed",
            message: "A2A invocation failed",
          },
        },
        502,
      );
    }

    if (!agentMessage) {
      return c.json({ error: { code: "conversation_not_found", message: "Conversation not found" } }, 404);
    }

    const completedInvocation = await markInvocationCompletedAsync(claimedInvocation.id);
    if (!completedInvocation) {
      return c.json({ error: { code: "invocation_not_confirmable", message: "Invocation already processed" } }, 409);
    }

    const completedEvent = await emitAuditEventAsync({
      eventType: "invocation.completed",
      conversationId: invocation.conversation_id,
      agentId: agent.id,
      actorType: "agent",
      actorId: agent.id,
      payload: {
        invocation_id: invocation.id,
        message_id: agentMessage.id,
      },
      correlationId,
    });

    const receipt = await issueReceiptAsync({
      auditEventId: completedEvent.id,
      conversationId: invocation.conversation_id,
      receiptType: "invocation_completed",
      payload: {
        invocation_id: invocation.id,
        message_id: agentMessage.id,
      },
    });

    return c.json(
      {
        data: {
          invocation_id: completedInvocation.id,
          status: "completed",
        },
        meta: {
          receipt_id: receipt.id,
        },
      },
      200,
    );
  });

  app.get("/api/v1/invocations", async (c) => {
    const statusRaw = c.req.query("status");
    const conversationId = c.req.query("conversation_id");
    if (
      statusRaw &&
      statusRaw !== "pending_confirmation" &&
      statusRaw !== "completed"
    ) {
      return c.json(
        {
          error: {
            code: "invalid_status",
            message: "Invalid status filter",
            details: {
              allowed: ["pending_confirmation", "completed"],
            },
          },
        },
        400,
      );
    }
    const status =
      statusRaw === "pending_confirmation" || statusRaw === "completed" ? statusRaw : undefined;

    const invocations = await listInvocationsAsync({
      status,
      conversationId,
    });
    return c.json({ data: invocations }, 200);
  });

  app.get("/api/v1/invocations/:id", async (c) => {
    const invocationId = c.req.param("id");
    const invocation = await getInvocationByIdAsync(invocationId);
    if (!invocation) {
      return c.json({ error: { code: "invocation_not_found", message: "Invocation not found" } }, 404);
    }

    return c.json({ data: invocation }, 200);
  });

  app.get("/api/v1/review-queue", async (c) => {
    const trustedActor = c.get(ACTOR_CONTEXT_KEY) as ActorContext | undefined;
    const actorId = trustedActor?.fromTrustedSource ? trustedActor.id : c.req.query("actor_id")?.trim();
    if (!actorId || actorId === "") {
      return c.json(
        { error: { code: "actor_id_required", message: "X-Actor-Id header or query actor_id is required" } },
        400,
      );
    }
    const queue = await listInvocationsAsync({ status: "pending_confirmation" });
    const items = [];
    for (const invocation of queue) {
      const deniedDecision = await getDeniedDecisionAsync(invocation.id);
      if (deniedDecision) {
        continue;
      }
      items.push({
        invocation_id: invocation.id,
        conversation_id: invocation.conversation_id,
        agent_id: invocation.agent_id,
        requester_id: invocation.requester_id,
        status: invocation.status,
        created_at: invocation.created_at,
      });
    }
    return c.json({ data: items }, 200);
  });

  app.post("/api/v1/review-queue/:invocationId/approve", async (c) => {
    const invocationId = c.req.param("invocationId");
    const payload = reviewQueueApproveSchema.parse(await c.req.json());
    const trustedActor = c.get(ACTOR_CONTEXT_KEY) as ActorContext | undefined;
    if (trustedActor?.fromTrustedSource && trustedActor.id !== payload.approver_id) {
      return forbiddenResponse(c, "Approver identity must match the authenticated actor.");
    }
    const invocation = await getInvocationByIdAsync(invocationId);
    if (!invocation) {
      return c.json({ error: { code: "invocation_not_found", message: "Invocation not found" } }, 404);
    }

    const deniedDecision = await getDeniedDecisionAsync(invocationId);
    if (deniedDecision) {
      return c.json(
        {
          data: deniedDecision,
          meta: {
            idempotent: true,
          },
        },
        200,
      );
    }

    if (invocation.status === "completed") {
      return c.json(
        {
          data: {
            invocation_id: invocation.id,
            status: invocation.status,
          },
          meta: {
            idempotent: true,
          },
        },
        200,
      );
    }

    const delegated = await app.request(`/api/v1/invocations/${invocationId}/confirm`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ approver_id: payload.approver_id }),
    });
    const delegatedBody = await delegated.json();
    return c.json(delegatedBody, delegated.status as 200 | 400 | 404 | 409 | 422 | 502);
  });

  app.post("/api/v1/review-queue/:invocationId/deny", async (c) => {
    const invocationId = c.req.param("invocationId");
    const payload = reviewQueueDenySchema.parse(await c.req.json());
    const trustedActor = c.get(ACTOR_CONTEXT_KEY) as ActorContext | undefined;
    if (trustedActor?.fromTrustedSource && trustedActor.id !== payload.approver_id) {
      return forbiddenResponse(c, "Approver identity must match the authenticated actor.");
    }
    const invocation = await getInvocationByIdAsync(invocationId);
    if (!invocation) {
      return c.json({ error: { code: "invocation_not_found", message: "Invocation not found" } }, 404);
    }

    const existingDenied = await getDeniedDecisionAsync(invocationId);
    if (existingDenied) {
      return c.json(
        {
          data: existingDenied,
          meta: {
            idempotent: true,
          },
        },
        200,
      );
    }

    if (invocation.status === "completed") {
      return c.json(
        {
          error: {
            code: "invocation_not_actionable",
            message: "Invocation already completed",
          },
        },
        409,
      );
    }

    const denied = await denyInvocationAsync({
      invocationId,
      approverId: payload.approver_id,
      reason: payload.reason,
    });
    await emitAuditEventAsync({
      eventType: "invocation.denied_by_reviewer",
      conversationId: invocation.conversation_id,
      agentId: invocation.agent_id,
      actorType: "user",
      actorId: payload.approver_id,
      payload: {
        invocation_id: invocation.id,
        reason: payload.reason ?? "not_provided",
      },
      correlationId: randomUUID(),
    });
    return c.json({ data: denied, meta: { idempotent: false } }, 200);
  });

  app.post("/api/v1/review-queue/:invocationId/ask-more-info", async (c) => {
    const invocationId = c.req.param("invocationId");
    const payload = reviewQueueAskMoreInfoSchema.parse(await c.req.json());
    const trustedActor = c.get(ACTOR_CONTEXT_KEY) as ActorContext | undefined;
    if (trustedActor?.fromTrustedSource && trustedActor.id !== payload.approver_id) {
      return forbiddenResponse(c, "Approver identity must match the authenticated actor.");
    }
    const invocation = await getInvocationByIdAsync(invocationId);
    if (!invocation) {
      return c.json({ error: { code: "invocation_not_found", message: "Invocation not found" } }, 404);
    }
    await emitAuditEventAsync({
      eventType: "invocation.ask_more_info",
      conversationId: invocation.conversation_id,
      agentId: invocation.agent_id,
      actorType: "user",
      actorId: payload.approver_id,
      payload: {
        invocation_id: invocation.id,
        question: payload.question,
      },
      correlationId: randomUUID(),
    });
    return c.json(
      {
        data: {
          invocation_id: invocation.id,
          status: invocation.status,
          action: "ask_more_info",
          question: payload.question,
        },
      },
      200,
    );
  });

  app.post("/api/v1/review-queue/:invocationId/delegate", async (c) => {
    const invocationId = c.req.param("invocationId");
    const payload = reviewQueueDelegateSchema.parse(await c.req.json());
    const trustedActor = c.get(ACTOR_CONTEXT_KEY) as ActorContext | undefined;
    if (trustedActor?.fromTrustedSource && trustedActor.id !== payload.approver_id) {
      return forbiddenResponse(c, "Approver identity must match the authenticated actor.");
    }
    const invocation = await getInvocationByIdAsync(invocationId);
    if (!invocation) {
      return c.json({ error: { code: "invocation_not_found", message: "Invocation not found" } }, 404);
    }
    await emitAuditEventAsync({
      eventType: "invocation.delegated",
      conversationId: invocation.conversation_id,
      agentId: invocation.agent_id,
      actorType: "user",
      actorId: payload.approver_id,
      payload: {
        invocation_id: invocation.id,
        delegate_to: payload.delegate_to,
      },
      correlationId: randomUUID(),
    });
    return c.json(
      {
        data: {
          invocation_id: invocation.id,
          status: invocation.status,
          action: "delegate",
          delegate_to: payload.delegate_to,
        },
      },
      200,
    );
  });

  // T-5.5 Risk confirmation (approvals) API
  app.get("/api/v1/approvals", async (c) => {
    const conversationId = c.req.query("conversation_id")?.trim() || undefined;
    const data = await listApprovalsAsync({ conversation_id: conversationId });
    return c.json({ data }, 200);
  });

  app.get("/api/v1/approvals/:id", async (c) => {
    const approvalId = c.req.param("id");
    const detail = await getApprovalDetailAsync(approvalId);
    if (!detail) {
      return c.json(
        { error: { code: "approval_not_found", message: "Approval not found" } },
        404,
      );
    }
    return c.json({ data: detail }, 200);
  });

  app.post("/api/v1/approvals/:id/confirm", async (c) => {
    const approvalId = c.req.param("id");
    const payload = approvalConfirmSchema.parse(await c.req.json());
    const invocation = await getInvocationByIdAsync(approvalId);
    if (!invocation) {
      return c.json(
        { error: { code: "approval_not_found", message: "Approval not found" } },
        404,
      );
    }
    const delegated = await app.request(`/api/v1/invocations/${approvalId}/confirm`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ approver_id: payload.approver_id }),
    });
    const delegatedBody = await delegated.json();
    return c.json(delegatedBody, delegated.status as 200 | 400 | 404 | 409 | 422 | 502);
  });

  app.post("/api/v1/approvals/:id/reject", async (c) => {
    const approvalId = c.req.param("id");
    const payload = approvalRejectSchema.parse(await c.req.json());
    const invocation = await getInvocationByIdAsync(approvalId);
    if (!invocation) {
      return c.json(
        { error: { code: "approval_not_found", message: "Approval not found" } },
        404,
      );
    }
    const existingDenied = await getDeniedDecisionAsync(approvalId);
    if (existingDenied) {
      return c.json(
        { data: existingDenied, meta: { idempotent: true } },
        200,
      );
    }
    if (invocation.status === "completed") {
      return c.json(
        {
          error: {
            code: "invocation_not_actionable",
            message: "Invocation already completed",
          },
        },
        409,
      );
    }
    const denied = await denyInvocationAsync({
      invocationId: approvalId,
      approverId: payload.approver_id,
      reason: payload.reason,
    });
    await emitAuditEventAsync({
      eventType: "invocation.denied_by_reviewer",
      conversationId: invocation.conversation_id,
      agentId: invocation.agent_id,
      actorType: "user",
      actorId: payload.approver_id,
      payload: {
        invocation_id: invocation.id,
        reason: payload.reason ?? "not_provided",
      },
      correlationId: randomUUID(),
    });
    return c.json({ data: denied, meta: { idempotent: false } }, 200);
  });

  app.get("/api/v1/approvals/:id/chain", async (c) => {
    const approvalId = c.req.param("id");
    const invocation = await getInvocationByIdAsync(approvalId);
    if (!invocation) {
      return c.json(
        { error: { code: "approval_not_found", message: "Approval not found" } },
        404,
      );
    }
    const data = await getApprovalChainAsync(approvalId);
    return c.json({ data }, 200);
  });

  app.get("/api/v1/reputation/agents/:id", async (c) => {
    const agentId = c.req.param("id");
    const agent = await getAgentByIdAsync(agentId);
    if (!agent) {
      return c.json({ error: { code: "agent_not_found", message: "Agent not found" } }, 404);
    }

    const events = (await listAuditEventsAsync({ agentId, limit: 5000 })).data;
    const eventCounts = {
      completed: events.filter((event) => event.event_type === "invocation.completed").length,
      failed: events.filter((event) => event.event_type === "invocation.failed").length,
      denied: events.filter((event) => event.event_type === "invocation.denied").length,
      need_confirmation: events.filter((event) => event.event_type === "invocation.need_confirmation").length,
    };

    const rawScore =
      60 +
      eventCounts.completed * 8 -
      eventCounts.failed * 12 -
      eventCounts.denied * 10 -
      eventCounts.need_confirmation * 2;
    const score = Math.max(0, Math.min(100, rawScore));
    const grade = score >= 85 ? "A" : score >= 70 ? "B" : score >= 55 ? "C" : "D";
    const feedbackSummary = await getAgentFeedbackSummaryAsync(agentId);
    return c.json(
      {
        data: {
          agent_id: agentId,
          score,
          grade,
          event_counts: eventCounts,
          structured_feedback_summary: {
            valid_feedback_count: feedbackSummary.valid_feedback_count,
            quality_avg: feedbackSummary.quality_avg,
            speed_avg: feedbackSummary.speed_avg,
            stability_avg: feedbackSummary.stability_avg,
            meets_expectation_avg: feedbackSummary.meets_expectation_avg,
            abuse_flagged_count: feedbackSummary.abuse_flagged_count,
          },
        },
      },
      200,
    );
  });

  app.post("/api/v1/feedback/agent-runs", async (c) => {
    const payload = agentRunFeedbackSchema.parse(await c.req.json());
    const { feedback, accepted } = await submitAgentRunFeedbackAsync({
      ask_run_id: payload.ask_run_id,
      agent_id: payload.agent_id,
      quality: payload.quality,
      speed: payload.speed,
      stability: payload.stability,
      meets_expectation: payload.meets_expectation,
    });
    return c.json(
      {
        data: {
          feedback_id: feedback.id,
          ask_run_id: feedback.ask_run_id,
          agent_id: feedback.agent_id,
          accepted,
        },
      },
      accepted ? 201 : 200,
    );
  });

  app.get("/api/v1/audit-events", async (c) => {
    const parsed = auditEventsQuerySchema.safeParse({
      event_type: c.req.query("event_type"),
      conversation_id: c.req.query("conversation_id"),
      agent_id: c.req.query("agent_id"),
      actor_type: c.req.query("actor_type"),
      from: c.req.query("from"),
      to: c.req.query("to"),
      cursor: c.req.query("cursor"),
      limit: c.req.query("limit"),
    });
    if (!parsed.success) {
      return c.json(
        {
          error: {
            code: "invalid_audit_events_query",
            message: "Invalid audit events query",
          },
        },
        400,
      );
    }

    const {
      event_type: eventType,
      conversation_id: conversationId,
      agent_id: agentId,
      actor_type: actorType,
      from,
      to,
      cursor,
      limit,
    } = parsed.data;
    const result = await listAuditEventsAsync({
      eventType,
      conversationId,
      agentId,
      actorType,
      from,
      to,
      cursor,
      limit,
    });

    return new Response(JSON.stringify({ data: result.data, meta: { next_cursor: result.nextCursor } }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  });

  app.get("/api/v1/audit/timeline", async (c) => {
    const parsed = auditTimelineQuerySchema.safeParse({
      conversation_id: c.req.query("conversation_id"),
      agent_id: c.req.query("agent_id"),
      from: c.req.query("from"),
      to: c.req.query("to"),
      cursor: c.req.query("cursor"),
      limit: c.req.query("limit"),
      sort: c.req.query("sort"),
    });
    if (!parsed.success) {
      return c.json(
        {
          error: {
            code: "invalid_audit_timeline_query",
            message: "Invalid audit timeline query",
          },
        },
        400,
      );
    }

    const {
      conversation_id: conversationId,
      agent_id: agentId,
      from,
      to,
      cursor,
      limit,
      sort,
    } = parsed.data;
    const sortOrder = sort === "created_at:asc" ? "asc" : "desc";
    const result = await listAuditEventsAsync({
      conversationId,
      agentId,
      from,
      to,
      cursor,
      limit,
      sortOrder,
    });

    return c.json({ data: result.data, meta: { next_cursor: result.nextCursor } }, 200);
  });

  app.get("/api/v1/audit/events/:id", async (c) => {
    const eventId = c.req.param("id");
    const event = await getAuditEventByIdAsync(eventId);

    if (!event) {
      return c.json(
        { error: { code: "audit_event_not_found", message: "Audit event not found" } },
        404,
      );
    }

    return c.json({ data: event }, 200);
  });

  app.get("/api/v1/security/injection-alerts", async (c) => {
    const parsed = injectionAlertsQuerySchema.safeParse({
      conversation_id: c.req.query("conversation_id"),
      limit: c.req.query("limit"),
    });
    if (!parsed.success) {
      return c.json(
        {
          error: {
            code: "invalid_injection_alerts_query",
            message: "Invalid injection alerts query",
          },
        },
        400,
      );
    }

    const events = (
      await listAuditEventsAsync({
        eventType: "boundary.denied",
        conversationId: parsed.data.conversation_id,
        limit: parsed.data.limit ?? 50,
      })
    ).data;
    const items = events.map((event) => ({
      event_id: event.id,
      event_type: event.event_type,
      conversation_id: event.conversation_id,
      actor_id: event.actor_id,
      reason_codes: Array.isArray(event.payload.reason_codes) ? event.payload.reason_codes : [],
      stage: event.payload.stage,
      created_at: event.created_at,
    }));
    return c.json({ data: { total: items.length, items } }, 200);
  });

  app.get("/api/v1/receipts/:id", async (c) => {
    const receiptId = c.req.param("id");
    const receipt = await getReceiptByIdAsync(receiptId);

    if (!receipt) {
      return c.json({ error: { code: "receipt_not_found", message: "Receipt not found" } }, 404);
    }

    return c.json(
      {
        data: receipt,
        meta: {
          is_valid: await verifyReceiptAsync(receipt),
        },
      },
      200,
    );
  });

  app.get("/api/v1/receipts/:id/verify", async (c) => {
    const receiptId = c.req.param("id");
    const receipt = await getReceiptByIdAsync(receiptId);

    if (!receipt) {
      return c.json({ error: { code: "receipt_not_found", message: "Receipt not found" } }, 404);
    }

    const is_valid = await verifyReceiptAsync(receipt);
    return c.json({ data: { receipt_id: receiptId, is_valid } }, 200);
  });

  app.post("/api/v1/nodes/register", async (c) => {
    const payload = registerNodeSchema.parse(await c.req.json());
    const node = await registerNodeAsync(payload);
    return c.json({ data: node }, 201);
  });

  app.post("/api/v1/nodes/heartbeat", async (c) => {
    const payload = heartbeatNodeSchema.parse(await c.req.json());
    const node = await heartbeatNodeAsync(payload.node_id);
    if (!node) {
      return c.json({ error: { code: "node_not_found", message: "Node not found" } }, 404);
    }

    return c.json({ data: node }, 200);
  });

  app.get("/api/v1/nodes", async () => {
    return new Response(JSON.stringify({ data: await listNodesAsync() }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  });

  app.post("/api/v1/nodes/relay/invoke", async (c) => {
    const payload = relayInvokeSchema.parse(await c.req.json());
    const node = await getNodeByNodeIdAsync(payload.node_id);
    if (!node) {
      return c.json({ error: { code: "node_not_found", message: "Node not found" } }, 404);
    }

    const staleAfterSec = payload.stale_after_sec ?? 30;
    const lagMs = Date.now() - Date.parse(node.last_heartbeat);
    if (lagMs > staleAfterSec * 1000) {
      return c.json(
        {
          error: {
            code: "node_unavailable",
            message: "Node is considered offline due to stale heartbeat",
            details: {
              node_id: payload.node_id,
              heartbeat_lag_ms: lagMs,
              stale_after_sec: staleAfterSec,
              retry_after_sec: 3,
            },
          },
        },
        503,
      );
    }

    const agent = await getAgentByIdAsync(payload.agent_id);
    if (!agent) {
      return c.json({ error: { code: "agent_not_found", message: "Agent not found" } }, 404);
    }

    if (agent.node_id !== payload.node_id) {
      return c.json(
        {
          error: {
            code: "agent_node_mismatch",
            message: "Agent does not belong to the specified node",
          },
        },
        400,
      );
    }

    const maxRetry = payload.retry_max ?? 1;
    let lastResponse: Response | null = null;
    for (let attempt = 0; attempt <= maxRetry; attempt += 1) {
      lastResponse = await app.request(`/api/v1/conversations/${payload.conversation_id}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sender_id: payload.sender_id,
          text: payload.text,
          thread_id: payload.thread_id,
          mentions: payload.mentions,
          target_agent_ids: [payload.agent_id],
        }),
      });

      if (lastResponse.status !== 502) {
        break;
      }
    }

    if (!lastResponse) {
      return c.json({ error: { code: "relay_failed", message: "Relay invocation failed" } }, 502);
    }
    const body = await lastResponse.json();
    return c.json(body, lastResponse.status as 200 | 201 | 202 | 400 | 403 | 404 | 409 | 502);
  });

  app.post("/api/v1/nodes/sync-directory", async (c) => {
    const payload = syncNodeDirectorySchema.parse(await c.req.json());
    const node = await getNodeByNodeIdAsync(payload.node_id);
    if (!node) {
      return c.json({ error: { code: "node_not_found", message: "Node not found" } }, 404);
    }

    const syncedAgents: Agent[] = [];
    for (const agent of payload.agents) {
      const synced = await upsertAgentFromNodeAsync(payload.node_id, {
        ...agent,
        source_origin: "connected_node",
        node_id: payload.node_id,
      });
      syncedAgents.push(synced);
    }

    return c.json(
      {
        data: {
          node_id: payload.node_id,
          synced_count: syncedAgents.length,
          agents: syncedAgents,
        },
      },
      200,
    );
  });

  app.get("/api/v1/metrics", async () => {
    return new Response(JSON.stringify({ data: await getPhase0Metrics() }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  });

  app.get("/api/v1/nodes/compatibility", async (c) => {
    return c.json(
      {
        data: {
          node_protocol_min: "1.0.0",
          node_protocol_recommended: "1.1.0",
          supported_node_status: ["online", "degraded", "offline"],
        },
      },
      200,
    );
  });

  app.post("/api/v1/nodes/connection-wizard/validate", async (c) => {
    const payload = nodeConnectionWizardValidateSchema.parse(await c.req.json());
    const minVersion = "1.0.0";
    const recommendedVersion = "1.1.0";
    const isHttps = payload.endpoint.startsWith("https://");
    const compareWithMin = compareSemver(payload.node_protocol_version, minVersion);
    const compareWithRecommended = compareSemver(payload.node_protocol_version, recommendedVersion);

    if (!isHttps || compareWithMin < 0) {
      return c.json(
        {
          error: {
            code: "node_connection_invalid",
            message: "Node connection does not meet minimal compatibility requirements",
            details: {
              requires_https: true,
              node_protocol_min: minVersion,
              provided_protocol: payload.node_protocol_version,
            },
          },
        },
        400,
      );
    }

    return c.json(
      {
        data: {
          compatibility: compareWithRecommended >= 0 ? "compatible" : "compatible_with_warning",
          node_protocol_min: minVersion,
          node_protocol_recommended: recommendedVersion,
          endpoint: payload.endpoint,
        },
      },
      200,
    );
  });

  app.get("/api/v1/nodes/health", async (c) => {
    const parsed = nodesHealthQuerySchema.safeParse({
      stale_after_sec: c.req.query("stale_after_sec"),
    });
    if (!parsed.success) {
      return c.json(
        {
          error: {
            code: "invalid_nodes_health_query",
            message: "Invalid nodes health query",
          },
        },
        400,
      );
    }
    const staleAfterSec = parsed.data.stale_after_sec ?? 30;
    const staleAfterMs = staleAfterSec * 1000;
    const now = Date.now();

    const nodes = await listNodesAsync();
    const computed = nodes.map((node) => {
      const heartbeatTs = Date.parse(node.last_heartbeat);
      const lagMs = Number.isFinite(heartbeatTs) ? Math.max(0, now - heartbeatTs) : Number.POSITIVE_INFINITY;
      const healthStatus = lagMs > staleAfterMs ? "offline" : node.status;
      return {
        node_id: node.node_id,
        status: healthStatus,
        heartbeat_lag_ms: lagMs,
        endpoint: node.endpoint,
      };
    });

    const summary = {
      total: computed.length,
      online: computed.filter((node) => node.status === "online").length,
      degraded: computed.filter((node) => node.status === "degraded").length,
      offline: computed.filter((node) => node.status === "offline").length,
    };

    return c.json(
      {
        data: {
          stale_after_sec: staleAfterSec,
          summary,
          nodes: computed,
        },
      },
      200,
    );
  });

  app.get("/api/v1/usage/counters", async (c) => {
    const parsed = usageCountersQuerySchema.safeParse({
      actor_id: c.req.query("actor_id"),
      window_days: c.req.query("window_days"),
    });
    if (!parsed.success) {
      return c.json(
        {
          error: {
            code: "invalid_usage_counters_query",
            message: "Invalid usage counters query",
          },
        },
        400,
      );
    }

    const actorId = parsed.data.actor_id;
    const windowDays = parsed.data.window_days ?? 30;
    const from = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

    const events = (await listAuditEventsAsync({ from, limit: 5000 })).data;
    const actorEvents = actorId ? events.filter((event) => event.actor_id === actorId) : events;

    const invocationEvents = actorEvents.filter((event) => event.event_type.startsWith("invocation."));
    const eventTypeCounts = actorEvents.reduce<Record<string, number>>((acc, event) => {
      acc[event.event_type] = (acc[event.event_type] ?? 0) + 1;
      return acc;
    }, {});
    return c.json(
      {
        data: {
          actor_id: actorId ?? null,
          window_days: windowDays,
          window_from: from,
          invocation_events_total: invocationEvents.length,
          audit_events_total: actorEvents.length,
          event_type_counts: eventTypeCounts,
        },
      },
      200,
    );
  });

  app.get("/api/v1/usage/limits", async (c) => {
    const parsed = usageLimitsQuerySchema.safeParse({
      actor_id: c.req.query("actor_id"),
      feature: c.req.query("feature"),
    });
    if (!parsed.success) {
      return c.json(
        {
          error: {
            code: "invalid_usage_limits_query",
            message: "Invalid usage limits query",
          },
        },
        400,
      );
    }

    const quota = await getQuotaStatusAsync(parsed.data.actor_id, parsed.data.feature);
    return c.json({ data: quota }, 200);
  });

  app.get("/api/v1/usage/task-billing-summary", async (c) => {
    const parsed = taskBillingSummaryQuerySchema.safeParse({
      actor_id: c.req.query("actor_id"),
      window_days: c.req.query("window_days"),
    });
    if (!parsed.success) {
      return c.json(
        {
          error: {
            code: "invalid_task_billing_summary_query",
            message: "Invalid task billing summary query",
          },
        },
        400,
      );
    }
    const windowDays = parsed.data.window_days ?? 30;
    const from = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();
    const events = (await listAuditEventsAsync({ from, limit: 5000 })).data.filter(
      (event) => event.actor_id === parsed.data.actor_id,
    );
    const completed = events.filter((event) => event.event_type === "user_task.run.completed").length;
    const failed = events.filter((event) => event.event_type === "user_task.run.failed").length;
    const billableTaskRuns = completed;
    const unitPriceUsd = 0.05;
    const totalEstimatedUsd = Number((billableTaskRuns * unitPriceUsd).toFixed(4));
    const billableItems = events
      .filter((event) => event.event_type === "user_task.run.completed")
      .map((event) => ({
        event_id: event.id,
        run_id: typeof event.payload.run_id === "string" ? event.payload.run_id : null,
        task_instance_id:
          typeof event.payload.task_instance_id === "string" ? event.payload.task_instance_id : null,
        amount_usd: unitPriceUsd,
        occurred_at: event.created_at,
      }));
    const quota = await getQuotaStatusAsync(parsed.data.actor_id, "subscription_task_runs");
    return c.json(
      {
        data: {
          actor_id: parsed.data.actor_id,
          window_days: windowDays,
          window_from: from,
          task_runs_completed: completed,
          task_runs_failed: failed,
          billable_task_runs: billableTaskRuns,
          unit_price_usd: unitPriceUsd,
          total_estimated_usd: totalEstimatedUsd,
          billable_items: billableItems,
          quota,
        },
      },
      200,
    );
  });

  app.get("/api/v1/deploy/templates", async (c) => {
    const templates = await listDeployTemplatesAsync();
    return c.json({ data: templates }, 200);
  });

  app.post("/api/v1/deploy/templates/:templateId/instantiate", async (c) => {
    const templateId = c.req.param("templateId");
    const payload = instantiateTemplateSchema.parse(await c.req.json());
    const template = await getDeployTemplateByIdAsync(templateId);
    if (!template) {
      return c.json({ error: { code: "template_not_found", message: "Template not found" } }, 404);
    }

    if (template.min_plan !== "free") {
      return c.json(
        {
          error: {
            code: "plan_upgrade_required",
            message: "Template requires plan upgrade",
            details: {
              min_plan: template.min_plan,
              upgrade_hint: "Upgrade to Pro to instantiate this template.",
            },
          },
        },
        403,
      );
    }

    const quotaBeforeConsume = await getQuotaStatusAsync(payload.actor_id, "agent_deployments");
    if (!quotaBeforeConsume.allowed) {
      return c.json(
        {
          error: {
            code: "quota_exceeded",
            message: "Free-tier deployment quota exceeded",
            details: {
              feature: quotaBeforeConsume.feature,
              used: quotaBeforeConsume.used,
              limit: quotaBeforeConsume.limit,
              remaining: quotaBeforeConsume.remaining,
              upgrade_hint: quotaBeforeConsume.upgrade_hint,
            },
          },
        },
        429,
      );
    }

    const quota = await consumeQuotaAsync({
      actorId: payload.actor_id,
      feature: "agent_deployments",
      units: 1,
    });

    const deployment = await instantiateTemplateAsync({
      templateId,
      actorId: payload.actor_id,
      agentName: payload.agent_name,
    });
    return c.json(
      {
        data: deployment,
        meta: {
          usage: quota,
        },
      },
      201,
    );
  });

  app.post("/api/v1/deployments/:deploymentId/activate", async (c) => {
    const deploymentId = c.req.param("deploymentId");
    const payload = activateDeploymentSchema.parse(await c.req.json());
    const deployment = await getDeploymentByIdAsync(deploymentId);
    if (!deployment) {
      return c.json({ error: { code: "deployment_not_found", message: "Deployment not found" } }, 404);
    }
    if (deployment.actor_id !== payload.actor_id) {
      return c.json({ error: { code: "deployment_actor_mismatch", message: "Deployment actor mismatch" } }, 403);
    }

    if (deployment.status === "ready" && deployment.activated_agent_id) {
      const existingAgent = await getAgentByIdAsync(deployment.activated_agent_id);
      if (!existingAgent) {
        return c.json({ error: { code: "agent_not_found", message: "Agent not found" } }, 404);
      }
      return c.json(
        {
          data: {
            deployment_id: deployment.id,
            status: deployment.status,
            agent: existingAgent,
          },
          meta: { idempotent: true },
        },
        200,
      );
    }

    const activatedAgent = await registerAgentAsync({
      name: deployment.agent_name,
      description: `Activated from template ${deployment.template_id}`,
      agent_type: "execution",
      source_url: `mock://deployment-${deployment.id}`,
      capabilities: [{ name: "chat_assistant", risk_level: "low" }],
      source_origin: "self_hosted",
      status: "active",
    });
    const readyDeployment = await markDeploymentReadyAsync(deployment.id, activatedAgent.id);
    if (!readyDeployment) {
      return c.json({ error: { code: "deployment_not_found", message: "Deployment not found" } }, 404);
    }

    return c.json(
      {
        data: {
          deployment_id: readyDeployment.id,
          status: readyDeployment.status,
          agent: activatedAgent,
        },
        meta: { idempotent: false },
      },
      201,
    );
  });

  app.get("/api/v1/public/overview", async (c) => {
    const metrics = await getPhase0Metrics();
    return c.json(
      {
        data: {
          weekly_trusted_invocations: metrics.weekly_trusted_invocations,
          connected_nodes_total: metrics.connected_nodes_total,
          conversations_active_total: metrics.conversations_active_total,
          go_no_go: metrics.go_no_go,
        },
      },
      200,
    );
  });

  app.get("/api/v1/public/entry-metrics", async (c) => {
    const metrics = await getPhase0Metrics();
    const eventRows = (
      await listAuditEventsAsync({
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        limit: 5000,
      })
    ).data.filter((event) => event.event_type.startsWith("entry."));

    const totals: Record<string, number> = {};
    const localeBreakdown: Record<string, Record<string, number>> = {
      en: {},
      "zh-Hant": {},
      "zh-Hans": {},
    };
    for (const event of eventRows) {
      const eventName = event.event_type.replace("entry.", "");
      totals[eventName] = (totals[eventName] ?? 0) + 1;
      const locale = (event.payload.locale as string | undefined) ?? "en";
      if (!localeBreakdown[locale]) {
        localeBreakdown[locale] = {};
      }
      localeBreakdown[locale][eventName] = (localeBreakdown[locale][eventName] ?? 0) + 1;
    }

    const startBuildingCtaClicks = eventRows.filter(
      (event) => event.event_type === "entry.cta_click" && event.payload.cta_id === "start_building",
    ).length;
    const pageViewHomeTotal = eventRows.filter(
      (event) =>
        event.event_type === "entry.page_view" &&
        (event.payload.page === "home" ||
          event.payload.page === "/en" ||
          event.payload.page === "/zh-Hant" ||
          event.payload.page === "/zh-Hans"),
    ).length;

    return c.json(
      {
        data: {
          locales_supported: ["en", "zh-Hant", "zh-Hans"],
          weekly_trusted_invocations: metrics.weekly_trusted_invocations,
          first_session_success_rate: metrics.first_session_success_rate,
          connected_nodes_total: metrics.connected_nodes_total,
          conversion_baseline: {
            page_view_home: pageViewHomeTotal,
            cta_click_start_building: startBuildingCtaClicks,
            docs_click: totals.docs_click ?? 0,
            waitlist_submit: totals.waitlist_submit ?? 0,
            demo_submit: totals.demo_submit ?? 0,
          },
          locale_breakdown: localeBreakdown,
        },
      },
      200,
    );
  });

  app.post("/api/v1/public/entry-events", async (c) => {
    const rawBody = await c.req.json().catch(() => null);
    const parsed = publicEntryEventSchema.safeParse(rawBody);
    if (!parsed.success) {
      return c.json(
        {
          error: {
            code: "invalid_public_entry_event",
            message: "Invalid public entry event payload",
          },
        },
        400,
      );
    }
    const payload = parsed.data;
    const eventType = `entry.${payload.event_name}`;
    const normalizedPayload = {
      ...payload,
      referrer: payload.referrer ?? "unknown",
      timestamp: payload.timestamp ?? new Date().toISOString(),
    };
    await emitAuditEventAsync({
      eventType,
      actorType: "user",
      actorId: "public-entry",
      payload: normalizedPayload,
      correlationId: randomUUID(),
    });
    return c.json({ data: { accepted: true, event_type: eventType } }, 202);
  });

  app.get("/api/v1/meta", async (c) => {
    return c.json(
      {
        data: {
          api_version: "v1",
          trust_policy_version: "trust-policy-v1",
          node_protocol: {
            min: "1.0.0",
            recommended: "1.1.0",
          },
          quickstart_endpoints: [
            "POST /api/v1/conversations",
            "POST /api/v1/agents",
            "POST /api/v1/conversations/:id/agents",
            "POST /api/v1/conversations/:id/messages",
            "GET /api/v1/metrics",
          ],
          features: [
            "multi_agent_targeting",
            "review_queue",
            "node_directory_sync",
            "receipt_signature_verification",
          ],
        },
      },
      200,
    );
  });

  registerAuthRoutes(app);

  return app;
};
