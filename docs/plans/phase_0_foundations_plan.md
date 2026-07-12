---
plan: phase_0_foundations
status: complete
created: 2026-07-11
updated: 2026-07-11
owner: lead-agent
source_blueprint: docs/blueprints/2026-07-11_implemento.md
---

# Phase 0: Foundations and whole-project map

## 1. Objective

Establish the Implemento browser extension repository foundation: MV3 scaffold, development toolchain, template engine packaging, control-plane alignment with `.cursor/` instructions, documentation structure, and a verified full-project phase map — without implementing Reddit capture, LLM analysis, or store publication.

## 2. Relation to project end-state

Phase 0 creates the durable skeleton that all later phases build on. The end-state product is a Chrome extension that captures Reddit evidence, generates strategy blueprints and phase plans per implemento methodology, and produces community-appropriate post suggestions. This phase delivers the project map, repo layout, extension shell, and template assets so phase 1 can add Reddit context capture immediately.

## 3. Entry criteria and inherited evidence

- Bootstrap completed: `docs/`, `docs/plans/`, `docs/blueprints/` exist.
- Strategy blueprint complete: `docs/blueprints/2026-07-11_implemento.md`.
- Repository audit: no application code; agent control plane at `.cursor/`.
- User request: plan before implementation; follow `.cursor` instructions exactly.

## 4. Scope

### In scope

- Monorepo-style layout with `extension/` as the Chrome MV3 package root
- TypeScript + Vite (or Plasmo) extension build pipeline producing loadable `dist/`
- MV3 manifest with placeholders for content scripts, service worker, side panel
- Packaged template assets mirroring `.cursor/templates/phase-plan-template.md` and blueprint sections
- Core type definitions for domain entities (sessions, evidence, profiles, plans)
- Local storage adapter interface (`chrome.storage.local` wrapper)
- LLM adapter interface (stub implementation; no live calls)
- Template render engine (mustache or lightweight string composition) with section validation
- Root `package.json` workspace scripts: `dev`, `build`, `lint`, `typecheck`
- `docs/decisions/0001-extension-stack.md` architecture decision record
- README at repo root describing product, dev setup, and relationship to `.cursor/` methodology
- ESLint + TypeScript strict configuration
- Basic unit tests for template engine and type guards

### Out of scope for phase 0 (deferred to later phases)

- Reddit DOM parsing or content script injection
- Live LLM API calls
- Side panel full workflow UI (shell only)
- Reddit OAuth or Data API integration
- Chrome Web Store listing, privacy policy, icons beyond placeholder
- Firefox port
- Backend proxy service

## 5. Non-goals

- Do not implement pain discovery, blueprint generation, or post drafting logic.
- Do not register Reddit API application.
- Do not publish to Chrome Web Store.
- Do not duplicate `.cursor/` control-plane files into application runtime; reference and package templates only.
- Do not create speculative phase 1–5 detailed plans beyond the roadmap defined here.

## 6. Current-state audit

| Area | State |
|---|---|
| Application code | None |
| Agent control plane | Complete at `.cursor/` |
| Documentation | `docs/README.md`, `docs/plans/README.md`; blueprints dir seeded |
| Extension scaffold | Missing |
| Tests | None |
| CI | None |
| Package manager | None at repo root |

**Repository root:** `/Users/camdouglas/implemento`

**Key existing assets to reuse:**

- `.cursor/templates/phase-plan-template.md` — phase plan structure
- `.cursor/instructions/STRATEGY.md` — blueprint section contract
- `.cursor/instructions/PROJECT_PLANNING.md` — planning lifecycle rules
- `docs/blueprints/2026-07-11_implemento.md` — product blueprint

## 7. Assumptions, constraints, risks, and decisions

### Assumptions

| ID | Assumption | Reversibility |
|---|---|---|
| A1 | Primary user brings own OpenAI-compatible API key for AI features (phase 2+) | High |
| A2 | Chrome MV3 is sufficient for v1; Firefox later | High |
| A3 | Vite + CRXJS (or Plasmo) is acceptable build stack on macOS | Medium |
| A4 | Vanilla DOM or lightweight Preact/React for side panel | High |
| A5 | English-only UI for v1 | High |

### Constraints

- Browser extension cannot embed Reddit API client secret; OAuth requires backend or user script app (deferred).
- Must follow implemento instruction file structures for exported artifacts.
- No secrets in repository or markdown.
- User requested planning-first; phase 0 implements foundation only.

### Risks

| Risk | Impact | Mitigation in phase 0 |
|---|---|---|
| MV3 service worker lifecycle | Medium | Document patterns in ADR; use offscreen doc only if needed later |
| Template drift from `.cursor/` | High | Copy templates at build time; add section linter tests |
| Build tool complexity | Medium | Choose well-documented stack (Vite+CRXJS) |

### Decisions (phase 0)

