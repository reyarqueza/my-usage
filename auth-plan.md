> **Original Architect Prompt:**
> Role: Senior Next.js Developer.
> Task: Implementation plan for GitHub-Only Authentication using Auth.js (NextAuth), powered by Neon Postgres via the Vercel Neon Integration.
> 
> Technical Constraints:
> 
> Auth Provider: GitHub OAuth only.
> 
> Database: Neon Postgres (Serverless).
> 
> Connection Strategy: Use the Vercel Neon Integration. No Prisma or Drizzle. Use the @auth/neon-adapter with the @neondatabase/serverless driver.
> 
> Framework: Next.js 16 (App Router) using Server Actions.
> 
> UI: shadcn/ui for all frontend surfaces — login page, dashboard, and shared layout (Tailwind CSS + Radix primitives via copied source components).
> 
> Edge protection: Next.js 16 **Proxy** (`proxy.ts`). Redirect unauthenticated users from /dashboard to /login.
> 
> Required Deliverables:
> 
> Dependency Setup: List the light packages needed (next-auth@5, @auth/neon-adapter, @neondatabase/serverless).
> 
> Auth Configuration: Plan the auth.ts file. Crucially, show how to initialize the Pool from @neondatabase/serverless inside the Auth configuration.
> 
> Database Initialization Script: Since we aren't using an ORM, provide a SQL script to create the required users, accounts, sessions, and verification_token tables in the Neon console.
> 
> Data Fetching: Plan a simple "Welcome" component for the Dashboard that fetches the user's GitHub name directly using a SQL tag (e.g., sql from @neondatabase/serverless).
> 
> Environment Variables: Map out the variables provided by the Vercel-Neon integration (e.g., DATABASE_URL).
> 
> Instructions: Output this plan in Markdown. Focus on the direct connection between Auth.js and the Neon serverless driver. Once approved, I will have you save this to auth-plan.md.

---

# GitHub-only Auth.js + Neon (Vercel integration) — implementation plan

Greenfield blueprint for **GitHub-only authentication** using **Auth.js (NextAuth v5)**, **Neon Postgres** via the **Vercel Neon integration**, and **`@auth/neon-adapter`** with **`@neondatabase/serverless`** (no Prisma or Drizzle). All user-facing UI is built with **shadcn/ui** (login, dashboard, shared layout).

Assumes a standard **Next.js 16 App Router** layout (`app/`, or `src/app/` if using `src/`).

## Technical constraints (summary)

| Area | Choice |
| --- | --- |
| Auth provider | GitHub OAuth only |
| Database | Neon Postgres (serverless), Vercel Neon integration |
| DB access | `@auth/neon-adapter` + `@neondatabase/serverless` — **no Prisma or Drizzle** |
| Framework | Next.js 16 App Router, Server Actions for OAuth trigger |
| UI | **shadcn/ui** — components copied into `components/ui/`; Tailwind CSS for styling |
| Request layer | Next.js 16 **`proxy.ts`** (replaces deprecated `middleware.ts`) — strict `/dashboard` protection → redirect to `/login` |

## Architecture (high level)

```mermaid
flowchart TB
  subgraph browser [Browser]
    LoginPage["app/(auth)/login/page.tsx"]
    DashPage["app/(dashboard)/dashboard/page.tsx"]
  end

  subgraph ui [shadcn UI layer]
    RootLayout["app/layout.tsx ThemeProvider + globals.css"]
    AuthLayout["(auth)/layout — hero area + AuthThemeCorner"]
    DashLayout["app/(dashboard)/layout.tsx — header + main"]
    Shadcn["components/ui/* — Button, Card, Avatar, ..."]
    LoginForm["components/login-form.tsx — Card + Button"]
    WelcomeCard["components/welcome-card.tsx — Card + Avatar"]
    AppHeader["app-header.tsx — h1 My Usage, ModeToggle, account menu"]
  end

  subgraph vercel [Vercel / Next.js]
    Env[DATABASE_URL + OAuth secrets]
    PX[proxy.ts]
    RT["app/api/auth/[...nextauth]/route.ts"]
    LoginAction["loginWithGitHub Server Action"]
  end

  subgraph authjs [Auth.js]
    AuthTS["auth.ts — Pool + NeonAdapter"]
  end

  subgraph neon [Neon]
    PG[(users accounts sessions)]
  end

  LoginPage --> LoginForm
  LoginForm --> Shadcn
  DashPage --> WelcomeCard
  DashPage --> DashLayout
  LoginPage --> AuthLayout
  DashLayout --> AppHeader
  AppHeader --> Shadcn
  WelcomeCard --> Shadcn
  RootLayout --> AuthLayout
  RootLayout --> DashLayout

  LoginForm -->|"form action"| LoginAction
  LoginAction --> AuthTS
  AuthTS --> RT
  AuthTS --> PX
  PX -->|"no session"| LoginPage
  NeonAdapter["NeonAdapter(pool)"] --> PG
  AuthTS --> NeonAdapter
  WelcomeCard -->|"neon sql tag read"| PG
  DashPage -->|"auth() session"| AuthTS
```

