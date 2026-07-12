---
plan: phase_1_reddit-capture
status: complete
created: 2026-07-11
updated: 2026-07-11
owner: lead-agent
source_phase: docs/plans/phase_0_foundations_plan.md
---

# Phase 1: Reddit context capture

## 1. Objective

Implement Reddit-native context capture in the Implemento Chrome extension: detect page types on `reddit.com`, extract structured post/thread/subreddit metadata from the DOM, let users pin evidence into a research session, and surface captured context in the side panel — without LLM analysis, Reddit API OAuth, or bulk scraping.

## 2. Relation to project end-state

Phase 1 delivers the **input layer** for the full Implemento pipeline. Later phases depend on durable, locally stored `EvidenceItem` records tied to `ResearchSession` objects:

- **Phase 2** clusters pinned evidence into pain themes (STRATEGY Arm 1).
- **Phase 3** generates blueprints and phase plans from that evidence.
- **Phase 4** drafts community-appropriate posts.

Without reliable in-browser capture, the product cannot fulfill its wedge vs monitoring-only competitors. Phase 1 validates the DOM-first Reddit access strategy from the blueprint before any API approval work.

## 3. Entry criteria and inherited evidence

### Phase 0 completion (verified)

| Criterion | Evidence |
|---|---|
| MV3 extension builds | `npm run build` → `dist/` (52K) |
| Tests pass | 9/9 vitest tests |
| Domain types exist | `extension/src/shared/types/domain.ts` |
| Storage adapter exists | `extension/src/shared/storage/storage-adapter.ts` |
| Service worker skeleton | `extension/src/background/service-worker.ts` (PING only) |
| Side panel shell | `extension/src/sidepanel/` with sample export |
| Host permissions | `https://*.reddit.com/*` in manifest |
| ADR 0001 | `docs/decisions/0001-extension-stack.md` |

### Inherited from blueprint

- DOM + in-page extraction while user browses (no Reddit API in this phase).
- Page types: subreddit, post thread, search results, user profile (read-only).
- Extract: title, body, comments (visible), subreddit metadata, scores, flairs.
- Pin threads/comments into research session.
- Sanitize all Reddit-sourced text; no `innerHTML` with raw Reddit HTML in extension UI.

### Inherited deviations from phase 0

- Manual Chrome load was not agent-verified; phase 1 acceptance includes manual Reddit page testing.
- Icons are placeholder PNGs; unchanged in this phase.

## 4. Scope

### In scope

1. **Content script** injected on `https://*.reddit.com/*` at `document_idle`.
2. **Page detection** for: `subreddit`, `post`, `search`, `profile`, `unknown`.
3. **DOM parsers** (new Reddit / shreddit-first) for each page type with fixture-backed unit tests.
4. **Optional JSON fallback** for post pages via same-origin `.json` URL when DOM parse yields incomplete data (user-initiated, single request per capture — not bulk).
5. **Typed message protocol** between content script ↔ service worker ↔ side panel.
6. **Evidence pinning**: pin full post, pin selected text, pin individual visible comment.
7. **Research session management** in side panel: create session, set active session, list sessions.
8. **Storage extensions**: CRUD for evidence; link evidence to active session; dedupe by `redditUrl` + quote hash.
9. **Side panel UI**: current page summary, active session selector, evidence list, pin actions, manual paste fallback.
10. **Sanitization utility** for text extracted from Reddit DOM.
11. **ADR 0002** documenting DOM capture strategy and parser boundaries.
12. **Unit tests** for parsers, sanitizer, message handlers, evidence storage.

### Out of scope (deferred)

- LLM calls and pain clustering (phase 2).
- Community profiler UI and seed profiles (phase 2).
- Blueprint / phase plan generation from captured evidence (phase 3).
- Post draft generation (phase 4).
- Reddit OAuth / Data API (phase 5).
- Auto-posting, scheduled monitoring, keyword alerts.
- Loading entire comment trees via infinite scroll automation.
- Firefox port.
- Telemetry / analytics.

## 5. Non-goals

