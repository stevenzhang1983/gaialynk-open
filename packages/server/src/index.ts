import { serve } from "@hono/node-server";
import { createApp } from "./app";

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