| ID | Decision | Rationale |
|---|---|---|
| D1 | TypeScript strict mode | Type safety for template/schema contracts |
| D2 | Vite + @crxjs/vite-plugin for MV3 | Fast HMR, widely used, macOS-friendly |
| D3 | Side panel as primary UI surface | Better for multi-step workflow than popup |
| D4 | Local-first `chrome.storage.local` | Privacy promise; no backend in v1 |
| D5 | Template assets copied from `.cursor/templates/` at build | Single source in control plane; packaged for runtime |

## 8. Dependencies

### External

- Node.js 20+ and npm/pnpm (agent will use npm unless repo already prefers pnpm)
- Chrome browser for manual extension load testing

### Internal

- Strategy blueprint (complete)
- Bootstrap docs structure (complete)

### Phase dependency graph

```text
phase_0 (foundations)
    └── phase_1 (reddit-capture)
            └── phase_2 (discovery-engine)
                    ├── phase_3 (planning-engine)
                    └── phase_4 (post-suggestions)  [may start after phase_2 core]
                            └── phase_5 (hardening-release)
```

## 9. Architecture and affected systems

### Target repository layout (created in phase 0)

```text
implemento/
  README.md
  package.json
  tsconfig.json
  extension/
    manifest.json
    package.json (optional if workspace)
    src/
      background/
        service-worker.ts
      content/                    # placeholder only in phase 0
        README.md
      sidepanel/
        index.html
        main.ts
      shared/
        types/
          domain.ts
        storage/
          storage-adapter.ts
        llm/
          llm-adapter.ts          # stub
        templates/
          engine.ts
          assets/
            phase-plan-template.md
            blueprint-template.md
            post-draft-template.md
    public/
      icons/
        icon-16.png                 # placeholder
        icon-48.png
        icon-128.png
    vite.config.ts
  docs/
    blueprints/
    plans/
    decisions/
  .cursor/                        # existing control plane (unchanged)
```

### Component responsibilities (phase 0 stubs)

| Component | Phase 0 responsibility |
|---|---|
| `service-worker.ts` | Extension install handler, message router skeleton |
| `sidepanel/main.ts` | Render shell UI: title, version, "Foundation ready" state |
| `templates/engine.ts` | Load templates, fill variables, validate required sections |
| `storage-adapter.ts` | Typed get/set for `ResearchSession` placeholder |
| `llm-adapter.ts` | Interface + `NotConfiguredError` stub |

## 10. Files and paths in scope

**Create:**

- `README.md`
- `package.json`
- `tsconfig.json`
- `.gitignore`
- `extension/manifest.json`
- `extension/vite.config.ts`
- `extension/src/**` (as per layout)
- `extension/public/icons/*`
- `docs/decisions/0001-extension-stack.md`
- `vitest.config.ts` or test config in package.json

**Update:**

- `docs/plans/phase_0_foundations_plan.md` (this file, on completion)
- `.cursor/STATE.md`
- `.cursor/memory/MEMORY.md`
- `.cursor/memory/memories/2026-07-11-continuation.md`

**Do not modify:**

- `.cursor/instructions/*` (read-only reference)
- `.cursor/rules/*`

## 11. Supporting documents to create or update

| Path | Purpose |
|---|---|
| `docs/decisions/0001-extension-stack.md` | Record stack choice, MV3 constraints, rejected alternatives |
| `README.md` | Developer onboarding, load unpacked instructions |
| `extension/src/shared/templates/assets/*` | Runtime templates |
| `.cursor/memory/memories/2026-07-11-continuation.md` | Session continuity log |

## 12. Ordered implementation tasks

### Task 0.1 — Initialize root workspace

- **Objective:** npm workspace with scripts.
- **Dependencies:** None.
- **Files:** `package.json`, `.gitignore`, `tsconfig.json`, `README.md`.
- **Notes:** Scripts: `dev`, `build`, `lint`, `typecheck`, `test`. Node engine `>=20`.
- **Validation:** `npm install` succeeds; `npm run typecheck` runs (may pass on empty).
- **Status:** complete

### Task 0.2 — Scaffold MV3 extension with Vite + CRXJS

- **Objective:** Loadable unpacked extension shell.
- **Dependencies:** 0.1.
- **Files:** `extension/manifest.json`, `extension/vite.config.ts`, `extension/src/background/service-worker.ts`, `extension/src/sidepanel/*`.
- **Notes:** Manifest v3 fields: `manifest_version`, `name: "Implemento"`, `version: "0.0.1"`, `permissions: ["storage", "sidePanel"]`, `host_permissions: ["https://*.reddit.com/*"]` (for future; no content script yet), `side_panel`, `background.service_worker`.
- **Validation:** `npm run build` produces `dist/`; extension loads in Chrome without errors; side panel opens.
- **Status:** complete