**Data vs UI split**

- **Sessions and user rows** are written by **Auth.js** through **`NeonAdapter(Pool)`** on sign-in.
- **Dashboard display name** is read with a **separate** Neon serverless **`neon` SQL tagged template** query keyed by the signed-in user’s database id (from `auth()`), then passed into a **shadcn `Card`** for display.
- **shadcn/ui does not participate in auth** — it only composes Server Components / Client boundaries around existing `auth()`, Server Actions, and SQL reads.

---

## 1) Dependencies (minimal set)

### Auth + database

Install (versions float to current stable; align `next-auth` with Auth.js v5 docs):

| Package | Role |
| --- | --- |
| `next-auth` | Auth.js for Next.js (`NextAuth`, `handlers`, `auth`, `signIn`, `signOut`) |
| `@auth/neon-adapter` | Official Postgres adapter implementation for Neon |
| `@neondatabase/serverless` | **`Pool`** for the adapter + **`neon` SQL tag** for raw queries |

**Install command:**

```bash
npm install next-auth @auth/neon-adapter @neondatabase/serverless next-themes
```

**Peer constraint (per npm / Auth.js docs):** `@auth/neon-adapter` expects a compatible `@neondatabase/serverless` (supports both `^0.10.x` and `^1.x` lines).

**Also in this app:** `next-themes` (root `ThemeProvider`, default theme **light**), plus `components/mode-toggle.tsx` and `components/auth-theme-corner.tsx` for the login-screen control.

### UI — shadcn/ui (via CLI, not a single npm package)

shadcn copies component **source** into the repo. The CLI installs peer utilities on `init` and per-component on `add`:

| Installed by CLI (typical) | Role |
| --- | --- |
| `tailwindcss`, `postcss`, `autoprefixer` | Utility-first styling (from Next scaffold + shadcn) |
| `class-variance-authority`, `clsx`, `tailwind-merge` | Variants + `cn()` helper in `lib/utils.ts` |
| `@radix-ui/react-*` | Primitives per added component (e.g. `slot` for Button) |
| `lucide-react` | Icons (GitHub icon on login button, UI chrome) |

**Prerequisite:** scaffold Next.js with **Tailwind** (`create-next-app` with Tailwind enabled) before `shadcn init`.

**Init (non-interactive, agent-safe):**

```bash
npx shadcn@latest init -d
```

This creates `components.json`, theme CSS variables in `app/globals.css`, and `lib/utils.ts`.

**Components to add for this app** (install after init):

```bash
npx shadcn@latest add button card avatar separator dropdown-menu
```

Optional later: `sonner` (toasts), `skeleton` (loading states).

Optional but typical for Next 16 / TypeScript:

- `typescript`, `@types/node`, `@types/react`, `@types/react-dom` (if not already present from `create-next-app`)

---

## 2) `auth.ts` — GitHub-only + Neon `Pool` inside the Auth.js factory

**Critical rule from Auth.js Neon docs:** **do not** construct a global `Pool` at module top level for serverless/edge-friendly Next deployments. Instantiate **`new Pool({ connectionString: process.env.DATABASE_URL })` inside the `NextAuth(() => { ... })` factory** so each invocation gets a scoped pool configuration pattern recommended by Auth.js.

Planned file: `auth.ts` (or `src/auth.ts` if using `src/`).

**Shape:**

