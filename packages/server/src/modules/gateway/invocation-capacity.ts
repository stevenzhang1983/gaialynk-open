/**
 * E-7: Per–logical-agent concurrency gate + fair FIFO queue.
 * E-12: When `REDIS_URL` is set, occupancy is tracked in Redis (multi-instance); local FIFO waiters
 * are woken by `PUBLISH` on slot release. Without Redis, behavior matches E-7 in-memory implementation.
 */
import Redis from "ioredis";
import { getRedisUrl } from "../../infra/redis/redis-url";
import { getRedisCommandsClient } from "../realtime/redis-pubsub";

export class InvocationCapacityFastFailError extends Error {
  readonly estimated_wait_ms: number;

  constructor(estimated_wait_ms: number) {
    super("invocation_capacity_fast_fail");
    this.name = "InvocationCapacityFastFailError";
    this.estimated_wait_ms = estimated_wait_ms;
  }
}

export class InvocationQueueTimeoutError extends Error {
  constructor(message = "invocation_queue_timeout") {
    super(message);
    this.name = "InvocationQueueTimeoutError";
  }
}

type Waiter = {
  resolve: () => void;
  reject: (e: Error) => void;
  maxConcurrent: number;
};

const availableSlots = new Map<string, number>();
const waitQueues = new Map<string, Waiter[]>();

const ACQUIRE_LUA = `
local c = redis.call('INCR', KEYS[1])
redis.call('EXPIRE', KEYS[1], tonumber(ARGV[2]))
if c > tonumber(ARGV[1]) then
  redis.call('DECR', KEYS[1])
  return 0
end
return 1
`;

const RELEASE_LUA = `
local n = redis.call('DECR', KEYS[1])
if n < 0 then
  redis.call('SET', KEYS[1], 0)
  return 0
end
return n
`;

function redisCapKey(agentId: string): string {
  return `gaialynk:inv:cap:${agentId}`;
}

function redisNotifyChannel(agentId: string): string {
  return `inv:cap:free:${agentId}`;
}

let notifySub: Redis | null = null;
let notifySubStarted = false;

function ensureNotifySubscriber(): void {
  const url = getRedisUrl();
  if (!url || notifySubStarted) {
    return;
  }
  notifySubStarted = true;
  notifySub = new Redis(url, { maxRetriesPerRequest: null });
  void notifySub.psubscribe("inv:cap:free:*");
  notifySub.on("pmessage", (_pattern: string, channel: string) => {
    const prefix = "inv:cap:free:";
    if (!channel.startsWith(prefix)) {
      return;
    }
    const agentId = channel.slice(prefix.length);
    if (agentId) {
      void wakeOneLocalWaiter(agentId);
    }
  });
  notifySub.on("error", (err: Error) => {
    console.error("[invocation-capacity] notify subscriber error:", err);
  });
}

async function tryAcquireRedis(agentId: string, maxConcurrent: number): Promise<boolean> {
  const r = getRedisCommandsClient();
  if (!r) {
    return false;
  }
  const res = (await r.eval(ACQUIRE_LUA, 1, redisCapKey(agentId), maxConcurrent, 3600)) as number;
  return res === 1;
}

async function releaseRedis(agentId: string): Promise<void> {
  const r = getRedisCommandsClient();
  if (!r) {
    return;
  }
  await r.eval(RELEASE_LUA, 1, redisCapKey(agentId));
  await r.publish(redisNotifyChannel(agentId), "1");
}

async function wakeOneLocalWaiter(agentId: string): Promise<void> {
  const q = waitQueues.get(agentId);
  if (!q?.length) {
    return;
  }
  const head = q[0];
  if (!head) {
    return;
  }
  const ok = await tryAcquireRedis(agentId, head.maxConcurrent);
  if (!ok) {
    return;
  }
  q.shift();
  if (q.length === 0) {
    waitQueues.delete(agentId);
  }
  head.resolve();
}

function ensureCapacity(agentId: string, maxConcurrent: number): void {
  if (!availableSlots.has(agentId)) {
    availableSlots.set(agentId, Math.max(1, Math.min(maxConcurrent, 1000)));
  }
}

/** @internal Exported for tests */
export function resetInvocationCapacityForTests(): void {
  availableSlots.clear();
  waitQueues.clear();
}

/** @internal Close Redis notify subscriber (tests). */
export async function resetInvocationCapacityRedisForTests(): Promise<void> {
  notifySubStarted = false;
  if (notifySub) {
    await notifySub.quit().catch(() => {});
    notifySub = null;
  }
}

