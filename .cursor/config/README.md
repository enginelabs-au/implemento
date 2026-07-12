# Agent configuration adapter

- `settings.json` is an optional project-level host configuration retained for compatible agent environments.
- `/settings.json` is a compatibility symlink to `/config/settings.json`.
- Run the resolved `/scripts/bootstrap.sh` to repair the link when safe.
- Core agent behavior is defined by `/AGENTS.md`, `/INSTRUCTIONS.md`, and `/rules/`; it must not depend on a particular editor, model provider, or agent host.
