import type { Agent } from "../directory/agent.store";
import type { TopologyStepSpec } from "./orchestration.types";

const scoreAgent = (agent: Agent, text: string): number => {
  const q = text.toLowerCase();
  let score = 0;
  if (agent.name.toLowerCase().includes(q)) score += 3;
  if (agent.description.toLowerCase().includes(q)) score += 2;
  for (const capability of agent.capabilities) {
    if (capability.name.toLowerCase().includes(q)) score += 4;
  }
  return score;
};

const defaultStepSpec = (agent: Agent, stepIndex: number): TopologyStepSpec => {
  const capName = agent.capabilities[0]?.name ?? "general";
  return {
    agent_id: agent.id,
    capability_name: capName,
    expected_input: {
      template:
        stepIndex === 0
          ? "{{user_message}}"
          : "Prior agent structured output:\n{{prev}}\n\nOriginal user message:\n{{user_message}}",
      description: stepIndex === 0 ? "User request" : "Chained step input (V1.3 mapping is template-only)",
    },
    expected_output: { required_fields: ["text"] },
    field_mapping: stepIndex > 0 ? { prev: "prev" } : undefined,
  };
};

async function orderAgentIdsWithOpenAI(
  apiKey: string,
  userMessage: string,
  agents: Agent[],
): Promise<string[] | null> {
  const model = process.env.OPENAI_ORCHESTRATION_MODEL?.trim() || "gpt-4o-mini";
  const list = agents.map((a) => ({ id: a.id, name: a.name, capabilities: a.capabilities.map((c) => c.name) }));
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You order agent IDs for a linear multi-step workflow. Reply with JSON only: {\"order\":[\"uuid\",...]} using every id exactly once.",
        },
        {
          role: "user",
          content: `User message: ${userMessage}\nAgents: ${JSON.stringify(list)}`,
        },
      ],
    }),
  });
  if (!res.ok) return null;
  const body = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = body.choices?.[0]?.message?.content?.trim();
  if (!raw) return null;
  const parsed = JSON.parse(raw) as { order?: string[] };
  if (!Array.isArray(parsed.order) || parsed.order.length !== agents.length) return null;
  const set = new Set(agents.map((a) => a.id));
  for (const id of parsed.order) {
    if (!set.has(id)) return null;
  }
  return parsed.order;
}

/**
 * E-5 intent router: LLM ordering when OPENAI_API_KEY is set; otherwise capability-weighted heuristic.
 */
export async function recommendTopology(input: {
  userMessage: string;
  agents: Agent[];
}): Promise<{ steps: TopologyStepSpec[]; route_reason_codes: string[] }> {
  if (input.agents.length === 0) {
    return { steps: [], route_reason_codes: ["no_agents_in_conversation"] };
  }

  const ranked = [...input.agents].sort((a, b) => scoreAgent(b, input.userMessage) - scoreAgent(a, input.userMessage));
  const maxSteps = Math.min(3, ranked.length);
  let orderedAgents = ranked.slice(0, maxSteps);

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const reasonCodes: string[] = ["capability_keyword_match"];

  if (apiKey && orderedAgents.length > 1) {
    const llmOrder = await orderAgentIdsWithOpenAI(apiKey, input.userMessage, orderedAgents);
    if (llmOrder) {
      const byId = new Map(orderedAgents.map((a) => [a.id, a]));
      orderedAgents = llmOrder.map((id) => byId.get(id)).filter(Boolean) as Agent[];
      reasonCodes.push("llm_topology_order");
    } else {
      reasonCodes.push("llm_order_failed_fallback_heuristic");
    }
  } else {
    reasonCodes.push("heuristic_topology_order");
  }

  const steps = orderedAgents.map((agent, idx) => defaultStepSpec(agent, idx));
  return { steps, route_reason_codes: reasonCodes };
}
