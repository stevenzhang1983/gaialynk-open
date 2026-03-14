import { randomUUID } from "node:crypto";

export interface AgentCapability {
  name: string;
  risk_level: "low" | "medium" | "high" | "critical";
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  agent_type: "logical" | "execution";
  source_url: string;
  capabilities: AgentCapability[];
  created_at: string;
}

interface RegisterAgentInput {
  name: string;
  description: string;
  agent_type: "logical" | "execution";
  source_url: string;
  capabilities: AgentCapability[];
}

const agents = new Map<string, Agent>();

export const registerAgent = (input: RegisterAgentInput): Agent => {
  const agent: Agent = {
    id: randomUUID(),
    name: input.name,
    description: input.description,
    agent_type: input.agent_type,
    source_url: input.source_url,
    capabilities: input.capabilities,
    created_at: new Date().toISOString(),
  };

  agents.set(agent.id, agent);

  return agent;
};

export const getAgentById = (agentId: string): Agent | null => {
  return agents.get(agentId) ?? null;
};

export const listAgents = (): Agent[] => {
  return [...agents.values()];
};

export const resetAgentStore = (): void => {
  agents.clear();
};
