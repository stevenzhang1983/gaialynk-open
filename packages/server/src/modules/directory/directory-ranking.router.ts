import type { Hono } from "hono";
import { verifyAccessToken } from "../auth/jwt";
import { agentsListAsArray, listAgentsAsync } from "./agent.store";
import { getDirectoryRankingConfigRowAsync, patchDirectoryRankingConfigAsync } from "./directory-ranking-config.store";
import {
  getBatchAgentRankingMetricsAsync,
  incrementNewListingImpressionsAsync,
  listNewListingImpressionCountsAsync,
} from "./ranking-metrics.store";
import { agentIdentityVerified, agentMaxRiskLevel } from "./agent-directory.service";
import { buildDiscoverySlots, safeFallbackSortAgents } from "./ranking.service";

function getOptionalJwtUserIdFromRequest(c: {
  req: { header: (name: string) => string | undefined };
}): string | undefined {
  const auth = c.req.header("Authorization")?.trim();
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!bearer) return undefined;
  return verifyAccessToken(bearer)?.sub;
}

function canPatchDirectoryRanking(userId: string): boolean {
  const ids = process.env.DIRECTORY_RANKING_ADMIN_USER_IDS?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (ids?.length) return ids.includes(userId);
  return process.env.VITEST === "true" || process.env.NODE_ENV === "test";
}

export function registerDirectoryRankingRoutes(app: Hono): void {
  app.get("/api/v1/directory-ranking/config", async (c) => {
    const row = await getDirectoryRankingConfigRowAsync();
    return c.json(
      {
        data: {
          config: row.config,
          updated_at: row.updated_at,
        },
      },
      200,
    );
  });

  app.patch("/api/v1/directory-ranking/config", async (c) => {
    const uid = getOptionalJwtUserIdFromRequest(c);
    if (!uid) {
      return c.json({ error: { code: "unauthorized", message: "Bearer JWT required" } }, 401);
    }
    if (!canPatchDirectoryRanking(uid)) {
      return c.json(
        { error: { code: "forbidden", message: "Not authorized to update directory ranking config" } },
        403,
      );
    }
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: { code: "invalid_json", message: "JSON body required" } }, 400);
    }
    try {
      const next = await patchDirectoryRankingConfigAsync(body);
      return c.json({ data: { config: next.config, updated_at: next.updated_at } }, 200);
    } catch (e) {
      return c.json(
        {
          error: {
            code: "invalid_directory_ranking_config",
            message: e instanceof Error ? e.message : "Invalid config",
          },
        },
        400,
      );
    }
  });

  app.get("/api/v1/agents/discovery", async (c) => {
    const simulateFail = c.req.query("simulate_ranking_failure") === "1";
    const trustAll = c.req.query("trust_visibility") === "all";

    try {
      if (simulateFail) {
        throw new Error("simulated ranking failure");
      }
      const { config } = await getDirectoryRankingConfigRowAsync();
      const all = agentsListAsArray(await listAgentsAsync());
      const ids = all.map((a) => a.id);
      const metrics = await getBatchAgentRankingMetricsAsync(ids);
      const impressions = await listNewListingImpressionCountsAsync(ids);
      const slots = buildDiscoverySlots(all, metrics, impressions, config);
      const nlIds = slots.new_listings.map((a) => a.id);
      if (nlIds.length > 0) {
        await incrementNewListingImpressionsAsync(nlIds);
      }
      return c.json(
        {
          data: {
            slots: {
              hot: slots.hot,
              beginner_friendly: slots.beginner_friendly,
              low_latency: slots.low_latency,
              new_listings: slots.new_listings,
            },
            meta: {
              ranking_fallback: false,
              trust_visibility: trustAll ? "all" : "default",
            },
          },
        },
        200,
      );
    } catch {
      const all = agentsListAsArray(await listAgentsAsync());
      const filtered = trustAll
        ? all.filter((a) => a.status !== "deprecated")
        : all.filter((a) => a.status === "active");
      const byName = safeFallbackSortAgents(filtered);
      const beginnerFallback = byName.filter(
        (a) =>
          a.status === "active" &&
          agentIdentityVerified(a) &&
          agentMaxRiskLevel(a) === "low",
      );
      const recent = [...filtered].sort((a, b) => b.created_at.localeCompare(a.created_at));
      return c.json(
        {
          data: {
            slots: {
              hot: byName.slice(0, 8),
              beginner_friendly: beginnerFallback.slice(0, 8),
              low_latency: byName.slice(0, 8),
              new_listings: recent.slice(0, 5),
            },
            meta: {
              ranking_fallback: true,
              trust_visibility: trustAll ? "all" : "default",
            },
          },
        },
        200,
      );
    }
  });
}
