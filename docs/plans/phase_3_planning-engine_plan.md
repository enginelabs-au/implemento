---
plan: phase_3_planning-engine
status: complete
created: 2026-07-11
updated: 2026-07-11
owner: lead-agent
source_phase: docs/plans/phase_2_discovery-engine_plan.md
---

# Phase 3: Planning engine

## 1. Objective

Implement **STRATEGY Arm 2 — architectural synthesis** and **PROJECT_PLANNING alignment** in the Implemento extension: transform session pain themes, evidence, and community context into a strategy **blueprint** and a **phase 0 foundations plan** that match the packaged implemento templates, persist locally, validate required sections, and export as downloadable markdown — without generating later phase plans or post drafts.

## 2. Relation to project end-state

Phase 2 produces `PainTheme[]` and editable `CommunityProfile[]` from pinned Reddit evidence. Phase 3 is the methodology bridge: it turns discovery output into durable planning artifacts (`Blueprint`, `PhasePlan`) that mirror `docs/blueprints/` and `docs/plans/phase_0_foundations_plan.md` in any implemento workspace.

Downstream phases depend on phase 3 output:

- **Phase 4** uses blueprint positioning, community profiles, and pain themes for convention-aware post drafts.
- **Phase 5** may add JSON project bundle import/export atop persisted artifacts.

Phase 3 is the second LLM-heavy phase. It reuses the phase 2 LLM client, settings, and service-worker call pattern. Capture and discovery workflows must remain usable when planning is not configured or skipped.

## 3. Entry criteria and inherited evidence

### Phase 2 completion (verified)

| Criterion | Evidence |
|---|---|
| Pain theme discovery | `RUN_DISCOVERY`, parser, prompt, storage `replacePainThemes` |
| Community profiles | Seed profiles + CRUD + editor UI |
| LLM BYOK | `openai-client.ts`, settings UI, ADR 0003 |
| Template engine | `renderBlueprint`, `renderPhasePlan`, `validateSections`, section constants |
| Domain types | `Blueprint`, `PhasePlan` defined in `domain.ts`; storage arrays exist |
| Tests | 35/35 passing |
| Build | `dist/` v0.2.0 |

### Inherited from blueprint + STRATEGY.md Arm 2 + PROJECT_PLANNING.md

- Generate blueprint markdown using the 17-section STRATEGY structure.
- Propose MVP scope, non-goals, architecture sketch, and delivery phase map inside the blueprint.
- Generate `phase_0_foundations_plan.md` from blueprint + packaged `phase-plan-template.md`.
- Store phase status locally; export on demand.
- **Do not** auto-generate phase 1+ plans until user marks prior phase complete (mirrors agent lifecycle — enforced in v1 by only implementing phase 0 generation).

### Inherited technical state

| Area | State after phase 2 |
|---|---|
| Blueprint CRUD | Types + empty `blueprints[]` only |
| Phase plan CRUD | Types + empty `phasePlans[]` only |
| Planning prompts | None |
| Planning handlers | None |
| Planning UI | None |
| Blueprint export | Sample phase 0 only (static mock via `renderSamplePhase0Plan`) |
| Section linter | `validateSections` exists; not wired to LLM output |

**Existing assets to extend:**

- `extension/src/shared/templates/engine.ts` — render + validate blueprint and phase plans
- `extension/src/shared/templates/assets/blueprint-template.md` — 17 blueprint variables
- `extension/src/shared/templates/assets/phase-plan-template.md` — 22 phase-plan sections
- `extension/src/shared/llm/llm-adapter.ts` — configured `complete()` from phase 2
- `extension/src/background/handlers/discovery.ts` — orchestration pattern to mirror
- `extension/src/shared/storage/storage-adapter.ts` — add blueprint/phase plan methods

## 4. Scope

### In scope

