import { fileURLToPath } from "node:url";

type JsonRecord = Record<string, unknown>;

export const resolveSmokeBaseUrl = (env: NodeJS.ProcessEnv): string => {
  if (env.MAINLINE_BASE_URL && env.MAINLINE_BASE_URL.trim().length > 0) {
    return env.MAINLINE_BASE_URL;
  }
  const port = env.MAINLINE_SMOKE_PORT ?? "3011";
  return `http://localhost:${port}`;
};

const baseUrl = resolveSmokeBaseUrl(process.env);

async function requestJson(path: string, init?: RequestInit): Promise<{ status: number; body: JsonRecord }> {
  const response = await fetch(`${baseUrl}${path}`, init);
  const body = (await response.json().catch(() => ({}))) as JsonRecord;
  return { status: response.status, body };
}

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

async function run(): Promise<void> {
  const runId = `smoke-${Date.now()}`;

  const entryEvent = await requestJson("/api/v1/public/entry-events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      event_name: "page_view",
      locale: "en",
      page: "home",
      source: runId,
      referrer: "smoke",
    }),
  });
  assert(entryEvent.status === 202, "entry-events should return 202");

  const metrics = await requestJson("/api/v1/public/entry-metrics");
  assert(metrics.status === 200, "entry-metrics should return 200");

  const recommendations = await requestJson("/api/v1/agents/recommendations?intent=summary&risk_max=low&limit=1");
  assert(recommendations.status === 200, "recommendations should return 200");

  const badHealth = await requestJson("/api/v1/nodes/health?stale_after_sec=0");
  assert(badHealth.status === 400, "nodes health invalid query should return 400");

  const registerNode = await requestJson("/api/v1/nodes/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: `smoke-node-${runId}`,
      endpoint: `https://${runId}.example.com`,
    }),
  });
  assert(registerNode.status === 201, "node register should return 201");
  const nodeId = (registerNode.body.data as JsonRecord).node_id as string;

  const syncDirectory = await requestJson("/api/v1/nodes/sync-directory", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      node_id: nodeId,
      agents: [
        {
          name: `smoke-agent-${runId}`,
          description: "smoke relay agent",
          agent_type: "execution",
          source_url: "mock://smoke-relay-agent",
          capabilities: [{ name: "relay", risk_level: "low" }],
        },
      ],
    }),
  });
  assert(syncDirectory.status === 200, "sync-directory should return 200");
  const syncAgents = ((syncDirectory.body.data as JsonRecord).agents as JsonRecord[]) ?? [];
  assert(syncAgents.length > 0, "sync-directory should return at least one agent");
  const relayAgentId = syncAgents[0]?.id as string;

  const createConversation = await requestJson("/api/v1/conversations", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: `smoke-conv-${runId}` }),
  });
  assert(createConversation.status === 201, "conversation create should return 201");
  const conversationId = (createConversation.body.data as JsonRecord).id as string;

  const joinAgent = await requestJson(`/api/v1/conversations/${conversationId}/agents`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ agent_id: relayAgentId }),
  });
  assert(joinAgent.status === 201, "join agent should return 201");

  const relayInvoke = await requestJson("/api/v1/nodes/relay/invoke", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      node_id: nodeId,
      conversation_id: conversationId,
      agent_id: relayAgentId,
      sender_id: runId,
      text: "post-release smoke relay",
    }),
  });
  assert([201, 202].includes(relayInvoke.status), "relay invoke should return 201 or 202");

  const badRelay = await requestJson("/api/v1/nodes/relay/invoke", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      node_id: "55555555-5555-4555-8555-555555555555",
      conversation_id: conversationId,
      agent_id: relayAgentId,
      sender_id: runId,
      text: "missing node check",
    }),
  });
  assert(badRelay.status === 404, "relay missing node should return 404");

  console.log(JSON.stringify({ ok: true, baseUrl, runId }, null, 2));
}

const isDirectExecution = process.argv[1] === fileURLToPath(import.meta.url);
if (isDirectExecution) {
  run().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
