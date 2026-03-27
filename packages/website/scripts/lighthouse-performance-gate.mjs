#!/usr/bin/env node
/**
 * W-14 / 补充 §10.4：对指定 URL 跑 Lighthouse Performance，门禁默认 ≥90（与 CTO 指令验收对齐）。
 * 用法：SITE_URL=https://example.com MIN_SCORE=90 npm run lighthouse:gate
 * 依赖：本机 Chrome / Chromium（与 lighthouse CLI 一致）。
 */
import { execSync } from "node:child_process";

const site = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
const minScore = Number(process.env.MIN_SCORE ?? "90");
const paths = (process.env.LIGHTHOUSE_PATHS || "/en,/zh-Hans,/zh-Hant/roadmap")
  .split(",")
  .map((p) => p.trim())
  .filter(Boolean);

let failed = false;

for (const segment of paths) {
  const url = `${site}${segment.startsWith("/") ? segment : `/${segment}`}`;
  const json = execSync(
    `npx --yes lighthouse "${url}" --only-categories=performance --output=json --quiet --chrome-flags="--headless --no-sandbox --disable-gpu"`,
    { encoding: "utf-8", maxBuffer: 50 * 1024 * 1024 },
  );
  const report = JSON.parse(json);
  const raw = report.categories?.performance?.score;
  const score = typeof raw === "number" ? Math.round(raw * 100) : 0;
  console.error(`Lighthouse Performance ${url}: ${score} (min ${minScore})`);
  if (score < minScore) {
    failed = true;
  }
}

if (failed) {
  console.error("lighthouse:gate FAILED — 有路径低于 MIN_SCORE");
  process.exit(1);
}

console.error("lighthouse:gate OK");