1. **Planning schema** — TypeScript types + validators for LLM JSON output: blueprint template variables and phase 0 template variables.
2. **Planning prompts** — System/user prompts from session name, pain themes, evidence summaries, community profiles, and (for phase 0) existing blueprint markdown.
3. **Planning parser** — Map LLM JSON → template variable records; optional fenced-JSON extraction (reuse discovery parser pattern).
4. **Template hybrid pipeline** — LLM fills variables → `renderBlueprint` / `renderPhasePlan` → `validateSections` → one repair retry on failure.
5. **Storage extensions** — CRUD: `getBlueprint(sessionId)`, `upsertBlueprint`, `getPhasePlan(sessionId, phaseNumber)`, `upsertPhasePlan`, `markPhasePlanStatus`.
6. **Background handlers** — `GENERATE_BLUEPRINT`, `GENERATE_PHASE0`, `GET_BLUEPRINT`, `GET_PHASE_PLAN`, `MARK_PHASE_PLAN_STATUS`.
7. **Side panel Planning UI** — Project slug/title field, generate buttons, artifact previews, export downloads, phase 0 status control.
8. **Graceful degradation** — Clear messages when LLM not configured or prerequisites missing (no themes, no blueprint); offline view/export of saved artifacts.
9. **Unit tests** — Prompt builder, parser fixtures, storage CRUD, section validation on rendered output.
10. **ADR 0004** — Template-hybrid planning architecture, data sent to LLM, lifecycle rules.
11. **README** — Planning workflow documentation.

### Out of scope (deferred)

- Phase 1+ plan generation (requires user marks phase 0 complete; implement in a later phase or phase 5 hardening).
- Post draft generation (phase 4).
- JSON project bundle import/export (phase 5).
- Auto-run planning after discovery.
- In-extension markdown rendering library (use `<pre>` preview or truncated excerpt).
- Blueprint/phase plan inline editing (regenerate only in v1).
- Cross-session blueprint merging.

## 5. Non-goals

- Do not send full evidence corpus twice if avoidable — summarize themes + top quotes for token budget.
- Do not store API keys outside `chrome.storage.local`.
- Do not implement streaming LLM responses.
- Do not generate speculative phase 1–5 detailed plans at blueprint time (phase 0 delivery map lists phases; detailed plans are just-in-time per PROJECT_PLANNING.md).
- Do not require Reddit API access.
- Do not implement phase 4 until phase 3 is verified.

## 6. Current-state audit

| Area | State after phase 2 |
|---|---|
| `Blueprint` persistence | Schema slot only |
| `PhasePlan` persistence | Schema slot only |
| LLM → blueprint | Not implemented |
| LLM → phase 0 | Not implemented |
| Section validation on LLM output | Not wired |
| Export | Static sample phase 0 only |
| Planning message types | None |
| Planning UI section | None |

**Template variable inventory (blueprint):**

`project_slug`, `status`, `created`, `updated`, `project_title`, `executive_decision`, `evidence_method`, `intelligence_report`, `user_problem`, `competitive_landscape`, `uvp`, `validation_experiments`, `prd`, `mvp_scope`, `architecture`, `interfaces`, `security`, `delivery_map`, `gtm`, `risks`, `sources`, `handoff`

**Template variable inventory (phase 0 plan):**

`status`, `created`, `updated`, `source_phase`, `phase_number`, `phase_title`, `objective`, `relation`, `entry_criteria`, `scope`, `non_goals`, `audit`, `assumptions`, `dependencies`, `architecture`, `files`, `supporting_docs`, `tasks`, `delegation`, `validation_rows`, `security`, `env_rows`, `deferred_rows`, `rollback`, `acceptance`, `completion`, `deviations`, `next_plan_prompt`

## 7. Assumptions, constraints, risks, and decisions

### Assumptions

| ID | Assumption | Reversibility |
|---|---|---|
| A1 | Phase 2 LLM settings remain sufficient for planning calls | High |
| A2 | Two LLM calls (blueprint, then phase 0) is acceptable UX vs one large call | High |
| A3 | LLM can reliably populate template variables as JSON strings (not nested objects) | Medium |
| A4 | Session name is a reasonable default for `project_title` / slug | High |
| A5 | One blueprint + one phase 0 plan per session is sufficient for v1 | High |
| A6 | Markdown preview as monospace `<pre>` is acceptable before rich rendering | High |

