/**
 * E-9 V1.3: 目录搜索排序（相关性 + 信任 tie-breaker）、运营位 discovery、降级与管理配置。
 */
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import type { Agent } from "../src/modules/directory/agent.store";
import { defaultDirectoryRankingConfig } from "../src/modules/directory/directory-ranking-config.store";
import type { AgentRankingMetrics } from "../src/modules/directory/ranking-metrics.store";
import {
  buildDiscoverySlots,
  rankAgentsForDirectorySearch,
  trustBadgeForRanking,
} from "../src/modules/directory/ranking.service";

function baseMetrics(over: Partial<AgentRankingMetrics> = {}): AgentRankingMetrics {
  return {
    completed: 0,
    failed: 0,
    denied: 0,
    need_confirmation: 0,
    recent_completed: 0,
    recent_failed: 0,
    reputation_score: 72,
    reputation_grade: "B",
    recent_error_rate: 0.05,
    ...over,
  };
}

describe("E-9 directory ranking", () => {
  it("rankAgentsForDirectorySearch: same relevance → consumer_ready before unverified", () => {
    const official: Agent = {
      id: "a1111111-1111-4111-8111-111111111111",
      name: "Alpha Widget",
      description: "d",
      agent_type: "logical",
      source_url: "mock://a",
      capabilities: [{ name: "lowcap", risk_level: "low" }],
      source_origin: "official",
      status: "active",
      created_at: "2026-01-01T00:00:00.000Z",
    };
    const selfHosted: Agent = {
      id: "b2222222-2222-4222-8222-222222222222",
      name: "Beta Widget",
      description: "d",
      agent_type: "logical",
      source_url: "mock://b",
      capabilities: [{ name: "lowcap", risk_level: "low" }],
      source_origin: "self_hosted",
      status: "active",
      created_at: "2026-01-02T00:00:00.000Z",
    };
    const metrics: Record<string, AgentRankingMetrics> = {
      [official.id]: baseMetrics(),
      [selfHosted.id]: baseMetrics(),
    };
    const ranked = rankAgentsForDirectorySearch([selfHosted, official], "Widget", metrics);
    expect(ranked[0]!.id).toBe(official.id);
    expect(ranked[1]!.id).toBe(selfHosted.id);
    expect(trustBadgeForRanking(official, metrics[official.id])).toBe("consumer_ready");
    expect(trustBadgeForRanking(selfHosted, metrics[selfHosted.id])).toBe("unverified");
  });

  it("buildDiscoverySlots: beginner_friendly excludes unverified even when metrics are strong", () => {
    const official: Agent = {
      id: "c3333333-3333-4333-8333-333333333333",
      name: "C Official",
      description: "x",
      agent_type: "logical",
      source_url: "mock://c",
      capabilities: [{ name: "x", risk_level: "low" }],
      source_origin: "official",
      status: "active",
      created_at: "2026-01-10T00:00:00.000Z",
    };
    const vendor: Agent = {
      id: "d4444444-4444-4444-8444-444444444444",
      name: "D Vendor",
      description: "x",
      agent_type: "logical",
      source_url: "mock://d",
      capabilities: [{ name: "x", risk_level: "low" }],
      source_origin: "vendor",
      status: "active",
      created_at: "2026-01-11T00:00:00.000Z",
    };
    const metrics: Record<string, AgentRankingMetrics> = {
      [official.id]: baseMetrics(),
      [vendor.id]: baseMetrics(),
    };
    const cfg = defaultDirectoryRankingConfig();
    const slots = buildDiscoverySlots([official, vendor], metrics, {}, cfg);
    expect(slots.beginner_friendly.map((a) => a.id)).toEqual([official.id]);
    expect(slots.beginner_friendly.some((a) => a.id === vendor.id)).toBe(false);
  });

  it("GET /api/v1/agents?search= uses relevance + trust ordering", async () => {
    const app = createApp();
    await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "E9 Unverified Zebra",
        description: "match e9rank",
        agent_type: "logical",
        source_url: "mock://e9u",
        capabilities: [{ name: "e9", risk_level: "low" }],
        source_origin: "self_hosted",
        status: "active",
      }),
    });
    await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "E9 Official Zebra",
        description: "match e9rank",
        agent_type: "logical",
        source_url: "mock://e9o",
        capabilities: [{ name: "e9", risk_level: "low" }],
        source_origin: "official",
        status: "active",
      }),
    });
    const res = await app.request("/api/v1/agents?search=e9rank");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: Array<{ name: string; source_origin?: string }>; meta?: { ranking_fallback?: boolean } };
    const zebras = body.data.filter((a) => a.name.includes("E9") && a.name.includes("Zebra"));
    expect(zebras.length).toBeGreaterThanOrEqual(2);
    const officialIdx = zebras.findIndex((a) => a.source_origin === "official");
    const selfIdx = zebras.findIndex((a) => a.source_origin === "self_hosted");
    expect(officialIdx).toBeGreaterThanOrEqual(0);
    expect(selfIdx).toBeGreaterThanOrEqual(0);
    expect(officialIdx).toBeLessThan(selfIdx);
    expect(body.meta?.ranking_fallback).toBe(false);
  });

  it("GET /api/v1/agents/discovery?simulate_ranking_failure=1 returns slots and ranking_fallback", async () => {
    const app = createApp();
    await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "E9 Discovery Agent",
        description: "d",
        agent_type: "logical",
        source_url: "mock://e9d",
        capabilities: [{ name: "x", risk_level: "low" }],
        source_origin: "official",
      }),
    });
    const res = await app.request("/api/v1/agents/discovery?simulate_ranking_failure=1");
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: { slots: { hot: unknown[] }; meta: { ranking_fallback: boolean } };
    };
    expect(body.data.meta.ranking_fallback).toBe(true);
    expect(body.data.slots.hot.length).toBeGreaterThanOrEqual(1);
  });

  it("GET/PATCH /api/v1/directory-ranking/config (VITEST allows PATCH)", async () => {
    const app = createApp();
    const getRes = await app.request("/api/v1/directory-ranking/config");
    expect(getRes.status).toBe(200);
    const before = (await getRes.json()) as { data: { config: { hot: { max_slots: number } } } };
    expect(before.data.config.hot.max_slots).toBeGreaterThanOrEqual(1);

    const { token } = await (async () => {
      const reg = await app.request("/api/v1/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "e9-rank-admin@example.com", password: "password123" }),
      });
      expect(reg.status).toBe(201);
      const body = (await reg.json()) as { data: { access_token: string } };
      return { token: body.data.access_token };
    })();

    const patchRes = await app.request("/api/v1/directory-ranking/config", {
      method: "PATCH",
      headers: { "content-type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ hot: { max_slots: 7 } }),
    });
    expect(patchRes.status).toBe(200);
    const patched = (await patchRes.json()) as { data: { config: { hot: { max_slots: number } } } };
    expect(patched.data.config.hot.max_slots).toBe(7);
  });
});
