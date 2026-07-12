# TOOLS.md

This file is the canonical workspace registry of tools, capabilities, and resources the agent may use or should consider using.

Its purpose is to keep the agent aware of its full available operating surface so it does not underuse available capabilities.

## Purpose

Use this file to list all tools that may be relevant to work in this workspace, including:

- local terminal capabilities
- package managers
- language runtimes
- linters
- formatters
- test runners
- debuggers
- build tools
- deployment tools
- plugins and extensions
- local services
- external integrations
- online documentation sources
- internal reference files
- browser-based tools
- APIs and SDKs
- search tools
- database clients
- infrastructure tooling

This file is for awareness and selection, not for historical execution logging.

Do not use this file for:

- exact historical fixes
- blocker tracking
- session notes
- user preferences
- live task state

---

## Update rules

Update `TOOLS.md` whenever:

- a new tool becomes available in the workspace
- a plugin or extension is installed or removed
- a relevant integration is configured
- a recurring online reference source becomes important
- a terminal command family or utility becomes part of the normal workflow
- the user explicitly requests tool additions or removals

Keep this file current enough that the agent can always reason from the broadest realistic set of available capabilities.

---

## Entry format

### Tool: <name>

**Category**

- terminal / runtime / package manager / linter / formatter / test runner / debugger / plugin / integration / online resource / internal file / service / infrastructure / database / API / other

**Purpose**

- What the tool is for

**When to use**

- Typical triggers or relevant situations

**How to access**

- Command, path, extension name, service location, URL label, or integration point

**Common operations**

- Most relevant commands, actions, or usage patterns

**Constraints**

- Safety limits, permission requirements, environmental assumptions, rate limits, or known caveats

**Related files**

- Exact paths to configs, scripts, wrappers, or reference docs

---

## Tool selection rule

Before defaulting to a narrow approach, consider whether a better tool already exists in:

- the terminal
- installed plugins
- configured integrations
- project scripts
- language-native tooling
- test tooling
- linting / formatting tooling
- internal reference files
- online official documentation

Prefer the most direct, verifiable tool for the task.

Prefer built-in project scripts and official tooling over improvised alternatives when available.

---

### Tool: Supabase CLI

**Category**

- database / infrastructure / terminal

**Purpose**

- Manage Supabase projects from the terminal: migrations, `db push` to remote, linking, auth, and local development when configured.

**When to use**

- Applying schema changes, checking migration history, pushing migrations to the linked remote project, or any `supabase` subcommand.

**How to access**

- **On this Mac:** the shell function `supabase` runs `npx --yes supabase@<pinned>` (see `~/.zshrc` / `~/.zlogin`). Raw `~/.local/bin/supabase` from GitHub may be **killed by Gatekeeper** (`zsh: killed`); do not rely on it.
- **Homebrew** `/opt/homebrew/bin/supabase` may be outdated or not upgradable without admin write access to the prefix.

**Common operations**

- `supabase --help`; `supabase migration new <name>`; `supabase migration list --linked`; `supabase db push --linked --yes`; `supabase migration fetch --linked` (when remote history must be pulled into files); `supabase link --project-ref <ref> --yes`; `supabase login`.

**Constraints**

- Prefer **CLI** over Supabase MCP if MCP is unregistered or unauthorized.
- CLI must be discoverable (`supabase --version` should work via `npx`).

**Related files**

- `/skills/supabase-linked-migrations/SKILL.md`
- `/memory/runbooks/supabase-cli-macos.md` — macOS CLI / Gatekeeper notes.

---

### Tool: Supabase migrations (repo)

**Category**

- database / internal file / terminal

**Purpose**

- Versioned SQL under `supabase/migrations/` is the **source of truth** for remote schema history when using the Supabase CLI.

**When to use**

- Any DDL change that must apply to the hosted project: new tables, RLS, policies, functions, indexes.

**How to access**

- Files: `supabase/migrations/YYYYMMDDHHMMSS_*.sql` only (CLI naming); reference dump: `supabase/schema.sql` (not a substitute for migration history).
- Remote table: `supabase_migrations.schema_migrations`.

**Common operations**