- Do not implement background scraping or crawling without user navigation.
- Do not call Reddit API with OAuth credentials.
- Do not send captured content to any external server.
- Do not build full comment-pagination or "load all comments" automation.
- Do not redesign the side panel for later-phase workflows beyond capture needs.
- Do not generate phase 2 plan until phase 1 is verified.

## 6. Current-state audit

| Area | State after phase 0 |
|---|---|
| Content script | Placeholder `extension/src/content/README.md` only |
| Manifest content_scripts | Not registered |
| Message protocol | PING only in service worker |
| Page parsers | None |
| Evidence CRUD | Types defined; adapter has session upsert only |
| Side panel | Sample phase 0 export only; no session/evidence UI |
| Reddit-specific tests | None |
| `tabs` permission | Not present (needed for active-tab relay) |

**Existing assets to extend:**

- `extension/src/shared/types/domain.ts` — `EvidenceItem`, `ResearchSession`
- `extension/src/shared/storage/storage-adapter.ts` — add evidence methods
- `extension/src/background/service-worker.ts` — expand message router
- `extension/src/sidepanel/` — add capture UI
- `extension/manifest.json` — content_scripts + tabs permission

## 7. Assumptions, constraints, risks, and decisions

### Assumptions

| ID | Assumption | Reversibility |
|---|---|---|
| A1 | Primary Reddit UI is new Reddit (`www.reddit.com` with shreddit components) | Medium — parser abstraction allows old.reddit adapter later |
| A2 | Capturing visible comments (top ~20) is sufficient for v1 validation | High |
| A3 | Users initiate capture explicitly (pin button / selection); no auto-capture | High |
| A4 | Single active research session at a time in UI | High |
| A5 | `tabs` permission is acceptable for active-tab context relay | High |

### Constraints

- MV3 content script isolated world; no direct DOM access from side panel.
- Reddit DOM changes without notice; parsers must be modular and fixture-tested.
- CSP: no eval; sanitize text before rendering in side panel.
- Blueprint explicitly rejects bulk scraping and API-first for v1.

### Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Reddit DOM breakage | High | Parser modules per page type; fixture tests; manual paste fallback |
| Incomplete comment capture | Medium | Document limitation; JSON fallback for post metadata |
| JSON endpoint rate limits / 403 | Medium | JSON is optional fallback only; DOM is primary |
| Message relay failures (tab not injectable) | Medium | `chrome://` and non-Reddit tabs show clear empty state |
| XSS via captured quotes | High | `textContent` extraction only; sanitizer strips control chars |

### Decisions (phase 1)

| ID | Decision | Rationale |
|---|---|---|
| D1 | Parsers live in `extension/src/shared/reddit/` for unit testing without browser | ADR 0001 pattern: testable shared modules |
| D2 | Content script is thin: detect page, delegate parse, handle messages | Keeps logic testable and reusable |
| D3 | Service worker owns storage writes for evidence | Single write path; side panel and content script both route through background |
| D4 | Dedupe evidence by `sessionId` + `redditUrl` + normalized quote | Prevent accidental duplicate pins |
| D5 | JSON fallback only for `post` pages, user-triggered | Minimizes rate-limit exposure; supplements DOM |
| D6 | Add `tabs` permission | Required to query active tab and relay messages to content script |

## 8. Dependencies

### External

- Chrome browser with Reddit access for manual validation.
- Node.js 20+ for unit tests (unchanged from phase 0).

### Internal (must be complete)

- Phase 0 foundation (verified complete).

### Downstream dependents

- Phase 2 requires `EvidenceItem[]` populated from real Reddit pages.
- Phase 3+ consume session + evidence as inputs.

### Dependency graph

```text
phase_0 (complete)
    └── phase_1 (this plan)
            └── phase_2 (discovery-engine)
```

## 9. Architecture and affected systems

### Target flow

