# Backend and shared-package instructions

`packages/api` contains Serverless Lambda handlers and `packages/shared`
contains contracts consumed by portal/admin/API.

- Authenticate at every protected handler and validate bodies/params with Zod.
- Return safe DTOs with no-store headers where capability tokens or PII are
  involved. Never return internal Storage paths or service credentials.
- Keep signed Storage paths canonical, short-lived, MIME/size checked, and
  confirmed by the backend.
- Use Firestore transactions for votes, capacity, payment/state transitions,
  and other coupled writes. Add indexes for new bounded queries.
- Keep webhook signature verification and idempotent state transitions intact.
- Update shared types before consuming new fields in apps, then typecheck all
  workspaces.

Read `docs/agent/data-api.md` before changing routes or collections and
`docs/agent/operations.md` before changing deployment configuration.
