---
name: unbj-template-validation
description: Validate UNBJ Echo generator, template, archetype, module, preview, or generated-project changes. Use when editing templates, EJS generation, module injection, CLI flags, shared contracts, or when asked to generate and typecheck an affected UNBJ platform safely.
---

# UNBJ Template Validation

Validate the smallest reliable surface first, then expand coverage only when the
change can alter generation across scenarios. Read
`references/context-detection.md` before choosing commands.

## Workflow

1. Identify the target: CLI repository, `preview-project`, or a generated
   monorepo. Inspect `git status`, the diff, and active processes before acting.
   Preserve unrelated user changes.
2. Always run `git diff --check`. Build the CLI when source, template, or
   generator files changed.
3. Select validation depth:
   - For a generated project, run its `pnpm typecheck`.
   - For a localized template/module change, generate the affected archetype and
     module selection in a unique `/private/tmp` directory, install dependencies
     if needed, then run its typecheck.
   - For `src/utils/generator.ts`, `src/index.ts`, base templates, archetype
     overlay behavior, or module injection configuration, run
     `node scripts/test-generator.mjs` after confirming that its working test
     directory is disposable.
4. Never refresh or delete `preview-project` as part of validation. Hand off to
   `$unbj-preview-operations` when the preview must be regenerated.
5. Report the exact scenario, commands, result, and remaining untested surface.
   When the user also requested code changes, add a concise `bitacora.md` entry
   for functional, security, release, or documentation changes.

## Safety rules

- Generate temporary validation projects outside the repository.
- Ask before installing missing dependencies, running the full matrix when its
  existing test directory contains user work, or changing cloud state.
- Do not modify templates merely to make a test pass without explaining the
  failure and applying the user-requested fix.
- Do not expose `.env` values, service-account keys, payment keys, or signed
  URLs in command output or reports.

## Success criteria

Finish only after the selected check passes or after reporting the first
reproducible failure with its generated project preserved for diagnosis.
