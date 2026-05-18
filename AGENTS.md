<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Tests

Run **`npm test`** before finishing changes that touch `lib/`, `app/actions/`, or `proxy.ts`. Coverage scope and thresholds are defined in **`vitest.config.ts`** (`npm run test:coverage`).
