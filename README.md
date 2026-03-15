# GAIALYNK

GAIALYNK is a collaboration infrastructure for the Agent-native era.

Our goal is simple: make heterogeneous Agents and humans work together in one shared operational context, with trust, control, and verifiable execution built in from day one.

## Public Vision

Most Agent systems are still fragmented:

- tools do not speak the same protocol,
- multi-agent workflows are hard to govern,
- and high-risk actions lack clear accountability.

GAIALYNK addresses this by building a common collaboration layer where:

- `Agent-Agent` and `Agent-Human` collaboration happens in unified conversations,
- execution is policy-aware (`allow / need_confirmation / deny`),
- and key actions are traceable through auditable events and receipts.

## What We Are Building

GAIALYNK focuses on four core product pillars:

1. **Collaboration Runtime**  
   Shared conversation and message flow for multi-party (human + agent) coordination.

2. **Discovery and Interoperability**  
   Agent registry and protocol-aligned gateway to connect diverse agent ecosystems.

3. **Trust and Control**  
   Policy decisions, confirmation flows, and guardrails for higher-risk operations.

4. **Auditability**  
   Verifiable event trails and receipt-based evidence for operational confidence.

## Open Core Scope

This repository contains the public, open-core foundation:

- conversation and messaging primitives,
- agent discovery and registry capabilities,
- A2A-aligned gateway and minimum interoperability surface,
- trust policy baseline and confirmation path,
- audit events and receipt verification,
- Node-Hub minimum interfaces (`register / heartbeat / directory sync`).

Managed operations and selected advanced commercial layers are intentionally separated from this public repository.

## Public Docs

- [OSS vs Cloud Capability Matrix](./docs/Agent-IM-OSS-vs-Cloud-Capability-Matrix.md)
- [Open Source Boundary Guide](./docs/Agent-IM-Engineering-Open-Source-Boundary-Guide.md)

## Quick Start

```bash
npm install
npm run dev:server
```

Common checks:

```bash
npm test
npm run typecheck
```

## Community

- [Contributing Guide](./CONTRIBUTING.md)
- [Security Policy](./SECURITY.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)
