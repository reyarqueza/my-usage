---
name: vitest-scoped-coverage
description: >-
  Vitest unit tests for this Next.js repo — happy-dom, v8 coverage, and 100%
  thresholds only on a fixed surface (lib, app/actions, proxy). Use when adding
  or changing tests, coverage config, or mocking @/auth for server actions and
  proxy.ts. Do not expand coverage include globs or lower thresholds unless the
  user explicitly asks.
disable-model-invocation: false
---

# Vitest scoped coverage (my-usage)

This repository uses **Vitest** with **scoped instrumentation**: coverage is collected and enforced **only** for specific paths, at **100%** for lines, branches, functions, and statements on that set. Everything else may be untested in unit runs by design.

## Source of truth

- Config: [`vitest.config.ts`](../../../vitest.config.ts) at the repo root  
- npm scripts: `test`, `test:watch`, `test:coverage` in [`package.json`](../../../package.json)

## Stack (do not change without reason)

| Piece | Role |
| --- | --- |
| `vitest` | Test runner |
| `@vitest/coverage-v8` | Coverage provider |
| `happy-dom` | DOM-like test environment |

## Coverage scope (non-negotiable defaults)

**Instrumented paths** (`coverage.include`):

- `lib/**/*.ts`
- `app/actions/**/*.ts`
- `proxy.ts` (repo root)

**Thresholds:** all **100%** — `lines`, `functions`, `branches`, `statements`.

**Exclude** from coverage reports (adjust): `*.test.*`, `*.config.*`, optional `types/` mirror if added.

Treat **`auth.ts`**, **API routes**, **async RSC pages**, and **presentational UI** as **outside** this unit scope unless the user asks to widen the policy.

## `vitest.config.ts` requirements

- **`resolve.alias`:** `"@"` → repo root (`path.resolve(process.cwd(), ".")`) so imports like `@/auth` resolve in tests.
- **`test.environment`:** `happy-dom`
- **`test.include`:** `**/*.test.{ts,tsx}`
- **`coverage.provider`:** `v8`
- **`coverage.reporter`:** at least `text` (and `html` if useful locally).

## Test file placement

- Co-locate: `lib/foo.test.ts` next to `lib/foo.ts`, `app/actions/auth.test.ts` next to `auth.ts`, `proxy.test.ts` next to root `proxy.ts`.
- Prefer **one concern per file**; use `describe` blocks for cases.

## Mocking Auth.js / `@/auth`

Server modules import `@/auth` (`signIn`, `signOut`, `auth`). In unit tests:

- **`vi.mock("@/auth", () => ({ ... }))`** at the top of the test file (Vitest hoists mocks).
- For **server actions** (`app/actions/auth.ts`): mock `signIn` / `signOut`; assert call args.
- For **`proxy.ts`:** mock `auth` so `auth((cb) => …)` returns **`Promise.resolve(handler)`** where `handler` invokes the callback with a `NextRequest`-like object when you need to exercise redirect logic.

## Modules with top-level `auth()` / promises

If the module under test runs **`auth(...)` at import time** (e.g. `proxy.ts` building `authenticatePromise`), use **`vi.resetModules()`** between scenarios and **dynamic `import()`** so each test can register a different mock **before** the module loads.

## Housekeeping

- **ESLint:** ignore generated **`coverage/**`** (see [`eslint.config.mjs`](../../../eslint.config.mjs)).
- **Git:** keep **`/coverage`** ignored (already in [`.gitignore`](../../../.gitignore)).
- After substantive changes: run **`npm run test:coverage`** and **`npm run lint`**.

## Verification checklist

1. `npm run test:coverage` exits **0** and shows **100%** on all rows in the coverage table for the scoped files.
2. No secrets or real OAuth in tests — only mocks.
3. Do not commit `coverage/` HTML output.
