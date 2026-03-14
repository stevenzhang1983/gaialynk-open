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