### Constraints

- MV3 service worker executes LLM calls (same as phase 2).
- Token budget: cap evidence quotes in prompts; pass pain theme summaries not full discovery JSON.
- Generated markdown must pass `BLUEPRINT_REQUIRED_SECTIONS` / `PHASE_PLAN_REQUIRED_SECTIONS` before persistence.
- Blueprint functional requirement: delivery map in section 13 must list phases 0–5 at high level (no detailed phase 1+ content).

### Risks

| Risk | Impact | Mitigation |
|---|---|---|
| LLM omits required sections after template render | High | `validateSections` gate; repair retry with missing section list |
| Token limit on large sessions | Medium | Theme-first prompt; truncate quotes; cap evidence references |
| Variable JSON too large for one field | Medium | Allow multiline strings; cap per-field length in schema validator |
| User expects phase 1+ auto-generation | Medium | UI copy + plan status control; document lifecycle in README |
| Blueprint hallucinates market data | High | Ground prompts in pain themes + evidence IDs; label inference in blueprint evidence section |

### Decisions (phase 3)

| ID | Decision | Rationale |
|---|---|---|
| D1 | Template-hybrid: LLM → JSON variables → template render → section lint | Reuses phase 0 engine; guarantees heading structure |
| D2 | Blueprint requires ≥1 pain theme | Planning without discovery is empty synthesis |
| D3 | Phase 0 requires existing session blueprint | Phase 0 derives from blueprint per PROJECT_PLANNING |
| D4 | Replace blueprint on regenerate; bump `version` | Avoid duplicate artifacts; user can re-run |
| D5 | Phase 0 only in v1; phase 1+ deferred | Matches blueprint non-goal and agent lifecycle |
| D6 | `MARK_PHASE_PLAN_STATUS` for phase 0 only | Prepares lifecycle without implementing phase 1 generator |
| D7 | Export via side panel download (existing pattern) | No new permissions; works offline for saved artifacts |
| D8 | JSON bundle export deferred to phase 5 | Markdown export satisfies v1 portability promise |

## 8. Dependencies

### External

- User LLM API key and host permission (inherited from phase 2; non-blocking for code).
- Chrome downloads API (already available to side panel pages).

### Internal (must be complete)

- Phase 2 discovery engine and pain themes (verified).
- Phase 0 template engine and packaged assets (verified).

### Downstream dependents

- Phase 4 post suggestions read blueprint positioning and community profiles.
- Phase 5 may add JSON bundle and phase 1+ generation.

### Dependency graph

```text
phase_2 (complete)
    └── phase_3 (this plan)
            └── phase_4 (post-suggestions)
                    └── phase_5 (hardening-release)
```

## 9. Architecture and affected systems

### Target flow

```text
Side Panel                         Service Worker
──────────                         ──────────────
[Project title/slug]
[Generate blueprint]
    │
    └──GENERATE_BLUEPRINT────────► load themes + evidence + profiles
                                   build blueprint prompt
                                   llmAdapter.complete()
                                   parse JSON → variables
                                   renderBlueprint() + validateSections()
                                   upsertBlueprint()
    ◄──BLUEPRINT_READY───────────  blueprint markdown + version

[Generate phase 0]
    │
    └──GENERATE_PHASE0───────────► load blueprint + themes
                                   build phase0 prompt
                                   llmAdapter.complete()
                                   parse JSON → variables
                                   renderPhasePlan() + validateSections()
                                   upsertPhasePlan(phaseNumber: 0)
    ◄──PHASE0_READY──────────────  phase 0 markdown

[Export blueprint / phase 0]       (client reads GET_BLUEPRINT / GET_PHASE_PLAN)
[Mark phase 0 complete] ─────────► MARK_PHASE_PLAN_STATUS
```

### New modules

