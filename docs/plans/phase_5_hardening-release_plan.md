---
plan: phase_5_hardening-release
status: complete
created: 2026-07-11
updated: 2026-07-11
owner: lead-agent
source_phase: docs/plans/phase_4_post-suggestions_plan.md
---

# Phase 5: Hardening and release

## 1. Objective

Harden the complete Implemento extension pipeline (capture → discovery → planning → posts), add session **JSON bundle** portability, establish **CI validation**, prepare **Chrome Web Store release artifacts** (privacy policy, listing copy, permission justifications), document an **optional OAuth upgrade path** (stub only), run full validation, and produce `docs/plans/final_implementation_checklist.md` consolidating all remaining human-only actions. Target release version **1.0.0**.

This is the **final planned implementation phase**. No phase 6 plan will be generated.

## 2. Relation to project end-state

Phases 0–4 delivered the MVP feature loop. Phase 5 closes the project lifecycle defined in `PROJECT_PLANNING.md`: integrate, validate, document release readiness, and defer unavoidable human actions (API keys, store submission, Reddit OAuth approval) to the final checklist.

After phase 5, the product is **sideload-ready** and **store-submission-ready** pending human completion of checklist items.

## 3. Entry criteria and inherited evidence

### Phase 4 completion (verified)

| Criterion | Evidence |
|---|---|
| Full pipeline | Capture, discovery, planning, post drafts |
| LLM BYOK | Settings, discovery, planning, posts handlers |
| Ethics guardrails | `posts/ethics.ts`, ADR 0005 |
| Tests | 49/49 passing |
| Build | `dist/` v0.4.0 |
| ADRs | 0001–0005 |

### Inherited deferred items (from phases 0–4)

| Item | Source |
|---|---|
| JSON project bundle export/import | Phase 3 D8, phase 4 out of scope |
| Manual LLM E2E verification | Phases 2–4 completion evidence |
| Chrome Web Store developer account + submission | Phase 0 deferred queue |
| Privacy policy hosting URL | Phase 0 deferred queue |
| Reddit OAuth application | Phase 0/1/2 deferred queue |
| `REDDIT_CLIENT_ID` / `REDDIT_CLIENT_SECRET` | Env registry |
| CI workflow | Not yet present |
| Designed store icons | Phase 0 placeholder icons only |
| Phase 1+ plan generation UI | Phase 3 deferred (post-v1 optional) |

### Inherited technical state

| Area | State after phase 4 |
|---|---|
| CI | None |
| JSON bundle | Not implemented |
| OAuth | Not implemented (DOM-first only) |
| Privacy policy | Not written |
| Store listing copy | Not written |
| E2E integration test | Unit tests only |
| Root package version | `0.0.1` (manifest `0.4.0`) |
| `final_implementation_checklist.md` | Not created |

## 4. Scope

### In scope

1. **Session JSON bundle** — Export/import active session data (sessions, evidence, themes, profiles, blueprint, phase plans, post drafts) as versioned JSON; exclude API keys.
2. **Import validation** — Schema version check; merge or replace session on import; sanitize strings.
3. **Background handlers** — `EXPORT_SESSION_BUNDLE`, `IMPORT_SESSION_BUNDLE` (parse in worker; write via storage).
4. **Side panel UI** — Export bundle download, import file picker, confirmation before replace.
5. **CI workflow** — GitHub Actions: `npm ci`, `lint`, `typecheck`, `test`, `build` on push/PR.
6. **Integration tests** — Storage full-session round-trip; handler prerequisite chain tests with mocked LLM (discovery → planning → posts flow at storage/message level).
7. **OAuth optional path (stub)** — `shared/reddit/oauth-stub.ts` + ADR documenting future OAuth proxy pattern; env var names wired in checklist only.
8. **Release docs** — `docs/privacy-policy.md`, `docs/store-listing.md` (description, permissions justification, data handling).
9. **README hardening** — Full end-to-end user journey, troubleshooting, security summary, link to privacy policy and checklist.
10. **Version alignment** — Manifest `1.0.0`, root `package.json` version `1.0.0`.
11. **ADR 0006** — Release architecture, data portability, OAuth deferral, store readiness.
12. **`final_implementation_checklist.md`** — All remaining human actions consolidated per template.

### Out of scope (post-v1 / human-only)

- Chrome Web Store submission execution
- Reddit API app registration and approval
- Live OAuth implementation (requires backend + secrets)
- Firefox port
- Managed LLM proxy backend
- Phase 1+ automatic plan generation UI
- Opt-in telemetry
- Paid billing/subscriptions

