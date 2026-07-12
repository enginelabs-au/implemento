---
decision: planning-engine-architecture
status: accepted
date: 2026-07-11
---

# ADR 0004: Planning engine architecture

## Context

Phase 3 must convert discovery output (`PainTheme[]`, evidence, community profiles) into implemento-standard strategy blueprints and phase 0 foundations plans. Outputs must match packaged template section structures, persist locally, and export as markdown. The extension already has a template engine from phase 0 and an LLM pipeline from phase 2.

## Decision

Use a **template-hybrid planning pipeline**:

| Layer | Approach |
|---|---|
| Input | Pain themes (required), capped evidence quotes, community profiles |
| LLM output | JSON object with template variable string fields |
| Render | `renderBlueprint()` / `renderPhasePlan()` from packaged assets |
| Validation | `validateSections()` against `BLUEPRINT_REQUIRED_SECTIONS` / `PHASE_PLAN_REQUIRED_SECTIONS` |
| Persistence | `upsertBlueprint` (version bump on replace), `upsertPhasePlan` for phase 0 |
| Network | Service worker only; same BYOK settings as discovery |
| Lifecycle | Phase 0 status `draft` \| `complete`; phase 1+ generation deferred |

### Two-step generation

1. **GENERATE_BLUEPRINT** — requires ≥1 pain theme; produces 17-section blueprint.
2. **GENERATE_PHASE0** — requires existing session blueprint; produces 22-section phase 0 plan.

Metadata fields (`status`, `created`, `updated`, `phase_number`) are set by the engine, not the LLM.

### Repair strategy

On JSON parse failure: one repair call with `buildJsonRepairPrompt`. On section validation failure: one repair call listing missing sections. Persist only when validation passes.

### Data sent to LLM

- Blueprint prompt: theme summaries, evidence quotes (truncated), profile summaries.
- Phase 0 prompt: truncated blueprint markdown + theme titles.

Never sent: API keys, unrelated sessions, full browsing history.

## Consequences

### Positive

- Guaranteed section headings via templates
- Reuses phase 0 template engine and phase 2 LLM infrastructure
- Offline export of saved artifacts without LLM

### Negative

- Two LLM calls for full planning workflow (latency/cost)
- Large blueprint markdown truncated for phase 0 prompt
- No inline editing — regenerate only in v1

## Alternatives considered

| Alternative | Why rejected |
|---|---|
| LLM outputs full markdown directly | Harder to guarantee all required sections |
| Single combined LLM call | Token pressure; harder to debug |
| Phase 1+ auto-generation | Violates PROJECT_PLANNING just-in-time lifecycle |

## References

- `docs/plans/phase_3_planning-engine_plan.md`
- `extension/src/shared/planning/`
- `extension/src/shared/templates/engine.ts`
- `extension/src/background/handlers/planning.ts`