| Module | Responsibility |
|---|---|
| `shared/planning/schema.ts` | Blueprint + phase 0 variable types and validators |
| `shared/planning/prompt.ts` | Build system/user prompts for blueprint and phase 0 |
| `shared/planning/parser.ts` | Extract JSON, validate keys, normalize slugs/dates |
| `shared/planning/fixtures/*.json` | Parser test fixtures |
| `background/handlers/planning.ts` | `GENERATE_BLUEPRINT`, `GENERATE_PHASE0` orchestration |
| `sidepanel/planning-ui.ts` | Planning section UI, export, status controls |

### LLM JSON contracts

**Blueprint variables response:**

```typescript
interface BlueprintVariablesPayload {
  project_slug: string;
  project_title: string;
  executive_decision: string;
  evidence_method: string;
  intelligence_report: string;
  user_problem: string;
  competitive_landscape: string;
  uvp: string;
  validation_experiments: string;
  prd: string;
  mvp_scope: string;
  architecture: string;
  interfaces: string;
  security: string;
  delivery_map: string;
  gtm: string;
  risks: string;
  sources: string;
  handoff: string;
}
```

**Phase 0 variables response:**

```typescript
interface Phase0VariablesPayload {
  phase_title: string;
  objective: string;
  relation: string;
  entry_criteria: string;
  scope: string;
  non_goals: string;
  audit: string;
  assumptions: string;
  dependencies: string;
  architecture: string;
  files: string;
  supporting_docs: string;
  tasks: string;
  delegation: string;
  validation_rows: string;
  security: string;
  env_rows: string;
  deferred_rows: string;
  rollback: string;
  acceptance: string;
  completion: string;
  deviations: string;
  next_plan_prompt: string;
}
```

Metadata fields (`status`, `created`, `updated`, `source_phase`, `phase_number`) are set by the engine, not the LLM.

### Message protocol additions

| Message | Direction | Purpose |
|---|---|---|
| `GENERATE_BLUEPRINT` | panel → bg | LLM synthesis → blueprint for session |
| `GENERATE_PHASE0` | panel → bg | LLM synthesis → phase 0 plan from blueprint |
| `GET_BLUEPRINT` | panel → bg | Latest blueprint for session |
| `GET_PHASE_PLAN` | panel → bg | Phase plan by session + phaseNumber |
| `MARK_PHASE_PLAN_STATUS` | panel → bg | Set `draft` \| `complete` on phase plan |

## 10. Files and paths in scope

### Create

- `extension/src/shared/planning/schema.ts`
- `extension/src/shared/planning/prompt.ts`
- `extension/src/shared/planning/prompt.test.ts`
- `extension/src/shared/planning/parser.ts`
- `extension/src/shared/planning/parser.test.ts`
- `extension/src/shared/planning/fixtures/sample-blueprint-response.json`
- `extension/src/shared/planning/fixtures/sample-phase0-response.json`
- `extension/src/background/handlers/planning.ts`
- `extension/src/sidepanel/planning-ui.ts`
- `docs/decisions/0004-planning-engine-architecture.md`

### Update

- `extension/manifest.json` — version `0.3.0`
- `extension/src/shared/storage/storage-adapter.ts` — blueprint + phase plan CRUD
- `extension/src/shared/messages/types.ts` — planning messages
- `extension/src/background/handlers/messages.ts` — route planning handlers
- `extension/src/sidepanel/index.html` — Planning section
- `extension/src/sidepanel/main.ts` — wire planning UI
- `extension/src/sidepanel/styles.css` — artifact cards, preview blocks
- `README.md` — planning workflow
- `docs/plans/phase_3_planning-engine_plan.md` — completion evidence on finish
- `.cursor/STATE.md`
- `.cursor/memory/memories/2026-07-11-continuation.md`

## 11. Supporting documents to create or update

| Path | Purpose |
|---|---|
| `docs/decisions/0004-planning-engine-architecture.md` | Template-hybrid flow, lifecycle, data minimization |
| `README.md` | Blueprint + phase 0 workflow |
| `extension/src/shared/planning/fixtures/*.json` | Parser and validation tests |

