# UNBJ context detection and validation map

## Detect the target

| Target | Fingerprints | Primary check |
| --- | --- | --- |
| CLI repository | `src/index.ts`, `templates/`, root `package.json` | `npm run build` |
| Preview | `preview-project/`, preview scripts at root | `npm run preview:typecheck` |
| Generated project | `apps/portal`, `apps/admin`, `packages/api`, `pnpm-workspace.yaml` | `pnpm typecheck` |

## Validation levels

1. **Always:** inspect `git status --short`; run `git diff --check`.
2. **Focused generation:** from the CLI repository run `npm run build`, then
   invoke `node dist/index.js` with the affected archetype, modules and locale
   into a unique `/private/tmp/unbj-...` directory. Run `pnpm install` and
   `pnpm typecheck` inside that generated project.
3. **Matrix:** run `node scripts/test-generator.mjs` when generation ordering,
   base templates, archetypes, i18n or module injection changed. It covers:
   - roles + all modules + `es-en`
   - plenarias + all modules + `es-en`
   - standard + no modules + `es`

## Important behavior

- Base templates copy first, then the selected archetype overlays them, then
  modules inject, and finally `.ejs` files render. A same-path base EJS can
  overwrite an archetype file.
- The full matrix removes and recreates `test-generation-build`; inspect that
  directory before running it.
- Preview refresh deletes and recreates `preview-project`; do not invoke it
  during validation unless the user explicitly requests it and the preview is
  stopped.