- Create migration with CLI; edit SQL; `supabase db push --linked --yes`; verify with `supabase migration list --linked`.

**Constraints**

- Avoid `CREATE POLICY IF NOT EXISTS` if Postgres rejects it; use `DROP POLICY IF EXISTS` + `CREATE POLICY` (see existing migrations).

**Related files**

- `supabase/migrations/`

---

### Tool: Vercel CLI (`vercel` / `vc`)

**Category**

- deployment / infrastructure / terminal

**Purpose**

- Deploy a Next.js project to Vercel, link the local directory to a Vercel project, manage env vars from the terminal, inspect deployments and logs.

**When to use**

- Preview or production deploy from the dev machine; linking a new clone; pulling env for local dev; debugging deployment IDs and logs when the dashboard is not enough.

**How to access**

- **Global:** `npm i -g vercel` then `vercel` (or `vc`).
- **No global install:** `npx vercel <command>` from **repo root**.
- Requires **network**; first-time **`vercel login`** may open a browser.

**Common operations**

- `vercel login`; `vercel whoami`; `vercel link` / `vercel link --repo` (monorepos); `vercel pull`; `vercel` (preview deploy); `vercel --prod`; `vercel env ls`; `vercel env pull .env.local`; `vercel logs`, `vercel inspect` (see `vercel --help` for current subcommands).

**Constraints**

- Run CLI from the directory that contains (or should contain) **`.vercel/`** after linking — usually **repo root** for the app.
- Do not commit secrets; env files like `.env.local` stay local.

**Related files**

- `/skills/vercel-deploy-workflow/SKILL.md`
- `/memory/runbooks/vercel-workflow.md` — short runbook.

---

### Tool: Vercel platform (Dashboard + Git + optional MCP)

**Category**

- deployment / integration / online resource / MCP

**Purpose**

- **Production/Preview** deployments driven by **Git push** when the repo is connected in the Vercel project; env and domain configuration in the dashboard.

**When to use**

- Explaining how pushes map to deployments; changing env vars, domains, or build settings; when the user needs preview URLs for branches/PRs.

**How to access**

- Browser: [vercel.com](https://vercel.com) → Project / Team.
- **Git:** push to connected remote; default branch → Production; other branches → Preview.
- **MCP integration:** use any available Vercel-compatible MCP integration exposed by the current agent environment. Tool names and authentication methods vary by host; inspect the available tool descriptors first. If no authenticated integration is available, use the Vercel CLI in the terminal.

**Common operations**

- Connect Git repo to project; inspect deployment list and build logs; promote/rollback from dashboard (per current Vercel UI).

**Constraints**

- MCP availability varies by session; do not assume OAuth/MCP works without checking tool descriptors and auth.

**Related files**

- `/skills/vercel-deploy-workflow/SKILL.md`

---

### Tool: Sub-agents / task delegation

**Category**

- agent orchestration / review / research

**Purpose**

- Delegate bounded independent investigations, implementation slices, or verification passes while the lead agent retains integration ownership.

**When to use**

- Parallel repository audits, strategy research, test design, security review, or disjoint implementation work.

**How to access**

- Use the available task or sub-agent capability for the current environment; follow `/instructions/SUBAGENTS.md`.

**Constraints**

- Do not assume a sub-agent has read project context. Provide required paths and prevent overlapping writes.

**Related files**

- `/instructions/SUBAGENTS.md`
- `/AGENTS.md`

---

### Tool: Agent bootstrap script

**Category**

- terminal / workspace automation

**Purpose**

- Idempotently create root documentation directories, maintain memory directories, repair the settings compatibility link, and validate required agent files.

**When to use**

- At the beginning of every new agent session and after installing or moving the agent configuration tree.

**How to access**

- Run the resolved `/scripts/bootstrap.sh`; from the agent configuration root, use `bash scripts/bootstrap.sh`.

**Constraints**

- Must not overwrite non-empty project content or introduce secrets.

**Related files**

- `/BOOTSTRAP.md`
- `/scripts/bootstrap.sh`
- `/memory/runbooks/agent-config-bootstrap.md`
- `/memory/runbooks/agent-workspace.md`