async function acquireSlotMemory(
  agentId: string,
  maxConcurrent: number,
  behavior: "queue" | "fast_fail",
  waitSignal: AbortSignal | undefined,
): Promise<void> {
  const max = Math.max(1, Math.min(maxConcurrent, 1000));
  ensureCapacity(agentId, max);
  let avail = availableSlots.get(agentId) ?? max;
  if (avail > 0) {
    availableSlots.set(agentId, avail - 1);
    return;
  }

  if (behavior === "fast_fail") {
    const qLen = waitQueues.get(agentId)?.length ?? 0;
    throw new InvocationCapacityFastFailError(Math.min(120_000, (qLen + 1) * 500));
  }

  await new Promise<void>((resolve, reject) => {
    const waiter: Waiter = { resolve, reject, maxConcurrent: max };
    const q = waitQueues.get(agentId) ?? [];
    q.push(waiter);
    waitQueues.set(agentId, q);

    const onAbort = (): void => {
      const list = waitQueues.get(agentId);
      if (!list) {
        return;
      }
      const i = list.indexOf(waiter);
      if (i >= 0) {
        list.splice(i, 1);
      }
      if (list.length === 0) {
        waitQueues.delete(agentId);
      }
      reject(new InvocationQueueTimeoutError("invocation_queue_aborted"));
    };

    if (waitSignal) {
      if (waitSignal.aborted) {
        onAbort();
        return;
      }
      waitSignal.addEventListener("abort", onAbort, { once: true });
    }
  });
}

async function acquireSlotAsync(
  agentId: string,
  maxConcurrent: number,
  behavior: "queue" | "fast_fail",
  waitSignal: AbortSignal | undefined,
): Promise<void> {
  const max = Math.max(1, Math.min(maxConcurrent, 1000));
  if (!getRedisUrl()) {
    await acquireSlotMemory(agentId, max, behavior, waitSignal);
    return;
  }

  ensureNotifySubscriber();
  const got = await tryAcquireRedis(agentId, max);
  if (got) {
    return;
  }

  if (behavior === "fast_fail") {
    const qLen = waitQueues.get(agentId)?.length ?? 0;
    throw new InvocationCapacityFastFailError(Math.min(120_000, (qLen + 1) * 500));
  }

  await new Promise<void>((resolve, reject) => {
    const waiter: Waiter = { resolve, reject, maxConcurrent: max };
    const q = waitQueues.get(agentId) ?? [];
    q.push(waiter);
    waitQueues.set(agentId, q);

    const onAbort = (): void => {
      const list = waitQueues.get(agentId);
      if (!list) {
        return;
      }
      const i = list.indexOf(waiter);
      if (i >= 0) {
        list.splice(i, 1);
      }
      if (list.length === 0) {
        waitQueues.delete(agentId);
      }
      reject(new InvocationQueueTimeoutError("invocation_queue_aborted"));
    };

    if (waitSignal) {
      if (waitSignal.aborted) {
        onAbort();
        return;
      }
      waitSignal.addEventListener("abort", onAbort, { once: true });
    }
  });
}

function releaseSlotMemory(agentId: string, maxConcurrent: number): void {
  const max = Math.max(1, Math.min(maxConcurrent, 1000));
  const q = waitQueues.get(agentId);
  if (q && q.length > 0) {
    const w = q.shift()!;
    if (q.length === 0) {
      waitQueues.delete(agentId);
    }
    w.resolve();
    return;
  }
  const cap = availableSlots.get(agentId) ?? max;
  const next = Math.min(cap + 1, max);
  availableSlots.set(agentId, next);
}

async function releaseSlotAsync(agentId: string, maxConcurrent: number): Promise<void> {
  const max = Math.max(1, Math.min(maxConcurrent, 1000));
  if (!getRedisUrl()) {
    releaseSlotMemory(agentId, max);
    return;
  }

  const q = waitQueues.get(agentId);
  if (q && q.length > 0) {
    await releaseRedis(agentId);
    await wakeOneLocalWaiter(agentId);
    return;
  }
  await releaseRedis(agentId);
  void wakeOneLocalWaiter(agentId);
}

/**
 * Runs `fn` when a slot is available for this logical agent.
 */
export async function withPerAgentConcurrency<T>(
  agentId: string,
  maxConcurrent: number,
  behavior: "queue" | "fast_fail",
  waitSignal: AbortSignal | undefined,
  fn: () => Promise<T>,
): Promise<T> {
  const max = Math.max(1, Math.min(maxConcurrent, 1000));
  await acquireSlotAsync(agentId, max, behavior, waitSignal);
  try {
    return await fn();
  } finally {
    await releaseSlotAsync(agentId, max);
  }
}
