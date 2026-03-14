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

If breaking:

- Migration notes:
- Rollback plan:

## Reviewer checklist

- [ ] Scope is focused and coherent
- [ ] Tests are sufficient and meaningful
- [ ] Naming and structure follow repository conventions
- [ ] Risk is acceptable for merge
