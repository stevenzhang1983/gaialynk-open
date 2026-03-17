import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

describe("mainline publisher identity tier (P0-2 E)", () => {
  it("GET /api/v1/public-agent-templates returns publisher_identity_tier and sort_weight", async () => {
    const app = createApp();
    const listRes = await app.request("/api/v1/public-agent-templates");
    expect(listRes.status).toBe(200);
    const body = await listRes.json();
    expect(Array.isArray(body.data)).toBe(true);
    for (const t of body.data) {
      expect(["anonymous", "verified", "certified"]).toContain(t.publisher_identity_tier);
      expect(typeof t.sort_weight).toBe("number");
      expect(t.sort_weight).toBeGreaterThanOrEqual(1);
      expect(t.sort_weight).toBeLessThanOrEqual(3);
    }
  });

  it("POST /api/v1/publishers creates publisher with identity_tier; PATCH updates tier", async () => {
    const app = createApp();
    const createRes = await app.request("/api/v1/publishers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ identity_tier: "verified" }),
    });
    expect(createRes.status).toBe(201);
    const createBody = await createRes.json();
    const publisherId = createBody.data.id as string;
    expect(createBody.data.identity_tier).toBe("verified");

    const getRes = await app.request(`/api/v1/publishers/${publisherId}`);
    expect(getRes.status).toBe(200);
    expect((await getRes.json()).data.identity_tier).toBe("verified");

    const patchRes = await app.request(`/api/v1/publishers/${publisherId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ identity_tier: "certified" }),
    });
    expect(patchRes.status).toBe(200);
    expect((await patchRes.json()).data.identity_tier).toBe("certified");

    const notFoundRes = await app.request("/api/v1/publishers/00000000-0000-0000-0000-000000000099");
    expect(notFoundRes.status).toBe(404);
  });

  it("template list sorts by tier (certified first, then verified, then anonymous)", async () => {
    const app = createApp();
    const anonRes = await app.request("/api/v1/publishers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ identity_tier: "anonymous" }),
    });
    const verifiedRes = await app.request("/api/v1/publishers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ identity_tier: "verified" }),
    });
    const certifiedRes = await app.request("/api/v1/publishers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ identity_tier: "certified" }),
    });
    const anonId = (await anonRes.json()).data.id as string;
    const verifiedId = (await verifiedRes.json()).data.id as string;
    const certifiedId = (await certifiedRes.json()).data.id as string;

    await app.request("/api/v1/public-agent-templates", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Anonymous Template",
        category: "test",
        major_version: 1,
        minor_version: 0,
        source_url: "https://example.com/anon",
        publisher_id: anonId,
      }),
    });
    await app.request("/api/v1/public-agent-templates", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Verified Template",
        category: "test",
        major_version: 1,
        minor_version: 0,
        source_url: "https://example.com/verified",
        publisher_id: verifiedId,
      }),
    });
    await app.request("/api/v1/public-agent-templates", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Certified Template",
        category: "test",
        major_version: 1,
        minor_version: 0,
        source_url: "https://example.com/certified",
        publisher_id: certifiedId,
      }),
    });

    const listRes = await app.request("/api/v1/public-agent-templates");
    expect(listRes.status).toBe(200);
    const list = (await listRes.json()).data as Array<{ name: string; publisher_identity_tier: string; sort_weight: number }>;
    const certifiedFirst = list.find((t) => t.name === "Certified Template");
    const verifiedSecond = list.find((t) => t.name === "Verified Template");
    const anonThird = list.find((t) => t.name === "Anonymous Template");
    expect(certifiedFirst).toBeDefined();
    expect(verifiedSecond).toBeDefined();
    expect(anonThird).toBeDefined();
    expect(certifiedFirst!.publisher_identity_tier).toBe("certified");
    expect(certifiedFirst!.sort_weight).toBe(3);
    expect(verifiedSecond!.publisher_identity_tier).toBe("verified");
    expect(verifiedSecond!.sort_weight).toBe(2);
    expect(anonThird!.publisher_identity_tier).toBe("anonymous");
    expect(anonThird!.sort_weight).toBe(1);
    const idxCert = list.indexOf(certifiedFirst!);
    const idxVer = list.indexOf(verifiedSecond!);
    const idxAnon = list.indexOf(anonThird!);
    expect(idxCert).toBeLessThan(idxVer);
    expect(idxVer).toBeLessThan(idxAnon);
  });
});
