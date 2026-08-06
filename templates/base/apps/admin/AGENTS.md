# Admin agent instructions

The admin app is a protected Next.js dashboard backed by Firebase
Authentication and API role checks.

- Preserve `admin`/`super_admin` role enforcement in the API; UI hiding is not
  authorization.
- Use the shared labels, branding, types, and existing UI primitives.
- Avoid loading complete Firestore collections in the browser. Use API cursor
  pagination and bounded queries.
- Treat registration details, exports, documents, and tokens as sensitive PII.
- Keep confirmation dialogs for resend, destructive, or state-transition actions.

Read `docs/agent/data-api.md` for endpoint contracts and
`docs/agent/operations.md` for release/check-in workflows.