## 5. Non-goals

- Do not embed Reddit API secrets in the extension.
- Do not export `settings.llmApiKey` in JSON bundles.
- Do not require OAuth for release validation.
- Do not auto-submit to Chrome Web Store.
- Do not add speculative features beyond hardening and release prep.
- Do not generate another phase plan after this one.

## 6. Current-state audit

| Area | State |
|---|---|
| Automated tests | 49 unit tests; no CI |
| Manual E2E | Deferred across phases 2–4 |
| Portability | Markdown export only |
| Privacy/compliance docs | None in `docs/` |
| OAuth | DOM capture only (ADR 0002) |
| Icons | Generated placeholders |
| Service worker error surfacing | Console only |
| Side panel onboarding | None |

**Gaps to close in phase 5:**

- Reproducible CI validation
- Session backup/restore for users
- Store submission document pack
- Single consolidated human-action checklist

## 7. Assumptions, constraints, risks, and decisions

### Assumptions

| ID | Assumption | Reversibility |
|---|---|---|
| A1 | Sideload + checklist is acceptable v1 release posture | High |
| A2 | JSON bundle v1 schema is sufficient without encryption | Medium |
| A3 | GitHub Actions is available for CI | High |
| A4 | OAuth remains documented stub until user provisions backend | High |
| A5 | Placeholder icons acceptable for sideload; store may need designed assets | High |

### Constraints

- MV3: no remote code; bundle import must validate schema strictly.
- API keys never in exports (grep + unit test).
- Import must not execute LLM calls or fetch URLs from bundle content.
- Privacy policy must accurately describe local-first + BYOK LLM behavior.

### Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Bundle import corrupts storage | High | Schema validation; backup prompt; atomic write |
| Store rejects permissions | Medium | Document justification in `store-listing.md`; minimal permissions audit |
| Manual E2E never run | Medium | Checklist + documented smoke test script |
| OAuth scope creep | Medium | Stub + ADR only; checklist defers live OAuth |

### Decisions (phase 5)

| ID | Decision | Rationale |
|---|---|---|
| D1 | JSON bundle excludes all settings secrets | Privacy promise |
| D2 | Bundle scoped to single session + related artifacts | Matches user mental model |
| D3 | Import replaces session by ID or creates new UUID | Avoid silent overwrite of wrong session |
| D4 | OAuth stub documents proxy pattern; no live OAuth in v1 | Reddit approval is human-blocked |
| D5 | CI runs on push to main and PRs | Standard release gate |
| D6 | `final_implementation_checklist.md` created at phase 5 close | PROJECT_PLANNING closure standard |
| D7 | Version 1.0.0 marks MVP feature-complete | Phases 0–4 delivered blueprint scope |
| D8 | Phase 1+ plan UI remains post-v1 | Lifecycle feature; not blocking release |

## 8. Dependencies

### External

- GitHub repo (for Actions) — assumed present
- User actions deferred to checklist (API key, store account, OAuth app)

### Internal

- Phases 0–4 complete (verified)

### Dependency graph

```text
phases_0-4 (complete)
    └── phase_5 (this plan)
            └── final_implementation_checklist.md (closure)
```

## 9. Architecture and affected systems

### JSON bundle schema (v1)

```typescript
interface SessionBundleV1 {
  bundleVersion: 1;
  exportedAt: string;
  session: ResearchSession;
  evidence: EvidenceItem[];
  painThemes: PainTheme[];
  communityProfiles: CommunityProfile[];
  blueprint: Blueprint | null;
  phasePlans: PhasePlan[];
  postDrafts: PostDraft[];
}
```

**Excluded:** `settings` (especially `llmApiKey`), unrelated sessions, unrelated global profiles.

### Target flow

```text
Side Panel                         Service Worker
──────────                         ──────────────
[Export session bundle] ─────────► gather session artifacts
                                   strip secrets
                                   ◄── JSON blob
                                   download via panel

[Import bundle file] ────────────► parse + validate bundleVersion
                                   sanitize strings
                                   upsert session + artifacts
                                   ◄── success / error

CI (GitHub Actions)                npm ci → lint → typecheck → test → build
```

### OAuth optional path (stub only)

```text
Future: Side Panel → OAuth start → Backend proxy (holds REDDIT_CLIENT_SECRET)
                 → Reddit token → enrichment handlers (search, monitors)
v1: Document in ADR 0006 + checklist; implement oauth-stub.ts with NotConfiguredError
```

