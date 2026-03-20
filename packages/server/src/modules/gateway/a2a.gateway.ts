import type { Agent } from "../directory/agent.store";

interface RequestAgentInput {
  conversationId: string;
  agent: Agent;
  userText: string;
}

interface A2AResponse {
  text: string;
}

interface JsonRpcResponse {
  result?: {
    output_text?: string;
    text?: string;
  };
  error?: {
    code: number;
    message: string;
  };
}

const getTimeoutMs = (): number => {
  const raw = process.env.A2A_REQUEST_TIMEOUT_MS;
  const parsed = raw ? Number(raw) : 8000;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 8000;
};

const HEALTH_CHECK_TIMEOUT_MS = 5000;

/** T-5.4: Check Agent endpoint reachability (A2A capabilities.list or HTTP reach). */
export const checkAgentHealth = async (sourceUrl: string): Promise<{ ok: boolean; error?: string }> => {
  if (sourceUrl.startsWith("mock://")) {
    return { ok: true };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);

  try {
    const response = await fetch(sourceUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "health-check",
        method: "capabilities.list",
        params: {},
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}` };
    }

    const payload = (await response.json()) as JsonRpcResponse;
    // Endpoint reachable; method not found is still "ok" for connectivity
    if (payload.error && payload.error.code === -32601) {
      return { ok: true };
    }
    if (payload.error) {
      return { ok: false, error: `A2A error ${payload.error.code}: ${payload.error.message}` };
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  } finally {
    clearTimeout(timeout);
  }
};

export const requestAgent = async (input: RequestAgentInput): Promise<A2AResponse> => {
  if (input.agent.source_url.startsWith("mock://")) {
    const responseText = `mocked A2A response from ${input.agent.name} for conversation ${input.conversationId}: ${input.userText}`;
    return { text: responseText };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getTimeoutMs());

  try {
    const response = await fetch(input.agent.source_url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: input.conversationId,
        method: "tasks.run",
        params: {
          user_content: [
            {
              type: "text",
              text: input.userText,
            },
          ],
          system_context: [
            {
              type: "text",
              text: `conversation_id:${input.conversationId}`,
            },
          ],
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`A2A endpoint returned HTTP ${response.status}`);
    }

    const payload = (await response.json()) as JsonRpcResponse;
    if (payload.error) {
      throw new Error(`A2A error ${payload.error.code}: ${payload.error.message}`);
    }

    const outputText = payload.result?.output_text ?? payload.result?.text;
    if (!outputText) {
      throw new Error("A2A response missing output text");
    }

    return { text: outputText };
  } finally {
    clearTimeout(timeout);
  }
};