```ts
import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import NeonAdapter from "@auth/neon-adapter"
import { Pool } from "@neondatabase/serverless"

export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })

  return {
    adapter: NeonAdapter(pool),
    providers: [
      GitHub({
        // Optional explicit mapping if you prefer non-prefixed env names:
        // clientId: process.env.GITHUB_ID,
        // clientSecret: process.env.GITHUB_SECRET,
      }),
    ],
    session: { strategy: "database" }, // explicit: adapter path is DB-backed sessions
    pages: {
      signIn: "/login", // aligns with your /login route UX
    },
    callbacks: {
      // Usually none required for “show GitHub name”; `user.name` is persisted in `users.name`
    },
    trustHost: true, // commonly needed on Vercel; verify against your deployment hostname config
  }
})
```

**Why this satisfies the constraint:** the **only** database object passed into Auth.js for persistence is **`NeonAdapter(pool)`** where `pool` is **`@neondatabase/serverless` `Pool`**, exactly as documented on [Auth.js Neon adapter](https://authjs.dev/getting-started/adapters/neon).

**Route handler wiring (App Router):** `app/api/auth/[...nextauth]/route.ts`

```ts
import { handlers } from "@/auth"
export const { GET, POST } = handlers
```

---

## 3) SQL initialization script (Neon SQL Editor)

Auth.js documents the Neon adapter schema explicitly (table names and column casing matter because of quoted identifiers like `"userId"`).

Run the following in the **Neon console** (or check in as `scripts/auth-schema.sql`). This is derived from the official Auth.js Neon schema, with **practical indexes/uniques** added for OAuth correctness and session lookup.

```sql
-- Auth.js Neon adapter baseline schema (+ helpful constraints)

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  "emailVerified" TIMESTAMPTZ,
  image TEXT
);

CREATE UNIQUE INDEX users_email_unique ON users (email);

CREATE TABLE accounts (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  "providerAccountId" VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  id_token TEXT,
  scope TEXT,
  session_state TEXT,
  token_type TEXT
);

CREATE UNIQUE INDEX accounts_provider_account_unique
  ON accounts (provider, "providerAccountId");

CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMPTZ NOT NULL,
  "sessionToken" VARCHAR(255) NOT NULL
);

CREATE UNIQUE INDEX sessions_sessionToken_unique ON sessions ("sessionToken");

CREATE TABLE verification_token (
  identifier TEXT NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  token TEXT NOT NULL,
  PRIMARY KEY (identifier, token)
);
```

**Note on naming:** Auth.js docs use `verification_token` (singular), not `verification_tokens`. Use **`verification_token`** to match the adapter.

---

## 4) Proxy — strict `/dashboard` protection (Next.js 16)

Planned file: **`proxy.ts`** (the `middleware.ts` convention is deprecated in Next.js 16 in favor of **Proxy**).

**Goal:** if a request targets `/dashboard` (and nested routes), **require an Auth.js session**; otherwise redirect to **`/login`**.

- **Matcher:** `"/dashboard/:path*"` so `/api/auth/*` and `/login` stay reachable without auth.
- **Auth.js:** wrap with `auth((req) => …)` so `req.auth` reflects the session.

**Lazy `NextAuth(() => { … })` caveat:** the exported `auth` helper is **async**. Calling `auth(middlewareCallback)` returns a **Promise** of the handler, not the handler itself. The app resolves that once and invokes it from `export default async function proxy(…)`, matching Next’s requirement for a clearly exported **`proxy`** function.

**Reference implementation (abbreviated):**

```ts
import { auth } from "@/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const authenticatePromise = auth((req) => {
  if (!req.auth && req.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.nextUrl))
  }
})

export default async function proxy(request: NextRequest, context?: unknown) {
  const authenticate = await authenticatePromise
  return authenticate(
    request,
    context as Parameters<typeof authenticate>[1],
  )
}

export const config = { matcher: ["/dashboard/:path*"] }
```

---

## 5) UI shell — layouts + shadcn composition

**Route groups** keep auth and app chrome separate:

| Path | File | UI role |
| --- | --- | --- |
| `/` | `app/layout.tsx` | Root: fonts, `globals.css`, **`ThemeProvider`** (`next-themes`, `defaultTheme="light"`) |
| `/login` | `app/(auth)/layout.tsx` | Centered column, muted background; **`AuthThemeCorner`** (floating dark-mode toggle, no bordered header bar) |
| `/login` | `app/(auth)/login/page.tsx` | Hero **`h1` “My Usage”**, **`h2`** tagline, then `<LoginForm />` |
| `/dashboard` | `app/(dashboard)/layout.tsx` | App shell: **`AppHeader`** (large **`h1` “My Usage”**, user menu, `ModeToggle`) + `<main>` |
| `/dashboard` | `app/(dashboard)/dashboard/page.tsx` | Server page: `auth()` + `neon` SQL → `<WelcomeCard />` |

**Shared components** (shadcn-backed where noted):

- `components/login-form.tsx` — `Card` + `Button` with `formAction={loginWithGitHub}` (Server Action).
- `components/app-header.tsx` — dashboard only: **`h1` “My Usage”**, `ModeToggle`, optional name, **`Avatar`**, **Sign out** via **`logout`** Server Action (wraps `signOut()`).
- `components/welcome-card.tsx` — `Card` + “Welcome, …” and optional `Avatar`.
- `components/mode-toggle.tsx` — sun/moon toggle bound to `next-themes`.
- `components/auth-theme-corner.tsx` — positions toggle on the login screen.

**Theming:** shadcn CSS variables in `globals.css` (including `.dark`); **`next-themes`** toggles the `class` on `<html>`.

---

## 6) `/login` + Server Actions (GitHub OAuth)

Planned route: `app/(auth)/login/page.tsx`  
Planned UI: `components/login-form.tsx`

**Server Action** (colocated `app/actions/auth.ts` or inside the form module):

```ts
"use server"

import { signIn, signOut } from "@/auth"

export async function loginWithGitHub() {
  await signIn("github", { redirectTo: "/dashboard" })
}

export async function logout() {
  await signOut({ redirectTo: "/login" })
}
```

**Login UI (shadcn):**

```tsx
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { loginWithGitHub } from "@/app/actions/auth"

export function LoginForm() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Use your GitHub account to continue.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={loginWithGitHub}>
          <Button type="submit" className="w-full">
            Continue with GitHub
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

---

## 7) Dashboard “Welcome” — fetch GitHub display name via SQL tag

Use **`neon`** from `@neondatabase/serverless` for tagged-template queries (distinct from the adapter’s `Pool`, but same integration `DATABASE_URL`).

**Server Component approach (simplest):** `app/(dashboard)/dashboard/page.tsx` fetches data; `components/welcome-card.tsx` renders UI.

1. `const session = await auth()`
2. If no session, rely on **Proxy** (defense in depth: still `redirect("/login")`).
3. Parse `session.user.id` as the **integer** primary key for `users.id` (DB session strategy).
4. Query:

```ts
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)
const rows = await sql`select name from users where id = ${Number(session.user.id)} limit 1`
const displayName = rows[0]?.name ?? session.user.name ?? "GitHub user"
```

5. Pass `displayName` and `session.user.image` into `<WelcomeCard />` (shadcn `Card` + `Avatar`).

**Operational note:** Vercel’s Neon integration may provide both pooled and unpooled URLs (`DATABASE_URL_UNPOOLED`, `POSTGRES_URL_NON_POOLING`, etc.). For a read-only `SELECT`, either often works—confirm which URL Neon documents for **serverless queries** in your project settings.

---

## 8) Environment variables — Vercel Neon integration + GitHub + Auth.js

### From Vercel ↔ Neon integration (typical)

Neon’s Vercel integration usually injects Postgres URLs into the Vercel project. Names can vary slightly by integration version, but expect variants of:

| Variable | Typical use |
| --- | --- |
| `DATABASE_URL` | General-purpose connection string (Auth.js adapter + `neon` queries) |
| `POSTGRES_URL` | Alternate naming in some templates |
| `DATABASE_URL_UNPOOLED` / `POSTGRES_URL_NON_POOLING` | Direct / serverless-friendly connections |

**Plan:** in Vercel Project Settings → Environment Variables, confirm the exact keys Neon provisioned, then set **`DATABASE_URL` for Auth.js** explicitly (use Neon’s `DATABASE_URL` directly, or copy the correct string into `DATABASE_URL` if Neon used a different key).

For **local development**, mirror the same variables in `.env.local` (never commit secrets).

### GitHub OAuth app

Create a GitHub OAuth App:

- **Authorization callback URL:** `https://<your-production-domain>/api/auth/callback/github`
- For local dev, add `http://localhost:3000/api/auth/callback/github`

