# Portal agent instructions

The portal is a Next.js App Router client/server application. Keep user-facing
components accessible, localized, and compatible with the shared types.

- Use `@unbj/shared` for registration, branding, constants, and labels.
- Keep public Firebase Client access limited to the rules-approved projections.
- Never put Firebase Admin credentials, Stripe secret keys, Resend keys, or
  service-account material in this app or in `NEXT_PUBLIC_*` variables.
- Send mutations through `packages/api`; validate loading, error, retry, and
  authorization states in the UI.
- Preserve `es`/`en` message keys when editing localized components.
- For voting listeners, keep Firestore projections read-only from the browser.

Read `docs/agent/architecture.md` and `docs/agent/data-api.md` when a change
crosses the portal/API boundary.
