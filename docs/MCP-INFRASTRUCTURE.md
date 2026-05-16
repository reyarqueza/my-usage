# Cursor MCP: Neon, Vercel, and GitHub

This document describes how the **Neon**, **Vercel**, and **GitHub** integrations work as **Model Context Protocol (MCP)** servers in Cursor, and the infrastructure steps performed for this repository.

## Enabling MCP servers in Cursor

1. Open **Cursor Settings** → **MCP** (or edit your MCP config JSON).
2. Add or enable each server per the official Cursor docs: [Cursor MCP](https://docs.cursor.com/context/mcp).
3. Authenticate when prompted (OAuth or API tokens), so tools like `run_sql` or `deploy_to_vercel` succeed without manual token pasting in chat.

Typical pattern:

- **Neon MCP** — uses your Neon account; exposes `list_projects`, `run_sql`, `run_sql_transaction`, `get_database_tables`, etc.
- **Vercel MCP** — uses your Vercel account; exposes `deploy_to_vercel`, `list_projects`, `list_teams`, deployment logs, etc.
- **GitHub** — often configured as a GitHub MCP server *or* you use the **`gh` CLI** locally (authenticated via `gh auth login`) for `repo create`, `push`, and PRs. This runbook used **`gh`** for Git because it is reliable and matches common workflows.

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

Performed with the **GitHub CLI** (`gh`), assuming `gh auth login` is already complete:

```bash
cd /path/to/my-usage
git add -A
git commit -m "..."   # if there are commits to push
gh repo create <owner>/my-usage --public --source=. --remote=origin --push
# If the repo already exists:
git remote add origin https://github.com/<owner>/my-usage.git
git push -u origin main
```

Replace `<owner>` with your GitHub user or organization.

**This session:** `gh auth status` reported *no GitHub host login*, so **no remote repository was created automatically**. After you run `gh auth login`, execute the commands above (or connect the repo in the GitHub UI and `git remote add` + `git push`). Commit `832db52` on `main` is ready to push locally.

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
