# Cursor MCP: Neon, Vercel, and GitHub

This document describes how the **Neon**, **Vercel**, and **GitHub** integrations work as **Model Context Protocol (MCP)** servers in Cursor, and the infrastructure steps performed for this repository.

## Enabling MCP servers in Cursor

1. Open **Cursor Settings** → **MCP** (or edit your MCP config JSON).
2. Add or enable each server per the official Cursor docs: [Cursor MCP](https://docs.cursor.com/context/mcp).
3. Authenticate when prompted (OAuth or API tokens), so tools like `run_sql` or `deploy_to_vercel` succeed without manual token pasting in chat.

Typical pattern:

- **Neon MCP** — uses your Neon account; exposes `list_projects`, `run_sql`, `run_sql_transaction`, `get_database_tables`, etc.
- **Vercel MCP** — uses your Vercel account; exposes `deploy_to_vercel`, `list_projects`, `list_teams`, deployment logs, etc.
- **GitHub MCP** (Cursor **GitHub** integration) — exposes tools such as **`create_repository`**, **`push_files`**, **`get_me`**, and ~40 related APIs once the server is **enabled and authenticated** for the workspace. The agent only receives these tools if Cursor has attached that MCP server to the current chat session.

### GitHub MCP: create repo + initial upload (recommended flow)

Once **`plugin-github-github`** appears in the agent’s available tool list:

1. **`get_me`** — read `login` (the `owner` for later calls).
2. **`create_repository`** — e.g. `{ "name": "my-usage", "private": false }` — omit **`autoInit`** / set **`autoInit`: false** so the repo stays empty until your first **`push_files`** (avoids conflicting `README` on `main`).
3. **`push_files`** — `{ "owner": "<login>", "repo": "my-usage", "branch": "main", "message": "Initial commit", "files": [ { "path": "package.json", "content": "<string>" }, ... ] }`.

Use the same paths as **`git ls-files`** (committed sources only — **never** `node_modules` or `.next`). Large trees may need splitting across multiple **`push_files`** commits if GitHub MCP hits size limits.

**Workspace descriptors:** Cursor stores MCP tool schemas under **`~/.cursor/projects/<workspace-id>/mcps/`**. For this repo, **`plugin-github-github`** was copied alongside Neon/Vercel so the GitHub definitions exist on disk; the tools still **only work** after the GitHub MCP server is **linked and authorized** in **Cursor Settings → MCP**.

After configuration, agents can call MCP tools through Cursor’s tool layer (the same way other MCP servers are invoked).

## What was done for this project (automation log)

### 1. Neon Postgres — Auth.js schema

| Step | MCP / action | Result |
|------|----------------|--------|
| Discover project | `list_projects` (Neon MCP), search `my-usage` | Project **`ancient-sound-96744382`**, name `my-usage`, org `org-gentle-queen-33098785` |
| Apply SQL | `run_sql_transaction` with statements from [`scripts/auth-schema.sql`](../scripts/auth-schema.sql) | **Skipped (idempotent):** error `relation "users" already exists` — schema was already applied |
| Verify | `get_database_tables` on the same project | Tables present: `users`, `accounts`, `sessions`, `verification_token` |

For a **fresh** database branch, run the same `run_sql_transaction` (or paste `scripts/auth-schema.sql` into the Neon SQL Editor). On an existing database, use migrations or `IF NOT EXISTS` patterns if you need repeatability.

### 2. GitHub — repository and push

**Preferred (no local `gh auth`):** use **GitHub MCP** as described above (`create_repository` + `push_files`).

**Fallback — GitHub CLI:** if MCP is unavailable, use `gh repo create` / `git push` with `gh auth login`.

**Agent limitation (this session):** the active Cursor agent **did not register** any `plugin-github-github-*` tools (only Neon and Vercel GitHub-adjacent tools appeared). So **`create_repository` / `push_files` could not be invoked from here** even if your account has a valid token elsewhere. **Fix:** ensure **GitHub** is enabled under **Cursor Settings → MCP** for this project, then **reload the window** or **start a new agent chat** and ask again to create `my-usage` and run **`push_files`** with the output of `git ls-files`.

### 3. Vercel — deploy

| Step | MCP / action | Notes |
|------|----------------|--------|
| Deploy (MCP) | `deploy_to_vercel` (Vercel MCP) | In this environment the tool **returned guidance** to run `vercel deploy` locally rather than performing a remote deploy by itself. Behavior can vary by Cursor / MCP version. |
| Deploy (CLI) | `vercel deploy --yes` from the repo root | **Succeeded:** linked project `rey-arquezas-projects/my-usage`, created `.vercel/` (gitignored). Example deployment URL: `https://my-usage-o5epxrmrl-rey-arquezas-projects.vercel.app` — use the Vercel dashboard for the canonical production alias. |

After deploy:

1. In the Vercel project, connect the **Neon** integration (or set `DATABASE_URL` manually from Neon).
2. Set **Environment variables**: `AUTH_SECRET`, `AUTH_URL`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, and `DATABASE_URL` (see [`.env.example`](../.env.example)).
3. In the GitHub OAuth App, set the callback URL to `https://<your-domain>/api/auth/callback/github`.

### 4. GitHub OAuth callback URLs

| Environment | Callback URL |
|-------------|----------------|
| Production | `https://<vercel-production-domain>/api/auth/callback/github` |
| Local | `http://localhost:3000/api/auth/callback/github` |

## Reference — Neon project

- **Project name:** `my-usage`
- **Project ID:** `ancient-sound-96744382` (example from this workspace’s MCP run; yours may differ if you recreate the project)

Do not commit live connection strings; use Vercel + Neon integration env vars in production.

## Troubleshooting

| Issue | Suggestion |
|-------|------------|
| Neon `run_sql` fails with “already exists” | Schema already applied; use `get_database_tables` / Neon console to confirm |
| Vercel deploy fails | Run `vercel link` locally or connect the Git repo in the Vercel UI; ensure MCP is logged into the correct team |
| Auth callback mismatch | `AUTH_URL` must match the site URL; GitHub OAuth callback must exactly match Auth.js `/api/auth/callback/github` |
| GitHub MCP tools missing in agent | Enable GitHub in **Settings → MCP**, confirm `plugin-github-github` under the workspace `mcps` folder, **reload Cursor** or use a **new chat** so tools register |
