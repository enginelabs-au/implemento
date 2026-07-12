# BOOTSTRAP.md

This file defines the idempotent startup procedure for the repository-level agent system.

## Path convention

A leading `/` in agent documentation is relative to the **agent configuration root**, meaning the directory containing `AGENTS.md`. It is not the operating-system filesystem root. Repository paths such as `docs/` are relative to the repository root.

## 1. Startup command

Run the bootstrap through its resolved installation path:

```bash
bash "<agent-config-root>/scripts/bootstrap.sh"
```

When the shell is already in the agent configuration root, use:

```bash
bash scripts/bootstrap.sh
```

The lead agent must execute the script at the beginning of every new agent session before project work. The script is safe to run repeatedly and derives the repository root from its own location.

## 2. Bootstrap responsibilities

The bootstrap must:

- locate the repository root from the installed agent configuration directory
- create missing agent-system directories without deleting or replacing project content
- create the repository-root documentation structure
- create minimal documentation indexes only when absent
- ensure empty memory directories remain version-controllable
- repair `/settings.json` as a compatibility symlink to `/config/settings.json` when safe
- validate that required control-plane files exist
- never create, copy, print, or infer secrets

## 3. Required structure

```text
repository-root/
  docs/
    README.md
    blueprints/
    plans/
      README.md
    decisions/
    handover/
  <agent-config-root>/
    AGENTS.md
    BOOTSTRAP.md
    INSTRUCTIONS.md
    USER.md
    STATE.md
    SKILLS.md
    TOOLS.md
    config/
      README.md
      settings.json
    instructions/
      PROJECT_PLANNING.md
      STRATEGY.md
      SUBAGENTS.md
    memory/
      MEMORY.md
      memories/
      blockers/
      blockers-fixed/
      runbooks/
    rules/
      *.mdc
    scripts/
      bootstrap.sh
    skills/
      <skill-id>/SKILL.md
    templates/
      docs-readme.md
      plans-readme.md
      phase-plan-template.md
      final-implementation-checklist-template.md
```

## 4. Idempotency and preservation

- Create missing directories and seed indexes only.
- Do not overwrite non-empty `AGENTS.md`, `USER.md`, `STATE.md`, `MEMORY.md`, plans, blueprints, runbooks, skills, source files, or project documentation.
- Do not delete unknown files.
- A broken compatibility link may be replaced only when `/config/settings.json` exists and the existing `/settings.json` contains no independent JSON configuration.
- Existing project conventions take precedence when they provide equivalent directories under different documented paths; record the mapping rather than duplicating content.

## 5. Session startup sequence

After running the script:

1. Read `/AGENTS.md`.
2. Read every installed file under `/instructions/` and `/rules/` once for the session.
3. Read the complete core per-turn set defined in `AGENTS.md`.
4. Resume the `Active Plan` in `STATE.md` when one exists.
5. If there is no active project plan and the user has supplied a new project or major feature request, activate `/instructions/PROJECT_PLANNING.md`.
6. Activate `/instructions/STRATEGY.md` when discovery, market validation, product definition, architecture synthesis, or launch strategy is material.
7. Create or update `docs/plans/phase_0_foundations_plan.md` before implementing a new multi-phase project.

## 6. Phase-zero bootstrap behavior

`phase_0_foundations_plan.md` is not a generic checklist. It must be generated from the actual user request, repository audit, strategic blueprint when applicable, and current constraints.

It must:

- define the full end-state and boundaries
- map the complete expected phase sequence
- establish architecture, repository, testing, security, observability, data, deployment, and documentation foundations as applicable
- identify dependencies and reversible assumptions
- identify integrations and environment-variable names without requesting values prematurely
- separate agent-executable work from deferred human-only work
- define acceptance evidence for phase 0
- contain the exact next-plan generation prompt required after phase 0 is verified

The next phase plan must not be generated until phase 0 is implemented and reconciled against its acceptance criteria.

## 7. Deferred manual actions

Manual actions should be collected, not repeatedly surfaced. Unless they are strict blockers, defer them to the final phase and the final implementation checklist. Typical deferred actions include:

- creating or upgrading external accounts
- entering billing details
- accepting provider terms
- approving OAuth consent screens
- supplying secret values
- changing production DNS
- verifying domains
- granting production permissions
- performing physical-device or identity-verification steps

The agent should still complete code, configuration schemas, adapters, local validation, placeholder wiring, documentation, and environment-variable registration before requesting those actions.

## 8. Validation

The bootstrap is valid when:

- the resolved `/scripts/bootstrap.sh` exits successfully
- all required control-plane files exist and are non-empty
- `docs/blueprints`, `docs/plans`, `docs/decisions`, and `docs/handover` exist
- `/settings.json` resolves to valid JSON through `/config/settings.json`
- every `/rules/*.mdc` file has YAML frontmatter and `alwaysApply: true`
- `AGENTS.md`, `INSTRUCTIONS.md`, and active instruction files reference valid paths
- no secrets or environment-specific values were introduced

## 9. Failure handling

If bootstrap validation fails:

- repair only the missing or invalid agent-system artifact
- preserve project content
- record the failure and repair in `STATE.md` and the current continuation log
- create a blocker only when the failure cannot be resolved autonomously