Auth.js GitHub provider env vars (per Auth.js docs):

| Variable | Purpose |
| --- | --- |
| `AUTH_GITHUB_ID` | GitHub OAuth App client ID |
| `AUTH_GITHUB_SECRET` | GitHub OAuth App client secret |

(Older convention `GITHUB_ID` / `GITHUB_SECRET` appears in many tutorials; Auth.js documents the `AUTH_`-prefixed names.)

### Auth.js core secrets / URLs

| Variable | Purpose |
| --- | --- |
| `AUTH_SECRET` | Required in production (strong random string) |
| `AUTH_URL` | Canonical site URL on Vercel (helps callback URL construction) |

---

## 9) File checklist (implementation order)

1. Scaffold Next 16 App Router with **TypeScript + Tailwind**.
2. **Initialize shadcn:** `npx shadcn@latest init -d`; add `button`, `card`, `avatar`, `separator`, `dropdown-menu`.
3. Add auth dependencies; apply SQL schema in Neon.
4. Add `auth.ts` with **Pool-in-factory** + `NeonAdapter` + GitHub provider.
5. Add `app/api/auth/[...nextauth]/route.ts`.
6. Add **`proxy.ts`** with `/dashboard` protection (see §4 for lazy-`auth` pattern).
7. Add root + route-group layouts (`app/layout.tsx` with **ThemeProvider**, `(auth)/`, `(dashboard)/`).
8. Add hero login page, `login-form.tsx`, `loginWithGitHub` action, theme controls (`mode-toggle`, `auth-theme-corner`).
9. Add `app-header.tsx`, `welcome-card.tsx`.
10. Add `app/(dashboard)/dashboard/page.tsx` with `auth()` + `neon` SQL → `WelcomeCard`.

