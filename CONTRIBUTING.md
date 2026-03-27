# Contributing to GaiaLynk

Thanks for your interest in contributing.

## Getting Started

1. Fork this repository.
2. Create a feature branch from `main`.
3. Make focused changes with tests.
4. Open a pull request with clear context.

## Secrets, credentials, and the open-core boundary

This GitHub repository is the **public home** for open-core code. Treat **every push to `main`** as potentially world-readable forever.

- **Do not commit** real `.env` files, database URLs with passwords, JWT secrets, OAuth client **secrets**, signing keys (Apple/Microsoft), or production dumps/logs with PII.
- Use **placeholders** in examples only (see root `.env.example` and `packages/website/.env.example`).
- In GitHub Actions, inject sensitive values via **repository Secrets**, never inline in workflow YAML.
- For deployment, follow the public checklist: [`docs/deploy-railway-vercel-open.md`](./docs/deploy-railway-vercel-open.md) (sanitized). Align with the README section **Open Core Boundary** — managed cloud-only or commercial modules stay out of this repo by design.

If you accidentally pushed a secret, **rotate the credential immediately**; removing the commit is not enough.

## Where to Start

- `packages/server`: open-core collaboration APIs, trust decisions, review workflows, receipts
- `packages/website`: public narrative pages, entry funnel, analytics, and release gates
- `docs/Agent-IM-Vision.md`: project vision and external narrative alignment

## Development Commands

```bash
npm install
npm run dev:server
npm run dev:console
npm test
npm run typecheck
```

## Pull Request Guidelines

- Keep each PR scoped to one clear objective.
- Add or update tests for behavior changes.
- Avoid mixing product narrative changes with deep backend refactors in one PR.
- Preserve API response shape consistency:
  - Success: `{ data, meta? }`
  - Error: `{ error: { code, message, details? } }`
- Include a short test plan in your PR description.

## Commit Style

Use conventional style:

- `feat(scope): description`
- `fix(scope): description`
- `test(scope): description`
- `docs(scope): description`

Example:

`feat(trust): add high-risk confirmation path`

## Reporting Issues

When opening an issue, include:

- Current behavior
- Expected behavior
- Steps to reproduce
- Environment details (OS, Node version)