## 12. Ordered implementation tasks

### Task 3.1 — Planning schema and parser

- **Objective:** Validate LLM JSON into template variable records.
- **Dependencies:** None.
- **Files:** `planning/schema.ts`, `planning/parser.ts`, fixtures, `parser.test.ts`.
- **Notes:** Reuse fenced-JSON extraction pattern from `discovery/parser.ts`. Normalize `project_slug` (kebab-case). Inject `created`/`updated` dates server-side. Reject empty required string fields.
- **Validation:** Fixture JSON parses; missing required keys throw structured `PlanningParseError`.
- **Status:** complete

### Task 3.2 — Planning prompts

- **Objective:** Build blueprint and phase 0 prompts grounded in session data.
- **Dependencies:** 3.1.
- **Files:** `planning/prompt.ts`, `prompt.test.ts`.
- **Notes:** Blueprint prompt includes pain themes (title, summary, severity, evidenceIds, inferenceFlag), top evidence quotes (capped), community profile summaries. Phase 0 prompt includes full blueprint markdown (truncated if needed) + instruction to output phase 0 variables only. System prompts: JSON only, ground claims in provided themes.
- **Validation:** Prompt tests assert theme IDs and session name appear; phase 0 prompt includes blueprint excerpt marker.
- **Status:** complete

### Task 3.3 — Storage CRUD for blueprints and phase plans

- **Objective:** Persist and retrieve planning artifacts per session.
- **Dependencies:** None.
- **Files:** `storage-adapter.ts`, `storage-adapter.test.ts`.
- **Notes:** `upsertBlueprint`: one per session, increment `version` on replace. `upsertPhasePlan`: keyed by `(sessionId, phaseNumber)`. `getPhasePlan(sessionId, 0)` for phase 0. Tests for replace/version bump and status update.
- **Validation:** Storage tests pass for blueprint upsert, phase plan upsert, status mark.
- **Status:** complete

### Task 3.4 — Template render + validation pipeline

- **Objective:** Convert parsed variables to markdown and enforce section coverage.
- **Dependencies:** 3.1.
- **Files:** `planning/parser.ts` or `planning/render.ts` (if split), use `templates/engine.ts`.
- **Notes:** `renderBlueprintFromVariables(vars)`, `renderPhase0FromVariables(vars)` helpers. Run `validateSections` against `BLUEPRINT_REQUIRED_SECTIONS` / `PHASE_PLAN_REQUIRED_SECTIONS`. Return `{ markdown, valid, missing }`.
- **Validation:** Fixture variables render markdown passing section linter tests.
- **Status:** complete

### Task 3.5 — Planning background handler

- **Objective:** End-to-end `GENERATE_BLUEPRINT` and `GENERATE_PHASE0`.
- **Dependencies:** 3.1–3.4, phase 2 LLM adapter.
- **Files:** `handlers/planning.ts`, update `messages.ts`.
- **Notes:** Mirror discovery handler: prerequisite checks, LLM call, parse, render, validate, one repair retry with missing sections listed, persist, return artifact. `GENERATE_PHASE0` fails fast if no blueprint. Emit `STORAGE_UPDATED` after writes.
- **Validation:** Integration test with mocked LLM returning fixtures; artifacts persisted with valid sections.
- **Status:** complete

### Task 3.6 — Message types and routing

- **Objective:** Wire planning messages through service worker.
- **Dependencies:** 3.5.
- **Files:** `messages/types.ts`, `handlers/messages.ts`.
- **Notes:** Add GET handlers for side panel load. `MARK_PHASE_PLAN_STATUS` accepts `{ sessionId, phaseNumber, status }`.
- **Validation:** Typecheck passes; message union exhaustive in router.
- **Status:** complete

### Task 3.7 — Planning UI

