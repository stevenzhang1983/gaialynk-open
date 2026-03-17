import { serve } from "@hono/node-server";
import { createApp } from "./app";

// 2.1 Launch Closure: fail-fast on missing critical config when requested.
if (process.env.FAIL_FAST_CONFIG === "1") {
  const required: string[] = [];
  if (process.env.REQUIRE_DATABASE_URL === "1") {
    required.push("DATABASE_URL");
  }
  for (const key of required) {
    if (!process.env[key]?.trim()) {
      console.error(`[FAIL_FAST_CONFIG] Missing required env: ${key}`);
      process.exit(1);
    }
  }
}

const port = Number(process.env.PORT ?? "3000");

serve(
  {
    fetch: createApp().fetch,
    port,
  },
  (info) => {
    // Keep startup output simple for local demo runs.
    console.log(`GAIALYNK server listening on http://localhost:${info.port}`);
  },
);