### Message protocol additions

| Message | Direction | Purpose |
|---|---|---|
| `EXPORT_SESSION_BUNDLE` | panel → bg | Build bundle for sessionId |
| `IMPORT_SESSION_BUNDLE` | panel → bg | Validate and import bundle JSON |

## 10. Files and paths in scope

### Create

- `extension/src/shared/bundle/schema.ts`
- `extension/src/shared/bundle/export.ts`
- `extension/src/shared/bundle/import.ts`
- `extension/src/shared/bundle/bundle.test.ts`
- `extension/src/shared/reddit/oauth-stub.ts`
- `extension/src/background/handlers/bundle.ts`
- `extension/src/sidepanel/bundle-ui.ts`
- `.github/workflows/ci.yml`
- `docs/privacy-policy.md`
- `docs/store-listing.md`
- `docs/decisions/0006-release-architecture.md`
- `docs/plans/final_implementation_checklist.md` (on phase 5 completion)

### Update

- `extension/manifest.json` — version `1.0.0`
- `package.json` — version `1.0.0`
- `extension/src/shared/storage/storage-adapter.ts` — `importSessionBundle` helper if needed
- `extension/src/shared/messages/types.ts`
- `extension/src/background/handlers/messages.ts`
- `extension/src/sidepanel/index.html` — Data/portability section
- `extension/src/sidepanel/main.ts`
- `extension/src/sidepanel/styles.css`
- `README.md` — release section, troubleshooting, checklist link
- `docs/plans/phase_5_hardening-release_plan.md` — completion evidence
- `.cursor/STATE.md`
- `.cursor/memory/memories/2026-07-11-continuation.md`

## 11. Supporting documents to create or update

| Path | Purpose |
|---|---|
| `docs/privacy-policy.md` | Chrome Web Store required privacy disclosure |
| `docs/store-listing.md` | Title, description, permission justifications |
| `docs/decisions/0006-release-architecture.md` | Bundle format, OAuth deferral, release boundaries |
| `docs/plans/final_implementation_checklist.md` | Human-only remaining work |
| `.github/workflows/ci.yml` | Automated validation gate |

## 12. Ordered implementation tasks

### Task 5.1 — Session bundle schema, export, import

- **Objective:** Versioned JSON portability for one research session.
- **Dependencies:** None.
- **Files:** `shared/bundle/schema.ts`, `export.ts`, `import.ts`, `bundle.test.ts`.
- **Notes:** `exportSessionBundle(sessionId)` gathers related records. `importSessionBundle` validates `bundleVersion === 1`, sanitizes text fields, assigns new session ID on conflict option or merge by ID with user confirm flag.
- **Validation:** Round-trip test; exported JSON never contains `llmApiKey` or `apiKey`.
- **Status:** complete

### Task 5.2 — Bundle handlers and UI

- **Objective:** User can export/import session bundles from side panel.
- **Dependencies:** 5.1.
- **Files:** `handlers/bundle.ts`, `bundle-ui.ts`, `messages/types.ts`, `messages.ts`, `index.html`, `main.ts`.
- **Notes:** Export downloads `implemento-session_<slug>_<date>.json`. Import uses file input; confirm dialog before replace.
- **Validation:** Manual import/export round-trip preserves evidence count (automated storage test).
- **Status:** complete

### Task 5.3 — CI workflow

- **Objective:** Reproducible validation on every push/PR.
- **Dependencies:** None.
- **Files:** `.github/workflows/ci.yml`.
- **Notes:** Node 20, cache npm, run lint/typecheck/test/build.
- **Validation:** Workflow file valid; local commands pass.
- **Status:** complete

### Task 5.4 — Integration and pipeline tests

- **Objective:** Strengthen confidence in cross-module behavior.
- **Dependencies:** 5.1.
- **Files:** `bundle.test.ts`, optional `pipeline.integration.test.ts`.
- **Notes:** Test prerequisite errors: posts without blueprint, planning without themes. Test full storage session lifecycle: evidence → themes → blueprint → phase0 → drafts (direct storage, no live LLM).
- **Validation:** New tests pass; total count increases.
- **Status:** complete

### Task 5.5 — OAuth stub and ADR 0006

