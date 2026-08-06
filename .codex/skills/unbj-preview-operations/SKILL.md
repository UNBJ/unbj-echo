---
name: unbj-preview-operations
description: Diagnose, start, stop, refresh, configure, and validate the UNBJ Echo preview-project. Use when working with local preview ports 3100/3102/3001, preview environment files, Firebase/Stripe test wiring, CORS upload errors, or preview regeneration.
---

# UNBJ Preview Operations

Operate `preview-project` without losing user state or weakening production-like
security controls. Read `references/preview-runbook.md` before refreshing,
starting services, or changing cloud configuration.

## Workflow

1. Inspect running listeners on ports 3100 (portal), 3102 (admin), and 3001
   (API), then inspect preview environment file presence without printing
   secrets.
2. For diagnosis, prefer read-only checks: browser/API errors, application logs,
   relevant handler/configuration, Firebase rules, and Storage CORS policy.
3. Use the narrow command for the required service. Use
   `npm run preview:typecheck` after code/template refreshes.
4. Before `preview:generate`, `preview:refresh`, or `preview:clean`, explain
   that it deletes and recreates `preview-project`; require explicit confirmation
   and ensure all preview services are stopped.
5. Before Firebase, Stripe, Storage, or other cloud changes, identify the exact
   project/bucket/environment and require explicit confirmation. Never change
   Storage Rules to solve a browser CORS error.
6. Record a concise `bitacora.md` entry after material preview configuration,
   functional, security, or documentation work requested by the user.

## Safety rules

- Do not reveal credential values in `.env`, logs, screenshots, or reports.
- Keep preview credential placeholders separate from real test credentials.
- Treat `preview-project` as generated output: change templates first whenever a
  fix must survive the next refresh; make a direct preview change only when the
  user needs an immediate local verification.
- Do not kill processes, reset worktrees, clean directories, or run deploys
  without explicit user authorization.

## Success criteria

State which process, configuration, or cloud policy was verified or changed;
include the next browser action and any restart/reload required.