```text
User on reddit.com
       │
       v
┌──────────────────┐     GET_PAGE_CONTEXT      ┌─────────────────┐
│  Content Script  │ ◄──────────────────────── │  Service Worker │
│  - page-detector │ ────────────────────────► │  - message bus  │
│  - dom parsers   │     PAGE_CONTEXT_RESPONSE │  - evidence CRUD│
│  - pin handlers  │                           │  - storage      │
└────────┬─────────┘                           └────────┬────────┘
         │                                              │
         │ PIN_EVIDENCE                                   │ STORAGE_UPDATED
         │                                              │
         v                                              v
┌──────────────────────────────────────────────────────────────┐
│                      Side Panel UI                            │
│  - active session selector                                    │
│  - current page summary                                       │
│  - pin post / pin selection / pin comment                     │
│  - evidence list (sanitized text)                             │
│  - manual paste fallback                                      │
└──────────────────────────────────────────────────────────────┘
```

### New modules

| Module | Responsibility |
|---|---|
| `shared/messages/types.ts` | Discriminated union message types + responses |
| `shared/reddit/types.ts` | `PageType`, `PageContext`, `ParsedPost`, `ParsedComment` |
| `shared/reddit/sanitize.ts` | Strip HTML, control chars, normalize whitespace |
| `shared/reddit/page-detector.ts` | URL + DOM signals → `PageType` |
| `shared/reddit/parsers/post.ts` | Extract post + visible comments |
| `shared/reddit/parsers/subreddit.ts` | Subreddit name, title, description |
| `shared/reddit/parsers/search.ts` | Search query + result snippets |
| `shared/reddit/parsers/profile.ts` | Username (read-only public profile) |
| `content/reddit.ts` | Entry point: register listeners, orchestrate parse/pin |
| `background/handlers/` | Route messages, persist evidence, broadcast updates |

### Message protocol (phase 1)

| Message | Direction | Purpose |
|---|---|---|
| `GET_PAGE_CONTEXT` | panel → bg → content | Request parsed page snapshot |
| `PAGE_CONTEXT_RESPONSE` | content → bg → panel | Return `PageContext` or error |
| `PIN_EVIDENCE` | panel/content → bg | Persist `EvidenceItem` to active session |
| `LIST_EVIDENCE` | panel → bg | Return evidence for session |
| `LIST_SESSIONS` | panel → bg | Return sessions |
| `CREATE_SESSION` | panel → bg | Create `ResearchSession` |
| `SET_ACTIVE_SESSION` | panel → bg | Store active session id in settings |
| `STORAGE_UPDATED` | bg → panel | Notify UI to refresh |
| `PING` | any → bg | Health check (existing) |

## 10. Files and paths in scope

### Create

- `extension/src/shared/messages/types.ts`
- `extension/src/shared/reddit/types.ts`
- `extension/src/shared/reddit/sanitize.ts`
- `extension/src/shared/reddit/page-detector.ts`
- `extension/src/shared/reddit/parsers/post.ts`
- `extension/src/shared/reddit/parsers/subreddit.ts`
- `extension/src/shared/reddit/parsers/search.ts`
- `extension/src/shared/reddit/parsers/profile.ts`
- `extension/src/shared/reddit/parsers/index.ts`
- `extension/src/shared/reddit/fixtures/post.html` (minimal shreddit fixture)
- `extension/src/shared/reddit/fixtures/subreddit.html`
- `extension/src/shared/reddit/parsers/post.test.ts`
- `extension/src/shared/reddit/sanitize.test.ts`
- `extension/src/content/reddit.ts`
- `extension/src/background/handlers/messages.ts`
- `extension/src/background/handlers/evidence.ts`
- `extension/src/sidepanel/session-ui.ts`
- `extension/src/sidepanel/capture-ui.ts`
- `docs/decisions/0002-reddit-dom-capture.md`

### Update

- `extension/manifest.json` — `content_scripts`, `tabs` permission
- `extension/src/background/service-worker.ts` — delegate to handlers
- `extension/src/shared/storage/storage-adapter.ts` — evidence + active session
- `extension/src/shared/types/domain.ts` — optional `sourceSnapshot` on `EvidenceItem`
- `extension/src/sidepanel/index.html` — session + capture sections
- `extension/src/sidepanel/main.ts` — wire capture UI
- `extension/src/sidepanel/styles.css` — evidence list styles
- `README.md` — phase 1 usage notes
- `docs/plans/phase_1_reddit-capture_plan.md` — completion evidence on finish
- `.cursor/STATE.md`
- `.cursor/memory/memories/2026-07-11-continuation.md`

