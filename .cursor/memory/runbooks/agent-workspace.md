# Domain: Agent workspace operating layout

## Purpose

Document the canonical autonomous agent control plane, startup materialization, sequential project planning, instruction routing, and context-preservation layout.

## Canonical paths

- `/AGENTS.md` — operating contract
- `/BOOTSTRAP.md` and `/scripts/bootstrap.sh` — idempotent startup
- `/INSTRUCTIONS.md` and `/instructions/` — instruction routing
- `/STATE.md` — active objective, phase, plan, and instructions
- `/memory/` — durable memory, continuations, blockers, and runbooks
- `/SKILLS.md` and `/skills/` — stable procedures
- `/TOOLS.md` — capability registry
- `/rules/*.mdc` — concise always-applied enforcement
- `docs/blueprints/` — strategy outputs
- `docs/plans/` — sequential phase plans and final checklist
- `docs/decisions/` — material decision records
- `docs/handover/` — operational handovers

## Procedure

1. Install the `/` directory at repository root.
2. Run the resolved `/scripts/bootstrap.sh`; from the configuration root, use `bash scripts/bootstrap.sh`.
3. Confirm root documentation directories and indexes exist.
4. Confirm `/settings.json` links to `config/settings.json`.
5. On every substantive turn, read `/AGENTS.md` first and then its complete core set.
6. Route detailed modes through `/INSTRUCTIONS.md`.
7. For new multi-phase projects, create and implement `docs/plans/phase_0_foundations_plan.md`, then generate one next phase plan at a time.
8. Preserve evidence in plans, state, continuation logs, blockers, and runbooks according to file roles.

## Validation

- The resolved `/scripts/bootstrap.sh` exits successfully.
- Required control files are non-empty.
- Root `docs/` subdirectories exist.
- Rules contain valid always-applied frontmatter.
- No secret values are stored in the control plane.
