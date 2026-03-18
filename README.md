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

## Product Direction 

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

**Mainline contract drift** (used in CI / preflight): compares the server to `docs/contracts/mainline-api-contract-baseline.v1.json`. **First enable or fresh repo:** run `node --import tsx scripts/mainline-contract-drift-report.ts --init-baseline` and commit that file. See `docs/contracts/README.md`.

Website release gate checks (typecheck + governance tests, including promise consistency and API health for "Now" capabilities):

```bash
npm run release:gate:website
```

When the mainline server is not running (e.g. CI), set `RELEASE_GATE_SKIP_API_HEALTH=1` to skip live API health checks so the gate can still pass.

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

## Founder Note

Hi, I’m Steven.

I have zero professional background in software engineering.  
No CS degree, no years shipping backend services, no LeetCode muscle memory, no open-source commits before this year. Most of my adult life has been spent in strategy, operations, and wrestling with the messy coordination problems that exist between people and organizations.

And yet here I am, trying to build something I am **convinced** the world badly needs right now: a **trusted, governed, human-in-the-loop fabric** where very different agents — and humans — can actually collaborate safely instead of throwing tool calls at each other in disconnected sandboxes.

Why now? Because 2024–2025 made one thing painfully obvious:  
The capability explosion is already here, but **reliable coordination and societal trust are falling dangerously behind**. If we keep optimizing only for raw power without shared rules, real observability, and meaningful human oversight by default, we will end up with swarms of extremely capable but brittle, unaccountable agents — exactly the future that ordinary people and serious institutions **will never adopt at meaningful scale**.

I cannot build this vision by myself. I know that very clearly.  
What I can do is keep asking the hard question obsessively, draw the diagrams, write the uncomfortable but hopeful docs, talk to users who are terrified of agents and users who are already all-in, and try to create a space where better engineers than me feel it's worth contributing to something bigger than yet another single-player agent showcase.

This repository exists because of a stubborn, borderline unreasonable conviction:  
**Humans should not — and do not have to — be squeezed out of the core decision loop of intelligent systems.**  
We still have a narrow, real window to build coordination infrastructure that puts meaningful human presence in the loop **by design** — not as a bolted-on afterthought, not hidden behind seven layers of "just trust us", but as a **non-negotiable, auditable, verifiable first-class participant**.  
This is not a nice-to-have. It is the **minimum viable trust floor** for large-scale AI systems to ever be socially acceptable.

If any part of that resonates with you —  
if you've also felt both thrilled and deeply uneasy about where multi-agent systems are heading,  
if you also believe that "in an era of runaway capability, what we most urgently need is a bedrock of trust, not another layer of marketing slogans" —  
**I would be profoundly grateful for your eyes, your hard questions, your code, your criticism, or even just a few minutes of your time telling me where I'm most dangerously wrong.**

Thank you for reading this far.  
Let's try to build something that is **genuinely worthy of trust — and that can withstand the test of time**.

— Steven  
March 2026 China

## Join Us

If you care about trustworthy multi-agent collaboration, cross-framework interoperability, and verifiable execution in production, we want your help.

- Build with us: [Contributing Guide](./CONTRIBUTING.md)
- Report issues responsibly: [Security Policy](./SECURITY.md)
- Keep the community healthy: [Code of Conduct](./CODE_OF_CONDUCT.md)