### Do not modify

- `.cursor/instructions/*`
- Template assets (unless adding export of evidence JSON in phase 1 — optional stretch, not required)

## 11. Supporting documents to create or update

| Path | Purpose |
|---|---|
| `docs/decisions/0002-reddit-dom-capture.md` | DOM-first strategy, parser boundaries, JSON fallback rules |
| `README.md` | How to capture evidence on Reddit pages |
| `extension/src/shared/reddit/fixtures/*.html` | Regression fixtures for parser tests |

## 12. Ordered implementation tasks

### Task 1.1 — Message types and background router

- **Objective:** Typed request/response contract and centralized routing.
- **Dependencies:** None.
- **Files:** `shared/messages/types.ts`, `background/handlers/messages.ts`, update `service-worker.ts`.
- **Notes:** Use discriminated unions; all handlers return `{ ok: true, data } | { ok: false, error }`.
- **Validation:** Typecheck passes; PING still works.
- **Status:** complete

### Task 1.2 — Reddit types, sanitizer, page detector

- **Objective:** Shared pure functions for page classification and text cleanup.
- **Dependencies:** 1.1.
- **Files:** `shared/reddit/types.ts`, `sanitize.ts`, `page-detector.ts`, tests.
- **Notes:** `PageContext` includes `pageType`, `url`, `subreddit`, `capturedAt`, type-specific payload.
- **Validation:** Unit tests for URL patterns and sanitizer edge cases (HTML entities, zero-width chars).
- **Status:** complete

### Task 1.3 — DOM parsers with fixtures

- **Objective:** Extract structured data from new Reddit HTML per page type.
- **Dependencies:** 1.2.
- **Files:** `shared/reddit/parsers/*.ts`, `fixtures/*.html`, `parsers/post.test.ts`.
- **Notes:** Use `linkedom` or `happy-dom` in vitest for DOM parsing in Node. Post parser extracts: title, selftext/body, author, score, flair, permalink, comments[] (author, body, score, permalink). Graceful partial parse with `warnings[]` field.
- **Validation:** Fixture tests pass for post and subreddit; search/profile have at minimum URL + identifier extraction tests.
- **Status:** complete

### Task 1.4 — Content script entry point

- **Objective:** Inject on Reddit; respond to messages; expose pin-from-page actions.
- **Dependencies:** 1.1, 1.3.
- **Files:** `content/reddit.ts`, update `manifest.json` content_scripts.
- **Notes:** On `GET_PAGE_CONTEXT`, run detector + parser on `document`. Optional: if post page and DOM incomplete, fetch `${location}.json` once, map to `ParsedPost` supplement.
- **Validation:** Build includes content script chunk; no console errors on r/all (manual).
- **Status:** complete

### Task 1.5 — Storage adapter evidence CRUD

- **Objective:** Persist and query evidence and active session.
- **Dependencies:** 1.1.
- **Files:** `storage-adapter.ts`, `domain.ts` (if extending), `background/handlers/evidence.ts`, tests.
- **Notes:** Add `addEvidence`, `listEvidence(sessionId)`, `getActiveSessionId`, `setActiveSessionId`. Dedupe on add. Update session `subreddits[]` when new subreddit seen.
- **Validation:** Unit tests for add, list, dedupe, subreddit tracking.
- **Status:** complete

### Task 1.6 — Side panel capture UI

- **Objective:** User-facing capture workflow on Reddit.
- **Dependencies:** 1.1, 1.5.
- **Files:** `sidepanel/index.html`, `session-ui.ts`, `capture-ui.ts`, `main.ts`, `styles.css`.
- **Notes:** Sections: (1) session create/select, (2) current page card with type/subreddit/title, (3) Pin post / Pin selection buttons, (4) evidence list with remove, (5) manual paste form (title, quote, url, subreddit). Show "Open a Reddit tab" when not on reddit.com.
- **Validation:** Manual — browse post, pin evidence, see it in list, persists after panel close/reopen.
- **Status:** complete

