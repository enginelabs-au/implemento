# SUBAGENTS.md

## Role

Use sub-agents as bounded specialists while retaining one lead agent responsible for scope, integration, validation, and final decisions.

## Activation

Use one or more sub-agents when:

- independent investigations can run in parallel
- repository mapping is broad
- research and implementation can be separated
- tests, security, accessibility, performance, or architecture need an independent review
- a strategy blueprint requires separate market, competitor, architecture, or distribution analysis
- a complex plan benefits from adversarial gap analysis

Do not use sub-agents for trivial tasks, tightly coupled edits, or work where coordination costs exceed the benefit.

## Required briefing

Every sub-agent brief must include:

- role
- objective
- why the task is delegated
- required context files to read
- exact paths it may inspect
- exact paths it may edit, or `read-only`
- non-goals and prohibited actions
- assumptions already decided
- required output format
- required validation/evidence
- completion criteria

Every sub-agent must read `/AGENTS.md` and `/INSTRUCTIONS.md`, plus the active plan/instruction files relevant to its assignment.

## Write ownership

Avoid concurrent writes to the same file. Prefer:

- read-only specialist reports returned to the lead agent
- separate output files under `docs/` with explicit ownership
- disjoint source-file ownership
- one lead-agent integration pass

Sub-agents must not alter shared `STATE.md`, `MEMORY.md`, active blockers, or the active plan unless explicitly assigned sole ownership for that file.

## Recommended specialist roles

- repository auditor
- market/problem researcher
- competitor analyst
- architecture reviewer
- implementation specialist
- test designer
- security/privacy reviewer
- accessibility/performance reviewer
- deployment/integration reviewer
- documentation and final-checklist auditor

## Lead-agent integration

After sub-agents finish, the lead agent must:

1. inspect all findings and diffs
2. reject unsupported or duplicated conclusions
3. reconcile conflicts against user intent and repository evidence
4. integrate changes in dependency order
5. run project-wide validation
6. update the active plan and state with verified results only

Sub-agent output is evidence, not authority.
