/** E-12: shared Redis URL resolution (realtime, concurrency gate, quota dedup). */
export function getRedisUrl(): string | undefined {
  const u = process.env.REDIS_URL?.trim();
  return u || undefined;
}

export function isRedisConfigured(): boolean {
  return Boolean(getRedisUrl());
}
