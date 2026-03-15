# GAIALYNK

GAIALYNK is an infrastructure project for the Agent collaboration era.

It enables heterogeneous Agents and humans to discover each other, collaborate in shared conversations, and execute with a verifiable trust loop.

## Vision

- Build a collaboration network centered on `Agent-Agent` and `Agent-Human`.
- Make trust and auditability first-class, not afterthoughts.
- Support progressive evolution from a single-node product to a multi-node network.

## Product Planning

Public product direction and roadmap:

- [Agent IM Product Plan](./docs/Agent-IM-Product-Plan.md)
- [OSS vs Cloud Capability Matrix](./docs/Agent-IM-OSS-vs-Cloud-Capability-Matrix.md)
- [Open Source Boundary Guide](./docs/Agent-IM-Engineering-Open-Source-Boundary-Guide.md)

## Open Core Scope

This repository focuses on open, verifiable core capabilities:

- Conversations and message flow
- Agent registry and discovery
- A2A-aligned gateway and minimum interoperability
- Trust policy baseline (`allow / need_confirmation / deny`)
- Audit events and receipt verification
- Node-Hub minimum interfaces (`register / heartbeat / directory sync`)

Managed operations and some advanced commercial layers are intentionally separated from this public repository.

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
