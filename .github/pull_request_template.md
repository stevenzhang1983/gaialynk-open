## What changed

- [ ] Describe the core change in 1-3 bullets
- [ ] Link issue/task (if any): `#<id>`

## Why this change

Explain the intent and expected outcome.

## Impact areas

- [ ] API behavior
- [ ] Trust policy decision flow
- [ ] Audit/receipt chain
- [ ] CI / developer workflow
- [ ] Documentation

## Test plan

- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] Manual verification steps included (if needed)

Manual steps:

1.
2.
3.

## Security and trust checklist

- [ ] No secrets or credentials introduced
- [ ] Error responses keep `{ error: { code, message } }` shape
- [ ] High-risk flows still require confirmation
- [ ] Critical-risk flows are not auto-executed
- [ ] Audit events generated for key trust decisions
- [ ] Receipt verification remains valid for completion path

## Breaking changes

- [ ] No breaking changes
- [ ] Breaking changes documented below

## Contract impact declaration (required for mainline API changes)

- [ ] This PR does not affect baseline contracts (`/public/entry-events`, `/public/entry-metrics`, `/agents/recommendations`, `/nodes/health`, `/nodes/relay/invoke`)
- [ ] This PR affects baseline contracts and I have updated:
  - [ ] `docs/contracts/mainline-api-contract-baseline.v1.json`
  - [ ] `packages/server/tests/mainline-contract-compatibility.test.ts`
  - [ ] Migration / version notes in PR description

## One-click deploy path declaration (required if touching deploy/usage APIs)

- [ ] This PR does not affect one-click deploy baseline path (`/deploy/templates`, `/deploy/templates/:templateId/instantiate`, `/deployments/:deploymentId/activate`, `/usage/limits`)
- [ ] This PR affects one-click deploy baseline path and I have updated:
  - [ ] `packages/server/tests/mainline-contract-compatibility.test.ts`
  - [ ] Migration / version notes in PR description

If breaking:

- Migration notes:
- Rollback plan:

## Reviewer checklist

- [ ] Scope is focused and coherent
- [ ] Tests are sufficient and meaningful
- [ ] Naming and structure follow repository conventions
- [ ] Risk is acceptable for merge