- **Objective:** Document optional OAuth upgrade without implementing live OAuth.
- **Dependencies:** None.
- **Files:** `shared/reddit/oauth-stub.ts`, `docs/decisions/0006-release-architecture.md`.
- **Notes:** `getOAuthStatus()` returns not configured; links to checklist for `REDDIT_CLIENT_ID`/`REDDIT_CLIENT_SECRET`.
- **Validation:** Typecheck passes; ADR recorded.
- **Status:** complete

### Task 5.6 — Privacy policy and store listing

- **Objective:** Chrome Web Store submission document pack.
- **Dependencies:** None.
- **Files:** `docs/privacy-policy.md`, `docs/store-listing.md`.
- **Notes:** Cover: local storage, BYOK LLM (data sent only on user action), Reddit DOM read-only, no telemetry in v1, permissions table matching manifest.
- **Validation:** Docs exist; permissions in listing match `manifest.json`.
- **Status:** complete

### Task 5.7 — README and version 1.0.0

- **Objective:** User-facing release documentation and version bump.
- **Dependencies:** 5.1–5.6.
- **Files:** `README.md`, `manifest.json`, `package.json`.
- **Notes:** Add "Full workflow" section, troubleshooting (LLM permission denied, DOM parse fail, ethics block), link to privacy policy and final checklist.
- **Validation:** Version 1.0.0 in manifest and package.json; build succeeds.
- **Status:** complete

### Task 5.8 — Final checklist and closure

- **Objective:** Consolidate all human-only remaining work.
- **Dependencies:** 5.1–5.7.
- **Files:** `docs/plans/final_implementation_checklist.md`.
- **Notes:** Populate from deferred queues across phases 0–5. Include manual E2E smoke test steps, env vars, store submission, OAuth app, designed icons optional.
- **Validation:** Checklist complete per template; no agent-executable work listed as human-only incorrectly.
- **Status:** complete

## 13. Sub-agent delegation map

| Slice | Delegable? | Owner | Boundaries |
|---|---|---|---|
| Bundle schema/export/import + tests | Yes | sub-agent | `shared/bundle/` |
| Bundle UI | Yes | sub-agent | `bundle-ui.ts` |
| CI workflow | Yes | sub-agent | `.github/workflows/` only |
| Privacy + store listing docs | Lead agent | lead | `docs/` |
| OAuth stub + ADR 0006 | Lead agent | lead | stub + decisions |
| Final checklist | Lead agent | lead | `docs/plans/final_implementation_checklist.md` |

## 14. Test and validation matrix

| Requirement | Validation method | Expected evidence | Status |
|---|---|---|---|
| Bundle export excludes API key | Unit test + grep | No key in JSON | complete |
| Bundle import round-trip | Unit test | Evidence/themes restored | complete |
| Invalid bundle rejected | Unit test | Schema error surfaced | complete |
| CI workflow | GitHub Actions or act | lint/test/build pass | complete |
| Pipeline prerequisite errors | Integration test | Correct error messages | complete |
| Privacy policy exists | File inspect | `docs/privacy-policy.md` | complete |
| Store listing matches manifest | Manual review | Permissions documented | complete |
| OAuth stub compiles | typecheck | No live network | complete |
| Version 1.0.0 | manifest + package.json | Both show 1.0.0 | complete |
| Full test suite | `npm run test` | Exit 0 | complete |
| Build | `npm run build` | dist/ v1.0.0 | complete |
| Final checklist | File inspect | All deferred human actions listed | complete |

## 15. Security, privacy, reliability, accessibility, and performance checks

- **Security:** Bundle import sanitizes all text; no eval; no key export; confirm before overwrite.
- **Privacy:** Privacy policy accurate; bundle excludes settings secrets.
- **Reliability:** Import atomic via storage adapter; CI catches regressions.
- **Accessibility:** Import/export buttons labeled; file input associated with label; `aria-live` for import result.
- **Performance:** Bundle size reasonable for typical session (<2MB); no blocking UI during export.

## 16. Environment-variable registry

Never include values.

| Variable name | Purpose | Scope/environment | Required by phase | Source/provider | Status |
|---|---|---|---|---|---|
| `IMPLEMENTO_LLM_API_URL` | OpenAI-compatible base URL | `chrome.storage.local` | runtime (phases 2–4) | User/provider dashboard | required_at_runtime |
| `IMPLEMENTO_LLM_API_KEY` | LLM authentication | `chrome.storage.local` only | runtime | User/provider dashboard | required_at_runtime |
| `IMPLEMENTO_LLM_MODEL` | Model selection | `chrome.storage.local` | runtime | User preference | required_at_runtime |
| `IMPLEMENTO_LLM_TEMPERATURE` | Sampling temperature | `chrome.storage.local` | runtime | User preference | optional |
| `REDDIT_CLIENT_ID` | OAuth client ID | Backend/extension OAuth | post-v1 OAuth | Reddit developer portal | deferred_to_checklist |
| `REDDIT_CLIENT_SECRET` | OAuth secret | Backend only | post-v1 OAuth | Reddit developer portal | deferred_to_checklist |

