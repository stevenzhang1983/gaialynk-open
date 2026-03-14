import type { Agent } from "../directory/agent.store";

interface RequestAgentInput {
  conversationId: string;
  agent: Agent;
  userText: string;
}

interface A2AResponse {
  text: string;
}

export const requestAgent = async (input: RequestAgentInput): Promise<A2AResponse> => {
  const responseText = `mocked A2A response from ${input.agent.name} for conversation ${input.conversationId}: ${input.userText}`;

  return { text: responseText };
};
