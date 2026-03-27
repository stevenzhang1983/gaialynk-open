/**
 * E-7: Round-robin across healthy endpoints with failover on transport / A2A errors.
 */
const rrIndexByAgent = new Map<string, number>();

/** @internal */
export function resetPoolRouterForTests(): void {
  rrIndexByAgent.clear();
}

function rotateUrls(agentId: string, urls: string[]): string[] {
  if (urls.length <= 1) return urls;
  const start = rrIndexByAgent.get(agentId) ?? 0;
  const safeStart = start % urls.length;
  const tail = urls.slice(safeStart);
  const head = urls.slice(0, safeStart);
  return [...tail, ...head];
}

export function advanceRoundRobin(agentId: string, urlCount: number): void {
  if (urlCount <= 0) return;
  const cur = rrIndexByAgent.get(agentId) ?? 0;
  rrIndexByAgent.set(agentId, (cur + 1) % urlCount);
}

/**
 * Tries URLs in round-robin order starting from last successful rotation; on success advances RR.
 */
export async function tryEndpointsWithFailover<T>(
  agentId: string,
  urls: string[],
  attempt: (url: string) => Promise<T>,
): Promise<T> {
  if (urls.length === 0) {
    throw new Error("no_agent_endpoints");
  }
  const order = rotateUrls(agentId, urls);
  let lastErr: Error | undefined;
  for (let i = 0; i < order.length; i++) {
    const url = order[i]!;
    try {
      const out = await attempt(url);
      advanceRoundRobin(agentId, urls.length);
      return out;
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastErr ?? new Error("agent_pool_exhausted");
}
