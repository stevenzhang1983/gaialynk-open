import { isPostgresEnabled, query } from "../../infra/db/client";
import { z } from "zod";

const operationalSlotSchema = z.object({
  min_reputation_grade: z.enum(["A", "B", "C", "D"]),
  max_recent_error_rate: z.number().min(0).max(1),
  min_listing_age_days: z.number().min(0),
  max_slots: z.number().int().min(1).max(50),
});

const newListingSlotSchema = operationalSlotSchema.extend({
  max_listing_age_days: z.number().min(1).max(90),
  impression_cap_per_agent: z.number().int().min(1).max(1_000_000),
});

export const directoryRankingConfigSchema = z.object({
  hot: operationalSlotSchema,
  beginner_friendly: operationalSlotSchema.extend({
    /** Only these trust badges may appear (R2: unverified excluded) */
    allowed_trust_badges: z.array(z.enum(["consumer_ready", "high_sensitivity_enhanced"])),
  }),
  low_latency: operationalSlotSchema.extend({
    require_health_check_ok: z.boolean(),
  }),
  new_listings: newListingSlotSchema.extend({
    /** Must be at least this badge (consumer_ready = safest cold-start bar) */
    min_trust_badge: z.enum(["consumer_ready"]),
  }),
});

export type DirectoryRankingConfig = z.infer<typeof directoryRankingConfigSchema>;

export function defaultDirectoryRankingConfig(): DirectoryRankingConfig {
  return {
    hot: {
      min_reputation_grade: "C",
      max_recent_error_rate: 0.35,
      min_listing_age_days: 0,
      max_slots: 8,
    },
    beginner_friendly: {
      min_reputation_grade: "B",
      max_recent_error_rate: 0.2,
      min_listing_age_days: 1,
      max_slots: 8,
      allowed_trust_badges: ["consumer_ready"],
    },
    low_latency: {
      min_reputation_grade: "C",
      max_recent_error_rate: 0.4,
      min_listing_age_days: 0,
      max_slots: 8,
      require_health_check_ok: true,
    },
    new_listings: {
      min_reputation_grade: "C",
      max_recent_error_rate: 0.25,
      min_listing_age_days: 0,
      max_slots: 5,
      max_listing_age_days: 7,
      impression_cap_per_agent: 500,
      min_trust_badge: "consumer_ready",
    },
  };
}

function deepMerge<T extends Record<string, unknown>>(base: T, patch: Record<string, unknown>): T {
  const out = { ...base } as Record<string, unknown>;
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    if (v !== null && typeof v === "object" && !Array.isArray(v) && typeof out[k] === "object" && out[k] !== null) {
      out[k] = deepMerge(out[k] as Record<string, unknown>, v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out as T;
}

export async function getDirectoryRankingConfigRowAsync(): Promise<{
  config: DirectoryRankingConfig;
  raw_patch: Record<string, unknown>;
  updated_at: string;
}> {
  const merged = defaultDirectoryRankingConfig();
  if (!isPostgresEnabled()) {
    return { config: merged, raw_patch: {}, updated_at: new Date().toISOString() };
  }
  const rows = await query<{ config: unknown; updated_at: string }>(
    `SELECT config, updated_at::text AS updated_at FROM directory_ranking_config WHERE id = 'default'`,
  );
  const row = rows[0];
  if (!row?.config || typeof row.config !== "object") {
    return { config: merged, raw_patch: {}, updated_at: row?.updated_at ?? new Date().toISOString() };
  }
  const patch = row.config as Record<string, unknown>;
  const combined = deepMerge(merged as unknown as Record<string, unknown>, patch);
  const parsed = directoryRankingConfigSchema.safeParse(combined);
  return {
    config: parsed.success ? parsed.data : merged,
    raw_patch: patch,
    updated_at: row.updated_at,
  };
}

const patchSchema = z.record(z.string(), z.unknown());

export async function patchDirectoryRankingConfigAsync(
  patch: unknown,
): Promise<{ config: DirectoryRankingConfig; updated_at: string }> {
  if (!isPostgresEnabled()) {
    const base = defaultDirectoryRankingConfig();
    const p = patchSchema.parse(patch);
    const combined = deepMerge(base as unknown as Record<string, unknown>, p);
    const parsed = directoryRankingConfigSchema.parse(combined);
    return { config: parsed, updated_at: new Date().toISOString() };
  }
  const current = await getDirectoryRankingConfigRowAsync();
  const p = patchSchema.parse(patch);
  const nextPatch = deepMerge(current.raw_patch, p);
  const merged = deepMerge(defaultDirectoryRankingConfig() as unknown as Record<string, unknown>, nextPatch);
  const config = directoryRankingConfigSchema.parse(merged);
  const rows = await query<{ updated_at: string }>(
    `UPDATE directory_ranking_config
     SET config = $1::jsonb, updated_at = now()
     WHERE id = 'default'
     RETURNING updated_at::text AS updated_at`,
    [JSON.stringify(nextPatch)],
  );
  return { config, updated_at: rows[0]?.updated_at ?? new Date().toISOString() };
}
