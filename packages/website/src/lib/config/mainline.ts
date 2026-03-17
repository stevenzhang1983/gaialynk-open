/**
 * Mainline API base URL (server-side only).
 * Used by Next.js API routes to proxy requests to the mainline Hono server.
 * Production: set MAINLINE_API_URL to your gateway (e.g. https://api.gaialynk.com).
 */
export function getMainlineApiUrl(): string {
  const url = process.env.MAINLINE_API_URL ?? "http://localhost:3000";
  return url.replace(/\/$/, "");
}