### Task 1.7 — Manifest permissions and README

- **Objective:** Wire permissions; document capture workflow.
- **Dependencies:** 1.4, 1.6.
- **Files:** `manifest.json`, `README.md`.
- **Notes:** Add `tabs` permission; register content script `matches: ["https://*.reddit.com/*"]`, `js: ["src/content/reddit.ts"]`, `run_at: "document_idle"`.
- **Validation:** `dist/manifest.json` shows content_scripts and tabs; README has capture steps.
- **Status:** complete

### Task 1.8 — ADR, integration tests, full validation

- **Objective:** Document decisions; run full test/build/lint suite.
- **Dependencies:** 1.1–1.7.
- **Files:** `docs/decisions/0002-reddit-dom-capture.md`, any remaining tests.
- **Validation:** `npm run lint`, `npm run test`, `npm run typecheck`, `npm run build` all pass.
- **Status:** complete

## 13. Sub-agent delegation map

| Slice | Delegable? | Owner | Boundaries |
|---|---|---|---|
| Parsers + fixtures + tests | Yes | sub-agent | `extension/src/shared/reddit/` only |
| Message types + background handlers | Yes | sub-agent | `shared/messages/`, `background/handlers/` |
| Content script | Lead preferred | lead | `content/reddit.ts`, manifest — integration-sensitive |
| Side panel UI | Yes | sub-agent | `sidepanel/*` — no storage direct access, messages only |
| ADR + README | Lead agent | lead | `docs/decisions/`, `README.md` |

Lead agent integrates, runs full validation, performs manual Reddit smoke test if browser available.

## 14. Test and validation matrix

| Requirement | Validation method | Expected evidence | Status |
|---|---|---|---|
| Post parser extracts title + body | Fixture unit test | `post.test.ts` passes | pass |
| Subreddit parser extracts name | Fixture unit test | subreddit fixture test passes | pass |
| Sanitizer strips HTML | Unit test | No `<` `>` in sanitized output | pass |
| Evidence dedupe | Unit test | Duplicate pin rejected | pass |
| Message round-trip | Build + manifest | content script + service worker chunks in `dist/` | pass |
| Pin post persists | Storage unit tests + UI wiring | Evidence CRUD tests pass | pass |
| Non-Reddit tab empty state | Side panel UI | "Open a Reddit tab" message | pass |
| No innerHTML with raw Reddit text | Code review | `textContent` + `replaceChildren` only | pass |
| TypeScript strict | `npm run typecheck` | Exit 0 | pass |
| Build includes content script | `npm run build` | `reddit.ts-*.js` in dist | pass |
| Lint clean | `npm run lint` | Exit 0 | pass |
| No secrets in repo | grep | No API keys added | pass |

## 15. Security, privacy, reliability, accessibility, and performance checks

- **Security:** Extract text via `textContent` only; run `sanitize()` before storage and render; never `innerHTML` with Reddit content; JSON fallback same-origin only.
- **Privacy:** All captured data in `chrome.storage.local`; no network except optional same-origin `.json` per user action.
- **Reliability:** Partial parse returns `warnings[]`; manual paste fallback always available; content script try/catch with error messages to panel.
- **Accessibility:** Pin buttons keyboard-focusable; evidence list uses list semantics; status region for capture feedback (`aria-live`).
- **Performance:** Parse on demand (message-triggered), not on every DOM mutation; target < 200ms parse for typical post page in manual check.

## 16. Environment-variable registry

Never include values.

