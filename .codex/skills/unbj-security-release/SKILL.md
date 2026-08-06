---
name: unbj-security-release
description: Audit and remediate UNBJ Echo security or performance issues, and run safe release preflight/deployment for the CLI, preview, or generated platforms. Use for auth, Firebase rules, Storage CORS, signed URLs, Stripe, rate limits, dependency checks, release readiness, staging, or production deployment.
---

# UNBJ Security and Release

Use two explicit modes: **audit/remediation** and **release**. Read
`references/security-release-checklist.md` and detect whether the target is the
CLI repository, preview, or a generated platform before proceeding.

## Audit and remediation mode

1. Inspect source, rules, serverless config, dependencies, and existing audit
   documentation. Do not use live data or print secrets.
2. Classify findings by severity, exploitability, affected scope, and concrete
   evidence. Distinguish code fixes from infrastructure verification.
3. Present findings when the user asked only for an audit. Implement only when
   the user explicitly requests remediation.
4. When implementing, preserve deny-by-default Firebase access, canonical
   signed-upload paths, explicit CORS, least-privilege responses, and bounded
   queries. Validate the affected generated scenario and update the audit report
   plus `bitacora.md`.

## Release mode

1. Require a named target environment (`staging` or `prod`) and identify its
   Firebase project, Storage bucket, API URL, and portal/admin origins without
   exposing secret values.
2. Run non-mutating preflight: clean/diff review, typecheck, rules/indexes
   presence, environment-key presence, CORS origin comparison, webhook endpoint
   readiness, and cloud CLI authentication/status checks.
3. Present a short release plan with the exact target and commands. Require an
   explicit confirmation immediately before any Firebase, `gsutil`, Serverless,
   Amplify, Stripe, DNS, or other cloud mutation.
4. After approved execution, verify only non-sensitive state: deployment result,
   API endpoint, rules/index deployment, bucket CORS, and smoke paths. Record
   deployment details and unresolved follow-up in `bitacora.md`.

## Non-negotiable guardrails

- Never deploy to an inferred environment; `prod` always requires an explicit
  confirmation in the current turn.
- Never use wildcard CORS, public Storage writes, permanent signed URLs, or
  client-provided Storage paths as a shortcut.
- Never substitute a code-only check for required WAF, IAM, secret rotation,
  log retention, alarm, TTL, or load-test verification.
- Do not run destructive cleanup, reset, or credential rotation unless the user
  names the exact target and authorizes it.

## Success criteria

For an audit, deliver evidence-backed findings and a prioritized remediation
list. For a release, report target, checks, deployed components, verification,
and residual operational actions.
