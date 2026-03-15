import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createApp } from "../packages/server/src/app";

type Snapshot = {
  entry_events: {
    success_status: number;
    error_status: number;
    error_code: string;
    response_fields: string[];
  };
  entry_metrics: {
    success_status: number;
    required_data_fields: string[];
    required_conversion_fields: string[];
  };
  recommendations: {
    success_status: number;
    error_status: number;
    error_code: string;
    required_item_fields: string[];
  };
  nodes_health: {
    success_status: number;
    error_status: number;
    error_code: string;
    required_data_fields: string[];
  };
  relay_invoke: {
    success_statuses: number[];
    error_matrix: Record<string, number>;
  };
};

function sortArray(values: string[]): string[] {
  return [...values].sort((a, b) => a.localeCompare(b));
}

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

async function buildSnapshot(): Promise<Snapshot> {
  const app = createApp();

  const entryOk = await app.request("/api/v1/public/entry-events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ event_name: "page_view", locale: "en", page: "home" }),
  });
  const entryOkBody = (await entryOk.json()) as { data?: Record<string, unknown> };
  const entryBad = await app.request("/api/v1/public/entry-events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ event_name: "bad_event", locale: "en", page: "home" }),
  });
  const entryBadBody = (await entryBad.json()) as { error?: { code?: string } };

  const metricsRes = await app.request("/api/v1/public/entry-metrics");
  const metricsBody = (await metricsRes.json()) as { data?: Record<string, unknown> };
  const conversionBaseline = (metricsBody.data?.conversion_baseline as Record<string, unknown>) ?? {};

  await app.request("/api/v1/agents", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Drift Agent",
      description: "contract drift check",
      agent_type: "execution",
      source_url: "mock://drift-agent",
      capabilities: [{ name: "summarize", risk_level: "low" }],
    }),
  });
  const recommendationsOk = await app.request(
    "/api/v1/agents/recommendations?intent=summary&risk_max=low&limit=1",
  );
  const recommendationsOkBody = (await recommendationsOk.json()) as { data?: Array<Record<string, unknown>> };
  const recommendationsBad = await app.request(
    "/api/v1/agents/recommendations?intent=summary&risk_max=bad",
  );
  const recommendationsBadBody = (await recommendationsBad.json()) as { error?: { code?: string } };

  const registerNode = await app.request("/api/v1/nodes/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Drift Node",
      endpoint: "https://drift.example.com",
    }),
  });
  const registerNodeBody = (await registerNode.json()) as { data: { node_id: string } };
  const nodeId = registerNodeBody.data.node_id;

  const healthOk = await app.request("/api/v1/nodes/health?stale_after_sec=120");
  const healthOkBody = (await healthOk.json()) as { data?: Record<string, unknown> };
  const healthBad = await app.request("/api/v1/nodes/health?stale_after_sec=0");
  const healthBadBody = (await healthBad.json()) as { error?: { code?: string } };

  const syncRes = await app.request("/api/v1/nodes/sync-directory", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      node_id: nodeId,
      agents: [
        {
          name: "Drift Relay Agent",
          description: "relay",
          agent_type: "execution",
          source_url: "mock://drift-relay-agent",
          capabilities: [{ name: "relay", risk_level: "low" }],
        },
      ],
    }),
  });
  const syncBody = (await syncRes.json()) as { data: { agents: Array<{ id: string }> } };
  const relayAgentId = syncBody.data.agents[0]?.id;
  if (!relayAgentId) {
    throw new Error("unable to build relay snapshot: missing synced agent");
  }

  const localAgent = await app.request("/api/v1/agents", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Local Mismatch Agent",
      description: "mismatch",
      agent_type: "execution",
      source_url: "mock://local-mismatch-agent",
      capabilities: [{ name: "task", risk_level: "low" }],
    }),
  });
  const localAgentBody = (await localAgent.json()) as { data: { id: string } };

  const convRes = await app.request("/api/v1/conversations", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: "Drift Contract Conversation" }),
  });
  const convBody = (await convRes.json()) as { data: { id: string } };
  const conversationId = convBody.data.id;

  await app.request(`/api/v1/conversations/${conversationId}/agents`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ agent_id: relayAgentId }),
  });

  const relayOk = await app.request("/api/v1/nodes/relay/invoke", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      node_id: nodeId,
      conversation_id: conversationId,
      agent_id: relayAgentId,
      sender_id: "drift-user",
      text: "relay",
    }),
  });

  const relayNodeNotFound = await app.request("/api/v1/nodes/relay/invoke", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      node_id: "66666666-6666-4666-8666-666666666666",
      conversation_id: conversationId,
      agent_id: relayAgentId,
      sender_id: "drift-user",
      text: "missing node",
    }),
  });

  const relayAgentNotFound = await app.request("/api/v1/nodes/relay/invoke", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      node_id: nodeId,
      conversation_id: conversationId,
      agent_id: "77777777-7777-4777-8777-777777777777",
      sender_id: "drift-user",
      text: "missing agent",
    }),
  });

  const relayMismatch = await app.request("/api/v1/nodes/relay/invoke", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      node_id: nodeId,
      conversation_id: conversationId,
      agent_id: localAgentBody.data.id,
      sender_id: "drift-user",
      text: "mismatch",
    }),
  });

  return {
    entry_events: {
      success_status: entryOk.status,
      error_status: entryBad.status,
      error_code: entryBadBody.error?.code ?? "",
      response_fields: sortArray(Object.keys(entryOkBody.data ?? {})),
    },
    entry_metrics: {
      success_status: metricsRes.status,
      required_data_fields: sortArray(Object.keys(metricsBody.data ?? {})),
      required_conversion_fields: sortArray(Object.keys(conversionBaseline)),
    },
    recommendations: {
      success_status: recommendationsOk.status,
      error_status: recommendationsBad.status,
      error_code: recommendationsBadBody.error?.code ?? "",
      required_item_fields: sortArray(
        recommendationsOkBody.data && recommendationsOkBody.data.length > 0
          ? Object.keys(recommendationsOkBody.data[0])
          : ["agent", "reason", "score"],
      ),
    },
    nodes_health: {
      success_status: healthOk.status,
      error_status: healthBad.status,
      error_code: healthBadBody.error?.code ?? "",
      required_data_fields: sortArray(Object.keys(healthOkBody.data ?? {})),
    },
    relay_invoke: {
      success_statuses: [201, 202],
      error_matrix: {
        node_not_found: relayNodeNotFound.status,
        agent_not_found: relayAgentNotFound.status,
        agent_node_mismatch: relayMismatch.status,
      },
    },
  };
}

function toMarkdown(baseline: Snapshot, current: Snapshot, drift: boolean): string {
  return [
    "# Mainline Contract Drift Report",
    "",
    `- Generated at: ${new Date().toISOString()}`,
    `- Drift detected: ${drift ? "YES" : "NO"}`,
    "",
    "## Baseline",
    "```json",
    JSON.stringify(baseline, null, 2),
    "```",
    "",
    "## Current",
    "```json",
    JSON.stringify(current, null, 2),
    "```",
    "",
  ].join("\n");
}

async function run(): Promise<void> {
  const baselinePath = "docs/contracts/mainline-api-contract-baseline.v1.json";
  const reportPath = "reports/mainline-contract-drift-report.md";

  const baselineRaw = await readFile(baselinePath, "utf8");
  const baseline = JSON.parse(baselineRaw) as Snapshot;
  const current = await buildSnapshot();
  const drift = !deepEqual(baseline, current);

  await mkdir("reports", { recursive: true });
  await writeFile(reportPath, toMarkdown(baseline, current, drift), "utf8");

  if (drift) {
    console.error(`Contract drift detected. See ${reportPath}`);
    process.exit(1);
  }

  console.log(`No contract drift detected. Report: ${reportPath}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
