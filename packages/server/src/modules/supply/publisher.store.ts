import { randomUUID } from "node:crypto";
import { isPostgresEnabled, query } from "../../infra/db/client";

export type PublisherIdentityTier = "anonymous" | "verified" | "certified";

export const DEFAULT_ANONYMOUS_PUBLISHER_ID = "00000000-0000-0000-0000-000000000001";

export interface Publisher {
  id: string;
  identity_tier: PublisherIdentityTier;
  created_at: string;
}

const publishers = new Map<string, Publisher>();

const nowIso = (): string => new Date().toISOString();

export const getPublisherAsync = async (publisherId: string): Promise<Publisher | null> => {
  if (!isPostgresEnabled()) {
    return publishers.get(publisherId) ?? null;
  }
  const rows = await query<Publisher>(
    `SELECT id, identity_tier, created_at::text
     FROM publishers
     WHERE id = $1`,
    [publisherId],
  );
  return rows[0] ?? null;
};

export const createPublisherAsync = async (input: {
  identity_tier?: PublisherIdentityTier;
}): Promise<Publisher> => {
  const tier = input.identity_tier ?? "anonymous";
  const publisher: Publisher = {
    id: randomUUID(),
    identity_tier: tier,
    created_at: nowIso(),
  };
  if (isPostgresEnabled()) {
    await query(
      `INSERT INTO publishers (id, identity_tier, created_at)
       VALUES ($1, $2, $3)`,
      [publisher.id, publisher.identity_tier, publisher.created_at],
    );
    return publisher;
  }
  publishers.set(publisher.id, publisher);
  return publisher;
};

export const ensureAnonymousPublisherExists = async (): Promise<Publisher> => {
  const existing = await getPublisherAsync(DEFAULT_ANONYMOUS_PUBLISHER_ID);
  if (existing) return existing;
  const publisher: Publisher = {
    id: DEFAULT_ANONYMOUS_PUBLISHER_ID,
    identity_tier: "anonymous",
    created_at: nowIso(),
  };
  if (isPostgresEnabled()) {
    await query(
      `INSERT INTO publishers (id, identity_tier, created_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO NOTHING`,
      [publisher.id, publisher.identity_tier, publisher.created_at],
    );
    return (await getPublisherAsync(DEFAULT_ANONYMOUS_PUBLISHER_ID)) ?? publisher;
  }
  publishers.set(publisher.id, publisher);
  return publisher;
};

export const updatePublisherTierAsync = async (
  publisherId: string,
  identity_tier: PublisherIdentityTier,
): Promise<Publisher | null> => {
  if (isPostgresEnabled()) {
    const rows = await query<Publisher>(
      `UPDATE publishers SET identity_tier = $2 WHERE id = $1
       RETURNING id, identity_tier, created_at::text`,
      [publisherId, identity_tier],
    );
    return rows[0] ?? null;
  }
  const p = publishers.get(publisherId);
  if (!p) return null;
  const updated: Publisher = { ...p, identity_tier };
  publishers.set(publisherId, updated);
  return updated;
};

export const getTierSortWeight = (tier: PublisherIdentityTier): number => {
  switch (tier) {
    case "certified":
      return 3;
    case "verified":
      return 2;
    default:
      return 1;
  }
};

export const resetPublisherStore = (): void => {
  if (isPostgresEnabled()) return;
  publishers.clear();
};