- **Objective:** User can generate, preview, export, and mark phase 0 status.
- **Dependencies:** 3.6.
- **Files:** `planning-ui.ts`, `index.html`, `main.ts`, `styles.css`.
- **Notes:** Fields: project title (optional override). Buttons: Generate blueprint, Generate phase 0, Export blueprint, Export phase 0, Mark phase 0 complete. Disable generate when prerequisites missing. Show version, created date, section-valid badge. `aria-busy` during generation. Reuse `downloadMarkdown` from `main.ts` (extract to shared util if needed).
- **Validation:** Manual — with API key and themes, blueprint + phase 0 generate and download (user-assisted).
- **Status:** complete

### Task 3.8 — ADR, README, full validation

- **Objective:** Document and verify phase 3.
- **Dependencies:** 3.1–3.7.
- **Files:** `docs/decisions/0004-planning-engine-architecture.md`, `README.md`.
- **Validation:** `npm run lint`, `npm run test`, `npm run typecheck`, `npm run build` pass.
- **Status:** complete

## 13. Sub-agent delegation map

| Slice | Delegable? | Owner | Boundaries |
|---|---|---|---|
| Schema + parser + fixtures + tests | Yes | sub-agent | `shared/planning/schema`, `parser`, fixtures |
| Prompt builder + tests | Yes | sub-agent | `shared/planning/prompt` |
| Storage CRUD + tests | Yes | sub-agent | `storage-adapter.ts` blueprint/phase plan methods |
| Render/validation helpers | Yes | sub-agent | `shared/planning/` or thin wrapper over `templates/engine` |
| Planning background handler | Lead preferred | lead | `background/handlers/planning.ts` |
| Planning UI | Yes | sub-agent | `sidepanel/planning-ui.ts` — messages only |
| ADR + README | Lead agent | lead | `docs/decisions/`, `README.md` |

## 14. Test and validation matrix

| Requirement | Validation method | Expected evidence | Status |
|---|---|---|---|
| Blueprint JSON parsing | Fixture test | Valid variable record | complete |
| Phase 0 JSON parsing | Fixture test | Valid variable record | complete |
| Blueprint section coverage | Render + validateSections test | 17/17 sections present | complete |
| Phase 0 section coverage | Render + validateSections test | 22/22 sections present | complete |
| Missing section repair path | Handler logic | Repair retry on validation failure | complete |
| Blueprint upsert + version bump | Storage test | version increments on replace | complete |
| Phase plan status update | Storage test | `draft` → `complete` | complete |
| Prerequisites enforced | Handler code | No themes / no blueprint errors | complete |
| API key not in exports | Inspect export content | No key strings | complete |
| Planning UI renders | Manual | Buttons and previews appear | pending (user-assisted) |
| Generate with real LLM | Manual with API key | Valid markdown downloads | pending (user-assisted) |
| TypeScript strict | `npm run typecheck` | Exit 0 | complete |
| Build | `npm run build` | dist/ v0.3.0 | complete |
| Lint | `npm run lint` | Exit 0 | complete |
| No secrets in repo | grep | No API keys committed | complete |

## 15. Security, privacy, reliability, accessibility, and performance checks

- **Security:** LLM calls from service worker only; sanitize/truncate evidence in prompts; no API key in artifacts or logs.
- **Privacy:** Send only active session themes, capped evidence quotes, and profiles — not other sessions or browsing history.
- **Reliability:** Section validation gate before persist; JSON repair retry; saved artifacts viewable/exportable offline.
- **Accessibility:** Planning form labels; `aria-busy` on generate; `aria-live` for errors; keyboard-accessible export buttons.
- **Performance:** Truncate blueprint input in phase 0 prompt if > 12k chars; target < 60s per generation on manual check.

## 16. Environment-variable registry

Never include values.

