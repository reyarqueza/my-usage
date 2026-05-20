<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Tests

Run **`npm test`** before finishing changes that touch `lib/`, `app/actions/`, or `proxy.ts`. Coverage scope and thresholds are defined in **`vitest.config.ts`** (`npm run test:coverage`).

## CI

Pull requests must pass [`.github/workflows/ci.yml`](.github/workflows/ci.yml) (`npm run test:coverage` with scoped **100%** thresholds). Do not lower coverage `include` globs or thresholds unless the user explicitly asks. Codecov upload on CI is informational on PRs; enforcement is Vitest in the workflow.
