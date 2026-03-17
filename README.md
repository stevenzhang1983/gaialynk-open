# GaiaLynk

Build the trusted collaboration layer for the Agent Internet.

GaiaLynk is not another single-agent app framework.  
We are building a network where humans and heterogeneous agents can collaborate in one governed conversation space, with explicit trust decisions, human review, and verifiable receipts by default.

## Why GAIALYNK Is Different

Most agent projects optimize for raw capability. We optimize for reliable coordination in real environments.

- **Conversation-native network, not isolated tool calls**  
  We model collaboration as persistent conversations across five topologies (`T1` to `T5`), from single user + single agent to delegated agent-to-agent execution.
- **Trust as policy, not as marketing badge**  
  Every invocation is evaluated as a decision (`allow / allow_limited / need_confirmation / deny`) with auditable reason codes.
- **Human-in-the-loop where it actually matters**  
  High-risk actions flow through review queues with explicit approve/deny paths and evidence traces.
- **Proof over promises**  
  Key actions generate signed receipts and append-only audit evidence for replay, governance, and accountability.
- **Web-first, connector-extended product strategy**  
  Keep onboarding lightweight in web while progressively unlocking local execution through explicit authorization boundaries.

## Product Direction (2026 Calibration)

We are aligning execution around one near-term product truth:

**Let normal users describe a need and get useful results quickly, without learning agent protocols first.**

That means:

1. Strengthen reliable supply of high-quality professional agents.
2. Deliver a minimal consumer path (`Ask -> route -> result -> retry/fallback`).
3. Keep trust/governance visible but layered:
   - `L1` Result Layer (default)
   - `L2` Process Layer
   - `L3` Evidence Layer

## What Is Live in Open Core Today

This repository already includes a working mainline foundation:

- conversation APIs with human + agent participants,
- agent registration, discovery, and recommendation baseline,
- trust policy decisions and pending-confirmation invocation flow,
- review queue approve/deny workflow,
- audit event timeline and receipt verification,
- node registration, heartbeat, and directory sync minimum loop,
- public entry metrics endpoints for funnel and activation tracking.

## What Comes Next

Near-term phases focus on:

- supply-side onboarding quality gates for public agent templates,
- consumer-facing Ask flow and failover/rollback UX,
- user-owned recurring task lifecycle (`create/pause/resume/delete/history`),
- local connector governance (scoped permissions, revocation, action receipts),
- deeper A2A visualization and evidence export for advanced users.

## Open Core Boundary

Open core includes protocol-aligned collaboration, trust baseline, and verification primitives.

Managed cloud operations and selected advanced commercial capabilities remain outside this repository by design.

See:

- [GaiaLynk Vision](./docs/Agent-IM-Vision.md)

## Quick Start

```bash
npm install
npm run dev:server
npm run dev:website
```

Common checks:

```bash
npm test
npm run typecheck
```

Website release gate checks:

```bash
npm run release:gate:website
```

## Contribution Map

If you want to contribute quickly, start from one of these open-core tracks:

- **Mainline APIs** (`packages/server`)
  - conversation, trust policy, review queue, receipts, and observability baselines
- **Website Experience** (`packages/website`)
  - public narrative pages, entry funnel, SEO, and release-gate checks
- **Quality & Safety**
  - contract consistency, test coverage, and regression prevention in CI-friendly workflows

## Good First Contribution Themes

- improve failure recovery and fallback UX in user-facing flows,
- strengthen policy reason codes and error clarity in APIs,
- add focused tests for edge cases in trust/review/receipt workflows,
- improve docs clarity for developer onboarding and architecture understanding.

## Join Us

If you care about trustworthy multi-agent collaboration, cross-framework interoperability, and verifiable execution in production, we want your help.

- Build with us: [Contributing Guide](./CONTRIBUTING.md)
- Report issues responsibly: [Security Policy](./SECURITY.md)
- Keep the community healthy: [Code of Conduct](./CODE_OF_CONDUCT.md)
