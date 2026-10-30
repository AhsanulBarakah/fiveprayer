# FivePrayer — repository conventions

## Commit messages

- **No AI attribution.** Do not add `Co-Authored-By:` trailers for assistants or
  tools, and no "Generated with …" lines. The author of a commit is the person
  committing; nothing else is credited in the message.
- Imperative subject, then a short body explaining *why* the change was made —
  match the existing history rather than the "what".
- Only the files that belong to the change; do not sweep unrelated edits in.

## Before committing

- `npm install` enables `.githooks/pre-commit` (or run `npm run hooks:install`).
  It lints staged PHP, typechecks, and runs the unit and TV-display suites.
- Do not use `--no-verify` or `SKIP_CHECKS=1` unless the user asks for it; if a
  check fails, fix the cause.
- GitHub runs the same checks plus the production build and the PHP integration
  suites (`.github/workflows/checks.yml`).

## Where things live

- `src/admin/` — React admin app; `php/` — plugin classes; `blocks/` — block
  editor sources; `docs/` — markdown documentation (not shipped).
- Shortcodes are registered in `php/classes/core/ShortCodes/`; the reference in
  the admin Docs and `docs/SHORTCODES.md` is kept in step by
  `tests/js/unit/docs-shortcodes.test.tsx`.
