# Deploying GaiaLynk (open core): Railway + Vercel (MVP)

This is a **sanitized, public** guide for contributors and self-hosters. It mirrors the internal runbook shape but **does not** include production secrets, founder-specific domains, or closed-source assets.

**Repository**: [GaiaLynk/gaialynk-A2A](https://github.com/GaiaLynk/gaialynk-A2A)

**Open core boundary**: See [README — Open Core Boundary](https://github.com/GaiaLynk/gaialynk-A2A#open-core-boundary). Never commit `.env`, keys, certificates, or production database dumps.

---

## 1. Architecture (MVP)

| Piece | Suggested host |
|--------|----------------|
| Mainline API + WebSocket | Railway (single service) |
| PostgreSQL | Railway plugin or managed Postgres |
| Redis | Railway plugin or managed Redis (recommended for realtime / capacity features) |
| Website (Next.js) | Vercel, **Root Directory** = `packages/website` |

---

## 2. Mainline (Railway)

1. Create a **Web** service from this repo (root `Dockerfile` builds and runs `npm run dev:server` — TypeScript via `tsx`; acceptable for MVP).
2. Attach **Postgres** and **Redis**; expose `DATABASE_URL` and `REDIS_URL` to the service (variable names must match what the server reads).
3. Set **`PORT`** from the platform (Railway injects this). The server reads `process.env.PORT`.
4. Set **`NODE_ENV=production`**.
5. Set secrets from the root **`.env.example`** checklist (copy locally; use the dashboard for real values): at minimum **`JWT_SECRET`**, and for connectors **`CONNECTOR_TOKEN_ENCRYPTION_KEY`** (≥32 chars), **`DESKTOP_CONNECTOR_PAIRING_SECRET`**, **`EXTERNAL_RECEIPT_SECRET`**.
6. After the first deploy, run migrations **once** against the production database (from a trusted environment):

   ```bash
   DATABASE_URL='postgresql://…' npm run db:migrate
   ```

   The migrator runs all `packages/server/src/infra/db/migrations/*.sql` in filename order. Treat schema changes carefully on non-empty databases.

7. Health check path: **`GET /api/v1/health`** (use HTTPS on your public URL).

---

## 3. Website (Vercel)

1. Import the **same** GitHub repo; set **Root Directory** to `packages/website`.
2. **Production** environment variables:
   - `NODE_ENV=production`
   - **`MAINLINE_API_URL`** = your mainline **HTTPS base URL** with **no trailing slash** (e.g. `https://xxxx.up.railway.app` or your API custom domain).
   - **`NEXT_PUBLIC_SITE_URL`** = the URL users open in the browser (e.g. `https://your-project.vercel.app` until you attach a custom domain).
3. Optional: **`NEXT_PUBLIC_DESKTOP_CONNECTOR_RELEASES_URL`** = GitHub Releases page for Desktop Connector binaries (defaults to this repo’s Releases if unset in code — verify in `packages/website/src/lib/product/desktop-connector-constants.ts`).
4. Production `next build` runs `scripts/check-env.mjs`: **`MAINLINE_API_URL` is required** when `NODE_ENV=production`.

---

## 4. OAuth (Google / Notion)

Register redirect URIs on the provider to match **your deployed mainline** paths (see server `cloud-proxy` routes). Also set **`CONNECTOR_OAUTH_SUCCESS_REDIRECT_URL`** to a **website** URL (typically the connectors OAuth-complete page under your locale).

Do **not** commit client secrets; store them only in Railway (or your secret manager).

---

## 5. Desktop Connector releases

- Build artifacts are usually produced with Tauri (`packages/connector`); signing keys stay **out** of git.
- Distribute binaries via **GitHub Releases** and point the website constant / env at that Releases URL.

---

## 6. CI parity

This repo’s GitHub Actions run typecheck, tests, contract checks, Postgres integration (with migrations), and a **production-style Next.js build** with a placeholder `MAINLINE_API_URL` so Vercel-style failures surface on PRs.

---

## 7. Where to get the full internal runbook

Team-only steps (founder materials, exact domain cutover, staged OAuth sign-off) live in private docs. This file is the **safe** subset for the public community.
