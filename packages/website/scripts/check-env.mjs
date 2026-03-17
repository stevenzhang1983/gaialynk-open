#!/usr/bin/env node
/**
 * Build-time env check. In production, required env vars must be set or build is blocked.
 * Staging/prod should keep same structure to avoid "only works locally".
 */
const isProd = process.env.NODE_ENV === "production";
if (!isProd) {
  process.exit(0);
}

const required = [
  { key: "MAINLINE_API_URL", hint: "Mainline API base URL for proxy (e.g. https://api.gaialynk.com)" },
];
const missing = required.filter(({ key }) => !process.env[key]?.trim());

if (missing.length) {
  console.error("Build blocked: missing required environment variables for production:");
  missing.forEach(({ key, hint }) => console.error(`  - ${key}: ${hint}`));
  process.exit(1);
}

process.exit(0);