---

## 10) Post-implementation verification (manual)

- Visit `/dashboard` logged out → redirected to `/login`.
- Login page shows hero **“My Usage”** + tagline, shadcn **Card** with full-width **Button**, and optional **dark-mode** control in the corner.
- Click GitHub sign-in → OAuth → lands on `/dashboard` inside **dashboard layout** (header with **`h1`** + user menu).
- Confirm rows appear in `users`, `accounts`, `sessions`.
- Dashboard **WelcomeCard** shows DB `users.name` (and falls back sensibly); **Avatar** uses GitHub image when present.
- Sign out from header **DropdownMenu** clears session and returns to `/login`.

---

## Implementation checklist (current repo)

These items match the **implemented** application as of maintenance of this document.

### Scaffold + UI foundation

- [x] Next.js 16 (App Router, TypeScript, **Tailwind CSS**)
- [x] `npx shadcn@latest init -d`; components: `button`, `card`, `avatar`, `separator`, `dropdown-menu`
- [x] Route-group layouts: `app/(auth)/layout.tsx`, `app/(dashboard)/layout.tsx`
- [x] `login-form`, `app-header`, `welcome-card`, `mode-toggle`, `auth-theme-corner`, `theme-provider`
- [x] `next-themes` — default **light** theme in `app/layout.tsx`

### Auth + database

- [x] `next-auth` (v5 beta), `@auth/neon-adapter`, `@neondatabase/serverless`
- [x] Neon / `scripts/auth-schema.sql` — `users`, `accounts`, `sessions`, `verification_token` + indexes
- [x] `auth.ts` — lazy `NextAuth`, `Pool` in factory, `NeonAdapter`, GitHub-only, DB sessions
- [x] `app/api/auth/[...nextauth]/route.ts` — `handlers`
- [x] **`proxy.ts`** — unauthenticated `/dashboard` → `/login` (`matcher`), with **await** of lazy `auth()` middleware callback
- [x] `loginWithGitHub` / `logout` Server Actions; login form + header menus
- [x] `app/(auth)/login/page.tsx` (hero) + `app/(dashboard)/dashboard/page.tsx` (`auth()` + `neon` SQL → `WelcomeCard`)
- [x] Env: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `AUTH_GITHUB_*` (local + Vercel) and GitHub OAuth callbacks
