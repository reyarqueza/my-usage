# My Usage

[![codecov](https://codecov.io/gh/reyarqueza/my-usage/graph/badge.svg)](https://codecov.io/gh/reyarqueza/my-usage)

Next.js 16 (App Router) with **GitHub-only Auth.js** (next-auth v5), **Neon Postgres** via `@auth/neon-adapter` and `@neondatabase/serverless`, and **shadcn/ui**. **next-themes** provides light/dark styling (default **light** on first load).

**Routes:** `/` redirects by session; `/login` is the hero + GitHub sign-in card; `/dashboard` is protected by **Next.js 16 `proxy.ts`** (Auth.js session gate).

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tests

Unit tests run with **Vitest** and **happy-dom**. Coverage is limited to **`lib/**/*.ts`**, **`app/actions/**/*.ts`**, and **`proxy.ts`**, with **100%** thresholds on statements, branches, functions, and lines for those files (see [`vitest.config.ts`](vitest.config.ts)).

```bash
npm test              # single run (CI-style)
npm run test:watch    # watch mode while developing
npm run test:coverage # coverage report + threshold enforcement
```

HTML coverage output is written under `coverage/` (ignored by git and ESLint).

## CI and coverage

Every **push** and **pull request** to `main` runs [`.github/workflows/ci.yml`](.github/workflows/ci.yml):

1. `npm ci` and `npm run test:coverage` (same scoped **100%** thresholds as local).
2. A **job summary** on the Actions run (open the run → **Summary**) with the Vitest coverage table.
3. Upload of `coverage/lcov.info` to [Codecov](https://codecov.io/gh/reyarqueza/my-usage) when tests pass.

Codecov tracks **scoped unit coverage** (`lib/`, `app/actions/`, `proxy.ts`) — not the full Next.js app. Merge is enforced by Vitest thresholds in CI (and your branch ruleset); Codecov adds PR comments, history, and the badge above.

**Code scanning:** if your ruleset requires it, enable **CodeQL** under **Settings → Code security and analysis** so PRs get code scanning results on `main`.

### Repository secrets (maintainers)

| Secret | Used by |
| --- | --- |
| `CODECOV_TOKEN` | CI → Codecov upload |
| `REYARQUEZA_BOT_TOKEN` | [Bot approve PR](.github/workflows/bot-approve-pr.yml) workflow |

### Manual PR approval (optional)

When branch rules require a review you cannot self-approve:

1. Ensure **`reyarqueza-bot`** is a collaborator with **Write** access and `REYARQUEZA_BOT_TOKEN` is set.
2. **Actions → Bot approve PR → Run workflow** → choose the branch with the workflow file → enter the **PR number**.
3. The PR shows an approval from **reyarqueza-bot**; merge separately if CI and other checks are green.

**Environment:** create **`.env.local`** (do not commit) with at least:

| Variable | Role |
| --- | --- |
| `DATABASE_URL` | Neon Postgres connection string |
| `AUTH_SECRET` | Required — e.g. `openssl rand -base64 32` |
| `AUTH_URL` | e.g. `http://localhost:3000` locally; production site URL on Vercel |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | GitHub OAuth App |

Architecture, schema, and file-level notes live in [`auth-plan.md`](auth-plan.md).

## Manual setup of Vercel, GitHub, and Neon

Do these in any order, but **Neon schema** and **GitHub OAuth** must be ready before sign-in works.

### 1. Neon (database)

1. Create a **Neon** project and database (via [neon.tech](https://neon.tech) or the **Vercel → Storage → Neon** integration on your Vercel project).
2. Open the Neon **SQL Editor** and run the script in [`scripts/auth-schema.sql`](scripts/auth-schema.sql) (tables: `users`, `accounts`, `sessions`, `verification_token`).
3. Copy the **connection string** (`postgresql://…`) and set it as **`DATABASE_URL`** in `.env.local` (and in Vercel for deployments).

If you use the **Vercel Neon integration**, link the database to the project so `DATABASE_URL` can be managed in the Vercel dashboard.

### 2. GitHub OAuth (sign-in)

Auth.js expects the default GitHub callback path **`/api/auth/callback/github`** (see [`app/api/auth/[...nextauth]/route.ts`](app/api/auth/[...nextauth]/route.ts)).

1. In GitHub: **Settings → Developer settings → OAuth Apps** → **New OAuth App** (or use an existing app).
2. Set **Homepage URL** to your app root (e.g. `http://localhost:3000` while developing, or your production URL).
3. Set **Authorization callback URL** to:
   - **Local:** `http://localhost:3000/api/auth/callback/github`
   - **Production:** `https://<your-vercel-domain>/api/auth/callback/github`

A classic **OAuth App** allows **one** callback URL. Practical options:

- **Two apps:** one for local development (localhost callback) and one for production (Vercel URL), with matching **`AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`** per environment; or  
- **One app:** use a single environment (e.g. only production) for OAuth testing.

Copy the **Client ID** and **Client secret** into **`AUTH_GITHUB_ID`** and **`AUTH_GITHUB_SECRET`**.

### 3. Vercel (deploy + env)

1. Import the Git repository and deploy (framework preset **Next.js**).
2. In **Project → Settings → Environment Variables**, add (at least for **Production**, and repeat for **Preview** if you test PRs with auth):

   | Variable | Notes |
   | --- | --- |
   | `DATABASE_URL` | Same Neon URL as local |
   | `AUTH_SECRET` | Same idea as local: `openssl rand -base64 32` — **do not** reuse the example from any sample file |
   | `AUTH_URL` | **`https://<your-production-domain>`** (no trailing path). For Preview deployments, set **`AUTH_URL`** to that deployment’s **`https://…vercel.app`** URL if OAuth is tested there (and register that exact URL in the GitHub OAuth callback if you use a single callback). |
   | `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | From the GitHub OAuth app used for that environment |

3. **Redeploy** after changing variables so the new runtime env is picked up.

### 4. Sanity check

- **Local:** `.env.local` matches the table in [Getting started](#getting-started); `npm run dev` → **Continue with GitHub** → completes redirect back to `/dashboard`.
- **Production:** `AUTH_URL` matches the live origin GitHub redirects to; OAuth callback URL in GitHub matches **`…/api/auth/callback/github`** for that host.

Details on routes, proxy behavior, and schema live in [`auth-plan.md`](auth-plan.md).
