const UUID =
  "([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})";

/** E-2: @user:<uuid> and @agent:<uuid> in message text. */
export function extractMentionTargets(text: string): { userIds: string[]; agentIds: string[] } {
  const userRe = new RegExp(`@user:${UUID}`, "gi");
  const agentRe = new RegExp(`@agent:${UUID}`, "gi");
  const userIds = [...text.matchAll(userRe)].map((m) => m[1]!.toLowerCase());
  const agentIds = [...text.matchAll(agentRe)].map((m) => m[1]!.toLowerCase());
  return {
    userIds: [...new Set(userIds)],
    agentIds: [...new Set(agentIds)],
  };
}