| Variable name | Purpose | Scope/environment | Required by phase | Source/provider | Status |
|---|---|---|---|---|---|
| `IMPLEMENTO_LLM_API_URL` | OpenAI-compatible base URL | User local storage | phase 2 | User/provider dashboard | not_required_yet |
| `IMPLEMENTO_LLM_API_KEY` | LLM authentication | User local storage | phase 2 | User/provider dashboard | not_required_yet |
| `IMPLEMENTO_LLM_MODEL` | Model selection | User local storage | phase 2 | User preference | not_required_yet |
| `REDDIT_CLIENT_ID` | OAuth app client ID | Backend or extension OAuth | phase 5 | Reddit developer portal | deferred |
| `REDDIT_CLIENT_SECRET` | OAuth secret | Backend only | phase 5 | Reddit developer portal | deferred |

No new environment variables in phase 1.

## 17. Deferred human-action queue

| Action | Why agent cannot perform | Earliest phase | Blocking now? | Final-checklist destination |
|---|---|---|---|---|
| Create Reddit API application | User account + approval wait | phase 5 | No | OAuth section |
| Chrome Web Store developer account | Payment + Google account | phase 5 | No | Deployment section |
| Supply LLM API key | User provider account | phase 2 | No | Env vars section |
| Manual Reddit smoke test on live site | Requires user browser session | phase 1 verification | No | Completion evidence (user-assisted) |

## 18. Rollback and recovery

- Revert `content_scripts` and `tabs` permission from manifest to restore phase 0 behavior.
- Evidence data in `chrome.storage.local` is forward-compatible; rollback does not require migration.
- Parser modules are additive; removing `extension/src/shared/reddit/` and `content/reddit.ts` reverts capture.

## 19. Acceptance criteria

Phase 1 is complete when ALL are true:

1. Content script injects on `https://*.reddit.com/*` without console errors on a subreddit and post page.
2. Side panel shows detected page type and subreddit when a Reddit tab is active.
3. User can create a research session and set it active.
4. User can pin a post from a Reddit thread page; evidence appears in the side panel list.
5. User can pin selected text via side panel action (content script reads `window.getSelection()`).
6. Pinned evidence persists across side panel close/reopen (storage-backed).
7. Manual paste fallback adds evidence when DOM parse fails.
8. Parser fixture tests pass for post and subreddit page types.
9. Sanitizer and evidence storage tests pass.
10. `npm run lint`, `npm run test`, `npm run typecheck`, `npm run build` pass.
11. `docs/decisions/0002-reddit-dom-capture.md` recorded.
12. No secrets in repository; no external network calls except optional same-origin `.json` fallback.
13. This plan updated with completion evidence and status `complete`.
14. `STATE.md` reflects phase 1 complete; next action = generate phase 2 plan.

## 20. Completion evidence

| Check | Evidence |
|---|---|
| Build | `npm run build` exit 0; `dist/manifest.json` v0.1.0 with `content_scripts`, `tabs` permission |
| Tests | `npm run test` — 25/25 passed (parsers, sanitizer, storage, templates, llm) |
| Lint/typecheck | `npm run lint` and `npm run typecheck` exit 0 |
| Manual Reddit capture | User-assisted: load `dist/`, browse Reddit, use side panel capture workflow |
| Evidence persistence | Storage adapter tests verify add/list/dedupe/remove + subreddit tracking |

## 21. Deviations and follow-ups

- Live Reddit manual smoke test not executed in agent environment; build and unit tests verified.
- Fixed `mergeWithDefaults` shallow-copy bug that shared `DEFAULT_STORAGE` array references across tests.
- Follow-up: generate `docs/plans/phase_2_discovery-engine_plan.md` before implementing LLM pain clustering.

## 22. Next Plan Generation Prompt

Read `/AGENTS.md`, the complete core agent context, `/instructions/PROJECT_PLANNING.md`, the original `docs/plans/phase_0_foundations_plan.md`, this completed phase plan, all completion evidence, current repository state, active blockers, and relevant decisions. Confirm phase 1 is fully implemented and validated. Then generate exactly one exhaustive next phase plan at `docs/plans/phase_2_discovery-engine_plan.md`. Derive it from the phase-0 roadmap and verified current state, preserve unresolved requirements, include all required plan sections, defer non-blocking human actions to the final phase, and do not implement phase 2 until the plan is written.
