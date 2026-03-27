import Redis from "ioredis";
import { getRedisUrl } from "../../infra/redis/redis-url";

const CONV_PREFIX = "conv:";
const DESKTOP_USER_PREFIX = "desktopu:";

type LocalDeliver = (conversationId: string, payload: string) => void;
type DesktopUserDeliver = (userId: string, payload: string) => void;

let deliverLocal: LocalDeliver = () => {};
let deliverDesktopUserLocal: DesktopUserDeliver = () => {};
let pubClient: Redis | null = null;
let subClient: Redis | null = null;
let subscriberStarted = false;
const channelRefCount = new Map<string, number>();
const desktopUserChannelRefCount = new Map<string, number>();

function convChannel(conversationId: string): string {
  return `${CONV_PREFIX}${conversationId}`;
}

/** Must be called from process entry (e.g. index.ts) before any fan-out. */
export function registerConversationFanoutLocalDelivery(fn: LocalDeliver): void {
  deliverLocal = fn;
}

export function registerDesktopUserFanoutLocalDelivery(fn: DesktopUserDeliver): void {
  deliverDesktopUserLocal = fn;
}

function desktopUserChannel(userId: string): string {
  return `${DESKTOP_USER_PREFIX}${userId}`;
}

function getPublisher(): Redis | null {
  const url = getRedisUrl();
  if (!url) {
    return null;
  }
  if (!pubClient) {
    pubClient = new Redis(url, { maxRetriesPerRequest: null });
  }
  return pubClient;
}

/** Shared command connection (PUBLISH / INCR / SET NX) — same ioredis instance as fan-out publisher. */
export function getRedisCommandsClient(): Redis | null {
  return getPublisher();
}

function attachSubscriberHandlers(client: Redis): void {
  client.on("message", (channel, message) => {
    if (channel.startsWith(CONV_PREFIX)) {
      const conversationId = channel.slice(CONV_PREFIX.length);
      deliverLocal(conversationId, message);
      return;
    }
    if (channel.startsWith(DESKTOP_USER_PREFIX)) {
      const userId = channel.slice(DESKTOP_USER_PREFIX.length);
      deliverDesktopUserLocal(userId, message);
    }
  });
  client.on("error", (err) => {
    console.error("[redis-pubsub] subscriber error:", err);
  });
}

/** Starts Redis subscriber loop when REDIS_URL is set (idempotent). */
export function startConversationRedisSubscriber(): void {
  const url = getRedisUrl();
  if (!url || subscriberStarted) {
    return;
  }
  subscriberStarted = true;
  subClient = new Redis(url, { maxRetriesPerRequest: null });
  attachSubscriberHandlers(subClient);
}

/** Increment refcount and SUBSCRIBE when first local socket joins this conversation. */
export function retainConversationRedisChannel(conversationId: string): void {
  const url = getRedisUrl();
  if (!url || !subClient) {
    return;
  }
  const n = (channelRefCount.get(conversationId) ?? 0) + 1;
  channelRefCount.set(conversationId, n);
  if (n === 1) {
    void subClient.subscribe(convChannel(conversationId)).catch((err) => {
      console.error("[redis-pubsub] subscribe failed:", err);
    });
  }
}

/** Decrement refcount and UNSUBSCRIBE when last local socket leaves. */
export function releaseConversationRedisChannel(conversationId: string): void {
  const url = getRedisUrl();
  if (!url || !subClient) {
    return;
  }
  const n = (channelRefCount.get(conversationId) ?? 0) - 1;
  if (n <= 0) {
    channelRefCount.delete(conversationId);
    void subClient.unsubscribe(convChannel(conversationId)).catch((err) => {
      console.error("[redis-pubsub] unsubscribe failed:", err);
    });
  } else {
    channelRefCount.set(conversationId, n);
  }
}

/**
 * Fan-out to all subscribers: Redis PUBLISH when configured, else local WS only.
 * Same-process delivery happens via subscriber receiving the publish.
 */
export function fanoutConversationPayload(conversationId: string, payload: string): void {
  const pub = getPublisher();
  if (pub) {
    void pub.publish(convChannel(conversationId), payload);
    return;
  }
  deliverLocal(conversationId, payload);
}

export function retainDesktopUserRedisChannel(userId: string): void {
  const url = getRedisUrl();
  if (!url || !subClient) {
    return;
  }
  const n = (desktopUserChannelRefCount.get(userId) ?? 0) + 1;
  desktopUserChannelRefCount.set(userId, n);
  if (n === 1) {
    void subClient.subscribe(desktopUserChannel(userId)).catch((err) => {
      console.error("[redis-pubsub] desktop subscribe failed:", err);
    });
  }
}

export function releaseDesktopUserRedisChannel(userId: string): void {
  const url = getRedisUrl();
  if (!url || !subClient) {
    return;
  }
  const n = (desktopUserChannelRefCount.get(userId) ?? 0) - 1;
  if (n <= 0) {
    desktopUserChannelRefCount.delete(userId);
    void subClient.unsubscribe(desktopUserChannel(userId)).catch((err) => {
      console.error("[redis-pubsub] desktop unsubscribe failed:", err);
    });
  } else {
    desktopUserChannelRefCount.set(userId, n);
  }
}

export function fanoutDesktopUserPayload(userId: string, payload: string): void {
  const pub = getPublisher();
  if (pub) {
    void pub.publish(desktopUserChannel(userId), payload);
    return;
  }
  deliverDesktopUserLocal(userId, payload);
}

/** Clear per-conversation SUBSCRIBE refcounts (e.g. test teardown without closing Redis). */
export function resetConversationChannelSubscriptionState(): void {
  if (subClient) {
    for (const cid of [...channelRefCount.keys()]) {
      void subClient.unsubscribe(convChannel(cid)).catch(() => {});
    }
    for (const uid of [...desktopUserChannelRefCount.keys()]) {
      void subClient.unsubscribe(desktopUserChannel(uid)).catch(() => {});
    }
  }
  channelRefCount.clear();
  desktopUserChannelRefCount.clear();
}

/** Test helper: close clients and reset subscription refcount. */
export async function resetRedisPubSubForTests(): Promise<void> {
  resetConversationChannelSubscriptionState();
  subscriberStarted = false;
  if (subClient) {
    await subClient.quit().catch(() => {});
    subClient = null;
  }
  if (pubClient) {
    await pubClient.quit().catch(() => {});
    pubClient = null;
  }
}
