# Security and release checklist

## Application audit

### Identity and data

- Verify admin JWT role checks and portal token expiration/revocation.
- Verify public endpoints use explicit DTOs and `Cache-Control: no-store` for
  capability-token responses.
- Verify input schemas, ownership checks, rate limits, and transaction safety.
- Verify CSV formula protection and HTML escaping for user-controlled values.

### Firebase and files

- Verify `firebase.json` tracks Firestore rules, indexes, and Storage rules.
- Keep Firestore and Storage deny-by-default; expose only minimal read
  projections for real-time voting.
- Verify signed uploads have a short expiry, a canonical server-created path,
  MIME/size validation, and backend confirmation.
- Verify bucket CORS contains exact portal origins and required methods/headers;
  never solve CORS by opening Storage Rules.

### API, payments, and performance

- Verify explicit API CORS origins, security headers, dependency versions, and
  no secrets in responses/logs.
- Verify Stripe webhook signature validation and a separate test/live setup.
- Verify cursor pagination, required Firestore indexes, bounded result lists,
  caches where appropriate, and real-time listeners instead of high-frequency
  polling.
- Verify Lambda timeout/memory/tracing and document WAF, concurrency, alarms,
  IAM, KMS/Secrets Manager, TTL, and load testing as infrastructure controls.

## Release preflight

1. Name the environment and capture non-secret identifiers: Firebase project,
   bucket, API URL, portal origin, admin origin, Stripe mode.
2. Run typecheck and inspect the intended diff. Ensure rules, indexes and CORS
   files are included.
3. Verify required environment variable names exist without reading values.
4. Verify `firebase`/`gcloud`/`gsutil`/AWS/Serverless authentication as needed.
5. Confirm Stripe webhook URL and Resend sender/domain readiness.
6. Present exact mutating commands. Wait for current-turn confirmation.

## Post-release smoke checks

- Open portal and admin over HTTPS.
- Register a test user, complete the payment/webhook test, and receive email.
- Confirm portal access, document upload/download authorization, admin role,
  check-in, and any enabled module.
- For voting, verify a portal listener connects, one vote is accepted, an admin
  sees the count, and closed results are visible only after closing.
