# Preview runbook

## Commands

| Command | Purpose |
| --- | --- |
| `npm run preview:generate` | Build CLI, regenerate preview, write placeholders |
| `npm run preview:install` | Install preview dependencies |
| `npm run preview:refresh` | Regenerate preview and install dependencies |
| `npm run preview:typecheck` | Typecheck all preview workspaces |
| `npm run preview:dev:portal` | Start portal on 3100 |
| `npm run preview:dev:admin` | Start admin on 3102 |
| `npm run preview:dev:api` | Start API on 3001 |

## Pre-refresh gate

`preview:refresh` removes `preview-project`. Check ports 3100, 3102 and 3001
first. Stop the associated process only after the user authorizes it. Do not use
refresh to patch generated output permanently; update `templates/` first.

## Environment locations

- API: `preview-project/packages/api/.env`
- Portal: `preview-project/apps/portal/.env.local`
- Admin: `preview-project/apps/admin/.env.local`

Keep Firebase Admin credentials only in the API file. Restart the relevant
Next.js or Serverless process after changing environment variables.

## Frequent diagnoses

| Symptom | Check |
| --- | --- |
| Storage CORS error on a signed upload | Verify bucket CORS contains the exact portal origin and PUT/Content-Type; keep Storage Rules deny-by-default. |
| Admin 401 | Refresh Firebase sign-in after assigning `role` custom claim. |
| Stripe payment pending | Run `stripe listen --forward-to http://localhost:3001/webhooks/stripe` and update the temporary webhook secret. |
| Voting listener permission denied | Deploy current Firestore rules; validate portal temporary session or admin role claim. |
| UI does not reflect template change | Verify preview was refreshed after the template edit, then restart dev server and hard reload. |