All runtime LLM variables are user-supplied via settings UI, not repository env files.

## 17. Deferred human-action queue

These actions are **not blocking phase 5 implementation** and must appear in `final_implementation_checklist.md`:

| Action | Why agent cannot perform | Blocking release? | Checklist section |
|---|---|---|---|
| Supply LLM API key | User's provider account | No (sideload works) | Env vars |
| Grant LLM host permission | Chrome permission dialog | No | Env vars |
| Manual full-pipeline E2E test | Requires API key + Reddit browsing | No | Smoke tests |
| Create Reddit API application | User account + approval wait | No | OAuth |
| Deploy OAuth backend proxy | Infrastructure + secrets | No | OAuth |
| Chrome Web Store developer account ($5) | Payment + Google account | Yes for store publish | Deployment |
| Chrome Web Store submission | Human review process | Yes for store publish | Deployment |
| Host privacy policy URL | Domain/account choice | Yes for store publish | Deployment |
| Designed marketing icons | Design asset choice | No for sideload | Deployment |
| Beta user recruitment | Human outreach | No | Smoke tests |

## 18. Rollback and recovery

- Bundle import: keep export-before-import UX; user can re-import prior bundle.
- CI failure blocks merge but not local sideload.
- Version bump is reversible via git.
- OAuth stub removal does not affect DOM capture path.

## 19. Acceptance criteria

Phase 5 is complete when ALL are true:

1. User can **export** a session JSON bundle and **import** it in a fresh profile with data restored (excluding API key).
2. Exported bundles never contain `llmApiKey` or similar secrets.
3. GitHub Actions CI runs lint, typecheck, test, and build successfully.
4. `docs/privacy-policy.md` and `docs/store-listing.md` exist and match manifest permissions.
5. `docs/decisions/0006-release-architecture.md` recorded.
6. OAuth optional path documented; stub compiles without live credentials.
7. README documents full workflow, troubleshooting, and links to checklist + privacy policy.
8. Manifest and package.json version **1.0.0**; build produces `dist/` v1.0.0.
9. All unit/integration tests pass; lint and typecheck pass.
10. `docs/plans/final_implementation_checklist.md` created with all human-only actions consolidated.
11. This plan updated with completion evidence and status `complete`.
12. `STATE.md` reflects **project MVP complete**; no further phase plans.

## 20. Completion evidence

| Check | Evidence |
|---|---|
| Build | `npm run build` → `dist/manifest.json` version `1.0.0` |
| Tests | 55/55 passing (`npm run test`) |
| CI | `.github/workflows/ci.yml` — lint, typecheck, test, build |
| Bundle round-trip | `extension/src/shared/bundle/bundle.test.ts` |
| Final checklist | `docs/plans/final_implementation_checklist.md` |

## 21. Deviations and follow-ups

- Prerequisite handler tests use global `vitest.setup.ts` chrome mock (handlers import `browser-storage` at module load).
- Pipeline integration test covers storage lifecycle only; prerequisite errors tested via `prerequisites.integration.test.ts`.
- No phase 6 plan — post-v1 work in final checklist only.

## 22. Final closure instruction

When phase 5 is verified complete:

1. Ensure `docs/plans/final_implementation_checklist.md` is the single source for remaining human-only work.
2. Update `STATE.md` to **Project MVP complete — checklist remains**.
3. Update `README.md` status to v1.0.0 release-ready (sideload + checklist).
4. Do **not** generate another phase plan. Future work (OAuth live, phase 1+ UI, Firefox, telemetry) is tracked only in the final checklist or new blueprint/out-of-band plans.

**Manual smoke test script (for checklist):**

1. Load unpacked `dist/` v1.0.0
2. Configure LLM → grant host permission → test connection
3. Create session → pin evidence on Reddit
4. Run discovery → generate blueprint → generate phase 0 → generate post drafts
5. Export markdown artifacts and JSON session bundle
6. Import bundle in clean storage state → verify session restored