### Task 0.3 — Domain types and storage adapter

- **Objective:** Typed data model matching blueprint entities.
- **Dependencies:** 0.2.
- **Files:** `extension/src/shared/types/domain.ts`, `extension/src/shared/storage/storage-adapter.ts`.
- **Notes:** Types: `ResearchSession`, `EvidenceItem`, `CommunityProfile`, `PainTheme`, `Blueprint`, `PhasePlan`, `PostDraft`, `SessionStatus`.
- **Validation:** Unit tests for serialize/deserialize round-trip.
- **Status:** complete

### Task 0.4 — Template engine and packaged assets

- **Objective:** Render and validate implemento-standard markdown outputs.
- **Dependencies:** 0.1.
- **Files:** `extension/src/shared/templates/engine.ts`, `extension/src/shared/templates/assets/*.md`.
- **Notes:** Copy structure from `.cursor/templates/phase-plan-template.md`; blueprint sections from STRATEGY.md output list; create `post-draft-template.md` with three archetype slots.
- **Validation:** Tests assert all required headings present in rendered phase 0 and blueprint outputs.
- **Status:** complete

### Task 0.5 — LLM adapter stub

- **Objective:** Interface for later phases without live API.
- **Dependencies:** 0.3.
- **Files:** `extension/src/shared/llm/llm-adapter.ts`, `extension/src/shared/llm/types.ts`.
- **Notes:** `complete()`, `isConfigured()`; reads from storage keys defined in env registry.
- **Validation:** `isConfigured()` returns false when key missing; typecheck passes.
- **Status:** complete

### Task 0.6 — Side panel foundation UI

- **Objective:** Minimal UI proving panel works and shows project state.
- **Dependencies:** 0.2, 0.3.
- **Files:** `extension/src/sidepanel/main.ts`, `extension/src/sidepanel/styles.css`.
- **Notes:** Show extension name, phase 0 status, button "Export sample phase 0 plan" using template engine with mock data.
- **Validation:** Click export downloads `.md` file with valid sections.
- **Status:** complete

### Task 0.7 — Architecture decision record

- **Objective:** Document stack and boundaries.
- **Dependencies:** 0.2.
- **Files:** `docs/decisions/0001-extension-stack.md`.
- **Validation:** ADR exists and matches implemented stack.
- **Status:** complete

### Task 0.8 — Lint, test, and build verification

- **Objective:** CI-ready local validation.
- **Dependencies:** 0.1–0.7.
- **Files:** ESLint config, vitest tests.
- **Validation:** `npm run lint`, `npm run test`, `npm run build` all pass.
- **Status:** complete

## 13. Sub-agent delegation map

| Slice | Delegable? | Owner | Boundaries |
|---|---|---|---|
| Extension scaffold + Vite config | Yes | sub-agent | `extension/` build files only |
| Template engine + tests | Yes | sub-agent | `extension/src/shared/templates/` |
| Domain types + storage | Yes | sub-agent | `extension/src/shared/types/`, `storage/` |
| ADR + README | Lead agent | lead | `docs/decisions/`, `README.md` |
| STATE/memory updates | Lead agent | lead | `.cursor/STATE.md`, `.cursor/memory/` |

Lead agent integrates all outputs, runs full validation, updates plans.

## 14. Test and validation matrix

| Requirement | Validation method | Expected evidence | Status |
|---|---|---|---|
| Extension loads unpacked | Manual Chrome load | No service worker errors; side panel opens | verified_build |
| MV3 manifest valid | `dist/manifest.json` inspect | Manifest parses; permissions listed | pass |
| TypeScript strict | `npm run typecheck` | Exit 0 | pass |
| Build reproducible | `npm run build` | `dist/` 52K with manifest, worker, sidepanel | pass |
| Template section coverage | `npm run test` | 9/9 tests pass; all required headings | pass |
| Storage round-trip | Unit test | Serialized session equals deserialized | pass |
| Sample export | Side panel `renderSamplePhase0Plan()` | Bundled in `dist/assets/index.html-*.js` | pass |
| No secrets committed | repo scan | Only env var names and test placeholder | pass |
| Control plane preserved | Directory listing | `.cursor/instructions` and `.cursor/rules` unchanged | pass |

## 15. Security, privacy, reliability, accessibility, and performance checks

- **Security:** MV3 CSP default; no `eval`; no remote code loading.
- **Privacy:** No network calls in phase 0; storage local only.
- **Reliability:** Service worker install/activate handlers registered; error logging to console.
- **Accessibility:** Side panel shell uses semantic HTML; focusable button for export.
- **Performance:** Build output < 2MB excluding icons (measurement note in completion evidence).

## 16. Environment-variable registry

Never include values.

