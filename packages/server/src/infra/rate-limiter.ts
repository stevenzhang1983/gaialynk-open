import { randomUUID } from "node:crypto";
import { getRedisCommandsClient } from "../modules/realtime/redis-pubsub";
import { getRedisUrl } from "./redis/redis-url";

export type RateLimitResult = { allowed: boolean; retryAfterMs: number };

const RL_PREFIX = "gaialynk:rl:";

/** Sliding window in Redis (ZSET scores = request time ms). */
const SLIDING_WINDOW_LUA = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local windowMs = tonumber(ARGV[2])
local maxReq = tonumber(ARGV[3])
local member = ARGV[4]
redis.call('ZREMRANGEBYSCORE', key, 0, now - windowMs)
local n = redis.call('ZCARD', key)
if n >= maxReq then
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  if oldest[2] == nil then
    return {0, windowMs}
  end
  local retryMs = windowMs - (now - tonumber(oldest[2]))
  if retryMs < 0 then retryMs = 0 end
  return {0, math.ceil(retryMs)}
end
redis.call('ZADD', key, now, member)
redis.call('PEXPIRE', key, windowMs + 1000)
return {1, 0}
`;

/** Atomically reserve `slots` entries if `ZCARD + slots <= maxReq` after trim. */
const CONSUME_N_LUA = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local windowMs = tonumber(ARGV[2])
local maxReq = tonumber(ARGV[3])
local n = tonumber(ARGV[4])
local idPrefix = ARGV[5]
redis.call('ZREMRANGEBYSCORE', key, 0, now - windowMs)
local c = redis.call('ZCARD', key)
if c + n > maxReq then
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  if oldest[2] == nil then
    return {0, windowMs}
  end
  local retryMs = windowMs - (now - tonumber(oldest[2]))
  if retryMs < 0 then retryMs = 0 end
  return {0, math.ceil(retryMs)}
end
for i = 0, n - 1 do
  redis.call('ZADD', key, now + i, idPrefix .. ':' .. i)
end
redis.call('PEXPIRE', key, windowMs + 1000)
return {1, 0}
`;

const memWindows = new Map<string, number[]>();

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (raw == null || raw.trim() === "") return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function getRateLimitRegisterPerHour(): number {
  return parsePositiveInt(process.env.RATE_LIMIT_REGISTER_PER_HOUR, 10);
}

export function getRateLimitMessagePerMinute(): number {
  return parsePositiveInt(process.env.RATE_LIMIT_MESSAGE_PER_MIN, 30);
}

export function getRateLimitDirectorySearchPerMinute(): number {
  return parsePositiveInt(process.env.RATE_LIMIT_DIRECTORY_SEARCH_PER_MIN, 60);
}

export function getRateLimitInvocationPerHour(): number {
  return parsePositiveInt(process.env.RATE_LIMIT_INVOCATION_PER_HOUR, 120);
}

function checkRateLimitInMemory(key: string, maxRequests: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  let arr = memWindows.get(key) ?? [];
  arr = arr.filter((t) => now - t < windowMs);
  if (arr.length >= maxRequests) {
    const oldest = arr[0];
    const retryAfterMs = oldest != null ? Math.max(0, windowMs - (now - oldest)) : windowMs;
    memWindows.set(key, arr);
    return { allowed: false, retryAfterMs: Math.ceil(retryAfterMs) };
  }
  arr.push(now);
  memWindows.set(key, arr);
  return { allowed: true, retryAfterMs: 0 };
}

/**
 * Sliding-window rate limit. Uses Redis when `REDIS_URL` is set; otherwise in-memory (single-process tests / dev).
 */
function consumeRateLimitSlotsInMemory(
  key: string,
  maxRequests: number,
  windowSeconds: number,
  slots: number,
): RateLimitResult {
  if (slots <= 0) {
    return { allowed: true, retryAfterMs: 0 };
  }
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  let arr = memWindows.get(key) ?? [];
  arr = arr.filter((t) => now - t < windowMs);
  if (arr.length + slots > maxRequests) {
    const oldest = arr[0];
    const retryAfterMs = oldest != null ? Math.max(0, windowMs - (now - oldest)) : windowMs;
    memWindows.set(key, arr);
    return { allowed: false, retryAfterMs: Math.ceil(retryAfterMs) };
  }
  for (let i = 0; i < slots; i++) {
    arr.push(now + i * 0.001);
  }
  memWindows.set(key, arr);
  return { allowed: true, retryAfterMs: 0 };
}

export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  if (maxRequests <= 0) {
    return { allowed: true, retryAfterMs: 0 };
  }
  const redis = getRedisUrl() ? getRedisCommandsClient() : null;
  if (!redis) {
    return checkRateLimitInMemory(key, maxRequests, windowSeconds);
  }
  const fullKey = `${RL_PREFIX}${key}`;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const member = `${now}:${randomUUID()}`;
  const res = (await redis.eval(
    SLIDING_WINDOW_LUA,
    1,
    fullKey,
    now.toString(),
    windowMs.toString(),
    maxRequests.toString(),
    member,
  )) as [number, number];
  const allowed = res[0] === 1;
  const retryAfterMs = allowed ? 0 : res[1] ?? windowMs;
  return { allowed, retryAfterMs };
}

/** Reserve multiple sliding-window slots in one atomic operation (E-18 multi-agent message). */
export async function consumeRateLimitSlots(
  key: string,
  maxRequests: number,
  windowSeconds: number,
  slots: number,
): Promise<RateLimitResult> {
  if (maxRequests <= 0 || slots <= 0) {
    return { allowed: true, retryAfterMs: 0 };
  }
  const redis = getRedisUrl() ? getRedisCommandsClient() : null;
  if (!redis) {
    return consumeRateLimitSlotsInMemory(key, maxRequests, windowSeconds, slots);
  }
  const fullKey = `${RL_PREFIX}${key}`;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const idPrefix = `${now}:${randomUUID()}`;
  const res = (await redis.eval(
    CONSUME_N_LUA,
    1,
    fullKey,
    now.toString(),
    windowMs.toString(),
    maxRequests.toString(),
    String(slots),
    idPrefix,
  )) as [number, number];
  const allowed = res[0] === 1;
  const retryAfterMs = allowed ? 0 : res[1] ?? windowMs;
  return { allowed, retryAfterMs };
}

export function resetRateLimiterInMemory(): void {
  memWindows.clear();
}