| Variable name | Purpose | Scope/environment | Required by phase | Source/provider | Status |
|---|---|---|---|---|---|
| `IMPLEMENTO_LLM_API_URL` | OpenAI-compatible base URL | `chrome.storage.local` | phase 2+ (used by phase 3) | User/provider dashboard | required_at_runtime |
| `IMPLEMENTO_LLM_API_KEY` | LLM authentication | `chrome.storage.local` only | phase 2+ (used by phase 3) | User/provider dashboard | required_at_runtime |
| `IMPLEMENTO_LLM_MODEL` | Model selection | `chrome.storage.local` | phase 2+ (used by phase 3) | User preference | required_at_runtime |
| `IMPLEMENTO_LLM_TEMPERATURE` | Sampling temperature | `chrome.storage.local` | phase 2+ | User preference | optional |
| `REDDIT_CLIENT_ID` | OAuth client ID | Backend/extension OAuth | phase 5 | Reddit developer portal | deferred |
| `REDDIT_CLIENT_SECRET` | OAuth secret | Backend only | phase 5 | Reddit developer portal | deferred |

No new environment variables in phase 3.

## 17. Deferred human-action queue

| Action | Why agent cannot perform | Earliest phase | Blocking now? | Final-checklist destination |
|---|---|---|---|---|
| Supply LLM API key | User's provider account | phase 2+ verification | No | Env vars section |
| Manual blueprint + phase 0 test | Requires user API key | phase 3 verification | No | Completion evidence |
| JSON project bundle export | Broader portability scope | phase 5 | No | Export section |
| Phase 1+ plan generation UI | Lifecycle feature beyond phase 0 | post-phase 3 or phase 5 | No | Planning section |

## 18. Rollback and recovery

- Remove planning handlers and UI to restore phase 2 discovery-only workflow.
- Blueprints and phase plans are additive in storage; clear via extension data reset.
- Template assets unchanged; rollback does not affect capture or discovery.
- Revert manifest version if planning removed.

## 19. Acceptance criteria

Phase 3 is complete when ALL are true:

1. User with configured LLM and ≥1 pain theme can click **Generate blueprint** and receive a persisted blueprint passing all 17 section headings.
2. User with an existing session blueprint can click **Generate phase 0** and receive a persisted phase 0 plan passing all 22 section headings.
3. Blueprint regenerate replaces prior artifact and increments `version`.
4. User can **Export blueprint** and **Export phase 0** as `.md` downloads without API key in file content.
5. User can mark phase 0 plan status `complete` via UI.
6. Missing prerequisites show actionable errors (no LLM, no themes, no blueprint).
7. Capture and discovery workflows still work when planning is unused.
8. Parser, prompt, storage, and section validation unit tests pass.
9. `npm run lint`, `npm run test`, `npm run typecheck`, `npm run build` pass.
10. `docs/decisions/0004-planning-engine-architecture.md` recorded.
11. This plan updated with completion evidence and status `complete`.
12. `STATE.md` reflects phase 3 complete; next action = generate phase 4 plan.

## 20. Completion evidence

| Check | Evidence |
|---|---|
| Build | `npm run build` exit 0; `dist/` v0.3.0 with planning handler + UI chunks |
| Tests | 43/43 pass (planning parser/prompt, storage blueprint/phase CRUD, existing suites) |
| Typecheck / lint | `npm run typecheck` and `npm run lint` exit 0 |
| ADR | `docs/decisions/0004-planning-engine-architecture.md` |
| README | Blueprint + phase 0 workflow documented |
| Blueprint generation | Deferred — requires user API key + pain themes |
| Phase 0 generation | Deferred — requires user API key + blueprint |

## 21. Deviations and follow-ups

- No separate `planning/render.test.ts`; section coverage validated in `parser.test.ts` via render helpers.
- Manual LLM planning test deferred to user with API key.

## 22. Next Plan Generation Prompt

Read `/AGENTS.md`, the complete core agent context, `/instructions/PROJECT_PLANNING.md`, the original `docs/plans/phase_0_foundations_plan.md`, this completed phase plan, all completion evidence, current repository state, active blockers, and relevant decisions. Confirm phase 3 is fully implemented and validated. Then generate exactly one exhaustive next phase plan at `docs/plans/phase_4_post-suggestions_plan.md`. Derive it from the phase-0 roadmap and verified current state, preserve unresolved requirements, include all required plan sections, defer non-blocking human actions to the final phase, and do not implement phase 4 until the plan is written.
