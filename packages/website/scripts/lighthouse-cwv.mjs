#!/usr/bin/env node
/**
 * 对当前线上 Visit 跑 Lighthouse Performance（与 CTO Directive §9 / T-6.4 对齐）。
 * 用法：SITE_URL=https://gaialynk-a2a.vercel.app npm run lighthouse:cwv
 * 报告写入仓库根 artifacts/cwv-lighthouse/（默认 gitignore）。
 */
import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..", "..");
const outDir = join(repoRoot, "artifacts", "cwv-lighthouse");

const site = (process.env.SITE_URL || "https://gaialynk-a2a.vercel.app").replace(/\/$/, "");
const paths = ["/zh-Hans", "/en", "/zh-Hant/roadmap"];

mkdirSync(outDir, { recursive: true });

for (const segment of paths) {
  const url = `${site}${segment}`;
  const safe = segment.replace(/\//g, "_").replace(/^_/, "") || "root";
  const outBase = join(outDir, `report-${safe}`);
  console.error(`Lighthouse: ${url}`);
  execSync(
    `npx --yes lighthouse "${url}" --only-categories=performance --output=json --output=html --output-path="${outBase}" --chrome-flags="--headless --no-sandbox --disable-gpu"`,
    { stdio: "inherit" },
  );
}

console.error(`Done. Open ${outDir} for HTML/JSON reports.`);