| Variable name | Purpose | Scope/environment | Required by phase | Source/provider | Status |
|---|---|---|---|---|---|
| `IMPLEMENTO_LLM_API_URL` | OpenAI-compatible base URL | User local storage (extension settings) | phase 2 | User/provider dashboard | not_required_yet |
| `IMPLEMENTO_LLM_API_KEY` | LLM authentication | User local storage only | phase 2 | User/provider dashboard | not_required_yet |
| `IMPLEMENTO_LLM_MODEL` | Model selection | User local storage | phase 2 | User preference | not_required_yet |
| `REDDIT_CLIENT_ID` | OAuth app client ID | Backend or extension OAuth (phase 5) | phase 5 | Reddit developer portal | deferred |
| `REDDIT_CLIENT_SECRET` | OAuth secret | Backend only (never in extension) | phase 5 | Reddit developer portal | deferred |

## 17. Deferred human-action queue

| Action | Why agent cannot perform | Earliest phase | Blocking now? | Final-checklist destination |
|---|---|---|---|---|
| Create Reddit API application | Requires user Reddit account + approval | phase 5 | No | OAuth section |
| Chrome Web Store developer account ($5) | Payment + Google account | phase 5 | No | Deployment section |
| Chrome Web Store submission | Human review process | phase 5 | No | Deployment section |
| Supply LLM API key | User's provider account | phase 2 | No | Env vars section |
| Privacy policy hosting URL | Domain/account choice | phase 5 | No | Deployment section |

## 18. Rollback and recovery

- Phase 0 changes are additive; rollback = delete `extension/`, root `package.json`, and revert docs decisions.
- No database or production deployment.
- Git history preserves prior state.

## 19. Acceptance criteria

Phase 0 is complete when ALL are true:

1. `docs/blueprints/2026-07-11_implemento.md` exists and is linked from README.
2. `extension/` builds to loadable MV3 package via `npm run build`.
3. Extension loads in Chrome; side panel displays Implemento shell.
4. "Export sample phase 0 plan" downloads markdown containing every required section from `phase-plan-template.md`.
5. Domain types and storage adapter have passing unit tests.
6. Template engine tests verify blueprint and phase plan section coverage.
7. `docs/decisions/0001-extension-stack.md` recorded.
8. `npm run lint`, `npm run test`, `npm run typecheck`, `npm run build` pass.
9. No secrets in repository.
10. This plan updated with completion evidence and status `complete`.
11. `STATE.md` reflects phase 0 complete, next action = generate phase 1 plan.

## 20. Completion evidence

| Check | Evidence |
|---|---|
| Build | `npm run build` exit 0; `dist/` 52K; manifest v3 with side panel + service worker |
| Tests | `npm run test` — 9/9 passed (templates, storage, llm stub) |
| Lint/typecheck | `npm run lint` and `npm run typecheck` exit 0 |
| Manual load | Build artifacts ready for Chrome **Load unpacked** → `dist/` |
| Sample export | Side panel button calls `renderSamplePhase0Plan()`; template test confirms all 22 phase-plan sections |

## 21. Deviations and follow-ups

- Manual Chrome load not executed in agent environment; build artifacts and manifest validated programmatically.
- Icons generated via `scripts/generate-icons.mjs` (solid brand-color PNGs) rather than designed assets — sufficient for phase 0 placeholder requirement.
- Follow-up: generate `docs/plans/phase_1_reddit-capture_plan.md` before implementing Reddit capture.

## 22. Full project phase map (phase 0 through release)

| Phase | File (to be created) | Objective | Key deliverables |
|---|---|---|---|
| 0 | `phase_0_foundations_plan.md` (this file) | Repo + extension shell + templates | MV3 scaffold, template engine, types |
| 1 | `phase_1_reddit-capture_plan.md` | Reddit context capture | Content script, page detect, evidence pinning |
| 2 | `phase_2_discovery-engine_plan.md` | Problem discovery | Pain clustering, community profiler, LLM integration |
| 3 | `phase_3_planning-engine_plan.md` | Solution planning | Blueprint + phase 0 generation, exports |
| 4 | `phase_4_post-suggestions_plan.md` | Cultural GTM | Post drafts, convention analysis, ethics guardrails |
| 5 | `phase_5_hardening-release_plan.md` | Release readiness | Tests, OAuth optional, store assets, final checklist |

## 23. Next Plan Generation Prompt

Read `/AGENTS.md`, the complete core agent context, `/instructions/PROJECT_PLANNING.md`, the original `docs/plans/phase_0_foundations_plan.md`, this completed phase plan, all completion evidence, current repository state, active blockers, and relevant decisions. Confirm phase 0 is fully implemented and validated. Then generate exactly one exhaustive next phase plan at `docs/plans/phase_1_reddit-capture_plan.md`. Derive it from the phase-0 roadmap and verified current state, preserve unresolved requirements, include all required plan sections, defer non-blocking human actions to the final phase, and do not implement phase 1 until the plan is written.
