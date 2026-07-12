# Domain: Agent configuration bootstrap

## Purpose

Record the self-contained startup and validation procedure for the agent configuration tree.

## Procedure

- Run the resolved `/scripts/bootstrap.sh`; from the configuration root, use `bash scripts/bootstrap.sh`.
- The script creates missing root documentation and memory directories, seeds missing indexes, repairs the settings compatibility link when safe, and validates required files.
- It does not overwrite non-empty project content or create secrets.

## Validation

- Command exits successfully and prints `bootstrap complete` with the resolved repository root.
- `/settings.json` resolves to `/config/settings.json`.
- `docs/blueprints`, `docs/plans`, `docs/decisions`, and `docs/handover` exist.
