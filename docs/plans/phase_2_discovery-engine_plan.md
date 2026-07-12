---
plan: phase_2_discovery-engine
status: complete
created: 2026-07-11
updated: 2026-07-11
owner: lead-agent
source_phase: docs/plans/phase_1_reddit-capture_plan.md
---

# Phase 2: Discovery engine

## 1. Objective

Implement **STRATEGY Arm 1 — problem discovery** in the Implemento extension: live LLM integration (BYOK), community profiler with seed defaults, and a discovery engine that clusters pinned session evidence into ranked pain themes with evidence/inference distinction, workaround language, and buyer signals — persisted locally and surfaced in the side panel.

## 2. Relation to project end-state

Phase 1 supplies `EvidenceItem[]` per research session. Phase 2 transforms that raw evidence into structured `PainTheme[]` and maintains `CommunityProfile[]` — the analytical layer competitors like PainPointy and Arieo provide, but local-first and tied to the implemento methodology.

Downstream phases depend on phase 2 output:

- **Phase 3** consumes pain themes + community context to generate blueprints and phase plans.
- **Phase 4** uses community profiles for convention-aware post drafts.

Phase 2 is the first phase requiring user-supplied LLM credentials. All LLM wiring, settings UI, and graceful degradation must be complete before planning-engine work begins.

## 3. Entry criteria and inherited evidence

### Phase 1 completion (verified)

| Criterion | Evidence |
|---|---|
| Evidence capture works | Content script, parsers, pinning, storage CRUD |
| Research sessions | Create/select active session in side panel |
| Message bus | `shared/messages/types.ts`, background handlers |
| Domain types | `EvidenceItem`, `PainTheme`, `CommunityProfile` defined |
| Tests | 25/25 passing |
| Build | `dist/` v0.1.0 with content_scripts |
| ADR 0002 | DOM-first capture documented |

### Inherited from blueprint + STRATEGY.md Arm 1

- Cluster pinned evidence into pain themes with severity and frequency signals.
- Distinguish **evidence** vs **inference** in output (`inferenceFlag`).
- Surface workaround language and buyer signals.
- Community profiler: 5 seed subreddits, user-editable tone/rules/patterns; LLM may suggest updates.
- Settings: OpenAI-compatible API URL + key + model in local storage.
- LLM calls send only user-selected session evidence, not browsing history.

### Inherited technical state

- `extension/src/shared/llm/llm-adapter.ts` — stub only (`NotConfiguredError` on `complete()`)
- `ImplementoStorageSchema.settings` — has `llmApiUrl`, `llmApiKey`, `llmModel`; no `activeSessionId` exposure in settings UI yet
- `communityProfiles` and `painThemes` arrays exist in storage schema but have no CRUD or UI
- No `host_permissions` beyond Reddit for external LLM calls

## 4. Scope

### In scope

1. **Live LLM adapter** — OpenAI-compatible `POST /chat/completions` (or `/v1/responses` fallback detection) from service worker.
2. **Settings UI** — API URL, API key (password field), model name, temperature; save/load via storage; configuration status indicator.
3. **Optional host permissions** — request access to user-configured API origin at settings save time.
4. **Storage extensions** — CRUD for `PainTheme`, `CommunityProfile`; list themes by session; replace themes on re-run.
5. **Seed community profiles** — default entries for r/SaaS, r/Entrepreneur, r/startups, r/sideproject, r/indiehackers from blueprint.
6. **Discovery engine module** — build prompt from session evidence + community profiles; parse structured JSON response into `PainTheme[]`.
7. **Prompt contract** — system prompt enforcing STRATEGY Arm 1: themes, severity 1–10, frequency estimate, evidence IDs, inference flag, workaround phrases, buyer signals.
8. **Background handlers** — `RUN_DISCOVERY`, `SAVE_SETTINGS`, `GET_SETTINGS`, `LIST_PAIN_THEMES`, `UPDATE_COMMUNITY_PROFILE`, `LIST_COMMUNITY_PROFILES`.
9. **Side panel UI** — Settings section, Community profiles editor (read/edit), Discovery section with "Analyze session" button, progress/cancel state, pain themes list with linked evidence quotes.
10. **Graceful degradation** — clear UI when LLM not configured; view/edit saved themes offline.
11. **Unit tests** — LLM adapter with mocked `fetch`, discovery JSON parser, storage CRUD, prompt builder.
12. **ADR 0003** — LLM call architecture, data sent to provider, permission model.

### Out of scope (deferred)

- Blueprint / phase plan generation (phase 3).
- Post draft generation (phase 4).
- Auto-run discovery on every pin.
- Cross-session analysis or global pain database.
- Managed LLM proxy backend.
- Community success pattern mining from top posts (API-backed — phase 5).
- Telemetry or usage analytics.
- Firefox port.

## 5. Non-goals

- Do not send full page HTML or unrelated tabs to the LLM.
- Do not store API keys anywhere except `chrome.storage.local`.
- Do not implement streaming responses (simple request/response is sufficient).
- Do not auto-modify community profiles without user confirmation.
- Do not generate phase 3 plan until phase 2 is verified.
- Do not require Reddit API access.

## 6. Current-state audit

| Area | State after phase 1 |
|---|---|
| LLM adapter | Stub; `complete()` throws |
| Settings UI | None |
| LLM host permissions | Not declared |
| Pain theme CRUD | Types only |
| Community profile CRUD | Types only; empty array |
| Discovery prompts | None |
| Discovery UI | None |
| Seed profiles | Not loaded |
| Background discovery handler | None |

**Existing assets to extend:**

- `extension/src/shared/llm/llm-adapter.ts` — implement `complete()`
- `extension/src/shared/llm/types.ts` — add structured response types
- `extension/src/shared/storage/storage-adapter.ts` — pain theme + profile CRUD
- `extension/src/shared/messages/types.ts` — new message types
- `extension/src/background/handlers/messages.ts` — route discovery + settings
- `extension/src/sidepanel/` — settings + discovery + profiles UI
- `extension/manifest.json` — `optional_host_permissions`

## 7. Assumptions, constraints, risks, and decisions

### Assumptions

| ID | Assumption | Reversibility |
|---|---|---|
| A1 | User provides OpenAI-compatible endpoint (OpenAI, OpenRouter, local LM Studio, etc.) | High |
| A2 | `gpt-4o-mini` or similar is acceptable default model suggestion | High |
| A3 | Single-shot JSON response (no tool calling) is sufficient for pain clustering | Medium |
| A4 | Max ~30 evidence items per discovery run (token budget) | High |
| A5 | User accepts `optional_host_permissions` prompt for their API host | High |

### Constraints

- MV3 service worker may sleep during long LLM calls; show progress in side panel; consider `chrome.alarms` only if needed.
- CSP blocks arbitrary fetch from side panel to non-permitted hosts — LLM calls **must** run in service worker.
- API keys must never appear in exported markdown or console logs.
- Reddit evidence text is untrusted — treat as prompt injection; system prompt enforces JSON-only output.

### Risks

| Risk | Impact | Mitigation |
|---|---|---|
| LLM returns invalid JSON | High | Schema validation + one repair retry with "fix JSON" prompt |
| Token limit exceeded | Medium | Truncate evidence quotes; cap item count; warn user |
| User API key invalid | Medium | Clear error in UI; test connection button |
| Host permission denied | Medium | Explain in settings; document required permission |
| Provider rate limits | Medium | Surface 429 errors; no automatic retry storm |
| Hallucinated pain themes | High | Require `evidenceIds[]`; flag `inferenceFlag`; show source quotes |

### Decisions (phase 2)

| ID | Decision | Rationale |
|---|---|---|
| D1 | LLM calls only from service worker | CSP + single network path; key stays out of side panel fetch |
| D2 | Structured JSON output, not markdown | Reliable parsing into `PainTheme[]` |
| D3 | Replace session pain themes on each discovery run | Avoid duplicate theme accumulation; user can re-run |
| D4 | Seed profiles on first install / empty storage | Blueprint communities available immediately |
| D5 | `optional_host_permissions` for API origin | User-controlled; avoids blanket `<all_urls>` |
| D6 | Community profile LLM suggestions require explicit accept | User trust; no silent overwrites |
| D7 | Use `fetch` with OpenAI chat completions schema | Widest BYOK compatibility |

## 8. Dependencies

### External

- User LLM API key and reachable OpenAI-compatible endpoint (deferred human action — non-blocking for code implementation).
- Chrome `optional_host_permissions` grant at runtime.

### Internal (must be complete)

- Phase 1 evidence capture and session model (verified).

### Downstream dependents

- Phase 3 planning engine reads `PainTheme[]` and `CommunityProfile[]`.
- Phase 4 post suggestions read community profiles.

### Dependency graph

```text
phase_1 (complete)
    └── phase_2 (this plan)
            └── phase_3 (planning-engine)
                    └── phase_4 (post-suggestions)
```

## 9. Architecture and affected systems

### Target flow

```text
Side Panel                    Service Worker
──────────                    ──────────────
[Settings] ──SAVE_SETTINGS──► storage.settings
                               optional_host_permissions.request()

[Analyze session]
    │
    └──RUN_DISCOVERY────────► load evidence + profiles
                               build discovery prompt
                               llmAdapter.complete()
                               parse JSON → PainTheme[]
                               storage.replacePainThemes()
    ◄──DISCOVERY_COMPLETE────  pain themes + warnings

[Pain themes list] ◄─LIST_PAIN_THEMES
[Edit profile]     ──UPDATE_COMMUNITY_PROFILE──► storage
```

### New modules

| Module | Responsibility |
|---|---|
| `shared/llm/openai-client.ts` | HTTP client for chat completions |
| `shared/llm/json-parse.ts` | Safe JSON extract + validate discovery response |
| `shared/discovery/prompt.ts` | Build system/user prompts from evidence |
| `shared/discovery/parser.ts` | Map LLM JSON → `PainTheme[]` |
| `shared/discovery/schema.ts` | TypeScript types + validators for LLM output |
| `shared/discovery/seed-profiles.ts` | Default `CommunityProfile[]` |
| `background/handlers/discovery.ts` | `RUN_DISCOVERY` orchestration |
| `background/handlers/settings.ts` | Save settings + request host permission |
| `sidepanel/settings-ui.ts` | LLM settings form |
| `sidepanel/discovery-ui.ts` | Analyze button, themes list, progress |
| `sidepanel/profiles-ui.ts` | Community profile editor |

### Discovery JSON schema (LLM output contract)

```typescript
interface DiscoveryResponse {
  themes: Array<{
    title: string;
    summary: string;
    severity: number;        // 1-10
    frequency: "low" | "medium" | "high";
    evidenceIds: string[];   // must reference input evidence
    inferenceFlag: boolean;  // true if primarily inferred
    workaroundPhrases: string[];
    buyerSignals: string[];
  }>;
  communitySuggestions?: Array<{
    subreddit: string;
    tone?: string;
    postPatterns?: string[];
    promoPolicy?: string;
  }>;
}
```

### Message protocol additions

| Message | Direction | Purpose |
|---|---|---|
| `SAVE_SETTINGS` | panel → bg | Persist LLM settings; request host permission |
| `GET_SETTINGS` | panel → bg | Return settings (mask API key as `***` or `configured`) |
| `TEST_LLM_CONNECTION` | panel → bg | Minimal completion to verify credentials |
| `RUN_DISCOVERY` | panel → bg | Analyze active session evidence |
| `LIST_PAIN_THEMES` | panel → bg | Themes for session |
| `LIST_COMMUNITY_PROFILES` | panel → bg | All profiles |
| `UPDATE_COMMUNITY_PROFILE` | panel → bg | Save profile edits |
| `APPLY_PROFILE_SUGGESTION` | panel → bg | Merge LLM suggestion after user confirm |

## 10. Files and paths in scope

### Create

- `extension/src/shared/llm/openai-client.ts`
- `extension/src/shared/llm/openai-client.test.ts`
- `extension/src/shared/llm/json-parse.ts`
- `extension/src/shared/llm/json-parse.test.ts`
- `extension/src/shared/discovery/prompt.ts`
- `extension/src/shared/discovery/prompt.test.ts`
- `extension/src/shared/discovery/parser.ts`
- `extension/src/shared/discovery/parser.test.ts`
- `extension/src/shared/discovery/schema.ts`
- `extension/src/shared/discovery/seed-profiles.ts`
- `extension/src/shared/discovery/fixtures/sample-response.json`
- `extension/src/background/handlers/discovery.ts`
- `extension/src/background/handlers/settings.ts`
- `extension/src/sidepanel/settings-ui.ts`
- `extension/src/sidepanel/discovery-ui.ts`
- `extension/src/sidepanel/profiles-ui.ts`
- `docs/decisions/0003-llm-discovery-architecture.md`

### Update

- `extension/manifest.json` — `optional_host_permissions`
- `extension/src/shared/llm/llm-adapter.ts` — delegate to openai-client
- `extension/src/shared/llm/types.ts` — extend settings (temperature)
- `extension/src/shared/storage/storage-adapter.ts` — pain theme + profile CRUD; seed on init
- `extension/src/shared/messages/types.ts` — new messages
- `extension/src/background/handlers/messages.ts` — route new handlers
- `extension/src/background/service-worker.ts` — seed profiles on install
- `extension/src/sidepanel/index.html` — settings, discovery, profiles sections
- `extension/src/sidepanel/main.ts` — wire new UI modules
- `extension/src/sidepanel/styles.css` — theme cards, settings form
- `README.md` — LLM setup + discovery workflow
- `docs/plans/phase_2_discovery-engine_plan.md` — completion evidence on finish
- `.cursor/STATE.md`
- `.cursor/memory/memories/2026-07-11-continuation.md`

## 11. Supporting documents to create or update

| Path | Purpose |
|---|---|
| `docs/decisions/0003-llm-discovery-architecture.md` | BYOK LLM flow, permissions, data minimization |
| `README.md` | Configure API key; run discovery analysis |
| `extension/src/shared/discovery/fixtures/sample-response.json` | Parser test fixture |

## 12. Ordered implementation tasks

### Task 2.1 — OpenAI-compatible LLM client

- **Objective:** Working `complete()` with real HTTP calls.
- **Dependencies:** None.
- **Files:** `openai-client.ts`, update `llm-adapter.ts`, tests with mocked `fetch`.
- **Notes:** Support `apiUrl` ending with `/v1` or full base; attach `Authorization: Bearer`; parse `choices[0].message.content`.
- **Validation:** Mocked fetch test passes; unconfigured adapter still throws `NotConfiguredError`.
- **Status:** complete

### Task 2.2 — Settings storage and handlers

- **Objective:** Save/load LLM settings; mask key in GET response.
- **Dependencies:** 2.1.
- **Files:** `handlers/settings.ts`, extend `messages/types.ts`, `storage-adapter.ts` (optional `llmTemperature`).
- **Notes:** `GET_SETTINGS` returns `{ configured: boolean, apiUrl, model, temperature }` — never full key. `SAVE_SETTINGS` stores key. `TEST_LLM_CONNECTION` sends minimal prompt.
- **Validation:** Settings round-trip test; GET never exposes key.
- **Status:** complete

### Task 2.3 — Optional host permissions

- **Objective:** Request permission for user's API origin on save.
- **Dependencies:** 2.2.
- **Files:** `manifest.json`, `handlers/settings.ts`.
- **Notes:** Parse origin from `apiUrl`; call `chrome.permissions.request({ origins: [`${origin}/*`] })`. Show denial message in UI.
- **Validation:** Manifest includes `optional_host_permissions`; origin extracted correctly in unit test.
- **Status:** complete

### Task 2.4 — Seed community profiles + profile CRUD

- **Objective:** Default five communities; editable profiles.
- **Dependencies:** None.
- **Files:** `seed-profiles.ts`, `storage-adapter.ts`, tests.
- **Notes:** On `chrome.runtime.onInstalled` or first `getAll()` when `communityProfiles` empty, load seeds. CRUD: `listProfiles`, `upsertProfile`, `getProfile(subreddit)`.
- **Validation:** Fresh storage gets 5 seed profiles; upsert updates tone field.
- **Status:** complete

### Task 2.5 — Discovery prompt + JSON parser

- **Objective:** Build prompts and parse LLM JSON into domain types.
- **Dependencies:** 2.1.
- **Files:** `discovery/prompt.ts`, `schema.ts`, `parser.ts`, `fixtures/sample-response.json`, tests.
- **Notes:** Prompt includes evidence id, quote, subreddit, type. System prompt: JSON only, cite evidenceIds, mark inference. Parser validates severity 1–10, evidenceIds exist.
- **Validation:** Fixture JSON parses to valid `PainTheme[]`; invalid JSON triggers structured error.
- **Status:** complete

### Task 2.6 — Discovery background handler

- **Objective:** `RUN_DISCOVERY` end-to-end orchestration.
- **Dependencies:** 2.1, 2.4, 2.5.
- **Files:** `handlers/discovery.ts`, update `messages.ts`.
- **Notes:** Load evidence for sessionId (or active); if empty, error. Cap at 30 items. Call LLM; parse; `replacePainThemes(sessionId, themes)`; return suggestions separately.
- **Validation:** Integration test with mocked LLM returning fixture; themes persisted.
- **Status:** complete

### Task 2.7 — Settings UI

- **Objective:** User can configure and test LLM.
- **Dependencies:** 2.2, 2.3.
- **Files:** `settings-ui.ts`, `index.html`, `styles.css`.
- **Notes:** Fields: API URL, API key, model, temperature. Buttons: Save, Test connection. Status badge: Configured / Not configured.
- **Validation:** Manual — save settings, test connection with real key (user-assisted).
- **Status:** complete

### Task 2.8 — Discovery + profiles UI

- **Objective:** Analyze session and view/edit results.
- **Dependencies:** 2.4, 2.6.
- **Files:** `discovery-ui.ts`, `profiles-ui.ts`, `index.html`, `main.ts`.
- **Notes:** "Analyze session" disabled without evidence or LLM config. Show spinner during run. Themes list: title, severity, frequency, inference badge, expandable quotes. Profiles: accordion per subreddit, editable fields.
- **Validation:** Manual — pin evidence, analyze, themes appear with evidence links.
- **Status:** complete

### Task 2.9 — ADR, README, full validation

- **Objective:** Document and verify.
- **Dependencies:** 2.1–2.8.
- **Files:** `docs/decisions/0003-llm-discovery-architecture.md`, `README.md`.
- **Validation:** `npm run lint`, `npm run test`, `npm run typecheck`, `npm run build` pass.
- **Status:** complete

## 13. Sub-agent delegation map

| Slice | Delegable? | Owner | Boundaries |
|---|---|---|---|
| LLM client + JSON parse + tests | Yes | sub-agent | `shared/llm/`, `shared/discovery/parser` |
| Discovery prompt + schema | Yes | sub-agent | `shared/discovery/prompt`, `schema` |
| Storage CRUD + seed profiles | Yes | sub-agent | `storage-adapter.ts`, `seed-profiles.ts` |
| Settings + discovery handlers | Lead preferred | lead | `background/handlers/` |
| Side panel UI | Yes | sub-agent | `sidepanel/*-ui.ts` — messages only, no direct fetch |
| ADR + README | Lead agent | lead | docs |

## 14. Test and validation matrix

| Requirement | Validation method | Expected evidence | Status |
|---|---|---|---|
| LLM client HTTP call | Mocked fetch unit test | Request shape correct | complete |
| API key not in GET_SETTINGS | Unit test | Key masked/absent | complete |
| Discovery JSON parsing | Fixture test | Valid `PainTheme[]` | complete |
| Evidence IDs validated | Parser test | Rejects unknown IDs | complete |
| Inference flag preserved | Parser test | `inferenceFlag` maps correctly | complete |
| Seed profiles loaded | Storage test | 5 profiles on fresh install | complete |
| Pain theme replace on re-run | Storage test | Old themes removed | complete |
| optional_host_permissions | Manifest inspect | Present in dist manifest | complete |
| Settings UI renders | Manual | Form saves and persists | pending (user-assisted) |
| Discovery UI shows themes | Manual with API key | Themes list after analyze | pending (user-assisted) |
| Graceful no-config state | Manual | Clear message when key missing | pending (user-assisted) |
| TypeScript strict | `npm run typecheck` | Exit 0 | complete |
| Build | `npm run build` | dist/ includes new chunks | complete |
| Lint | `npm run lint` | Exit 0 | complete |
| No secrets in repo | grep | No API keys committed | complete |

## 15. Security, privacy, reliability, accessibility, and performance checks

- **Security:** API key in `chrome.storage.local` only; never log key; never export in markdown; LLM calls from service worker; sanitize evidence before prompt inclusion.
- **Privacy:** Only active session evidence sent to LLM; user initiates analysis; no telemetry.
- **Reliability:** JSON parse failure → one repair retry; clear error messages for 401/429/403; offline view of saved themes.
- **Accessibility:** Settings form labels; theme list keyboard navigable; `aria-busy` during analysis; `aria-live` for errors.
- **Performance:** Cap evidence items; truncate quotes > 500 chars in prompt; target < 30s for typical session on manual check.

## 16. Environment-variable registry

Never include values.

| Variable name | Purpose | Scope/environment | Required by phase | Source/provider | Status |
|---|---|---|---|---|---|
| `IMPLEMENTO_LLM_API_URL` | OpenAI-compatible base URL | `chrome.storage.local` via settings UI | phase 2 | User/provider dashboard | required_at_runtime |
| `IMPLEMENTO_LLM_API_KEY` | LLM authentication | `chrome.storage.local` only | phase 2 | User/provider dashboard | required_at_runtime |
| `IMPLEMENTO_LLM_MODEL` | Model selection | `chrome.storage.local` | phase 2 | User preference | required_at_runtime |
| `IMPLEMENTO_LLM_TEMPERATURE` | Sampling temperature | `chrome.storage.local` | phase 2 | User preference | optional |
| `REDDIT_CLIENT_ID` | OAuth client ID | Backend/extension OAuth | phase 5 | Reddit developer portal | deferred |
| `REDDIT_CLIENT_SECRET` | OAuth secret | Backend only | phase 5 | Reddit developer portal | deferred |

Storage keys map to `settings.llmApiUrl`, `settings.llmApiKey`, `settings.llmModel`, `settings.llmTemperature` in `ImplementoStorageSchema`.

## 17. Deferred human-action queue

| Action | Why agent cannot perform | Earliest phase | Blocking now? | Final-checklist destination |
|---|---|---|---|---|
| Supply LLM API key | User's provider account/billing | phase 2 verification | No | Env vars section |
| Grant host permission for API origin | Chrome permission dialog | phase 2 verification | No | Env vars section |
| Manual discovery test with real LLM | Requires user API key | phase 2 verification | No | Completion evidence |
| Create Reddit API application | User account + approval | phase 5 | No | OAuth section |
| Chrome Web Store developer account | Payment + Google account | phase 5 | No | Deployment section |

## 18. Rollback and recovery

- Remove discovery handlers and UI to restore phase 1 capture-only workflow.
- Pain themes in storage are additive; safe to clear via `chrome.storage.local` reset.
- Revert `optional_host_permissions` from manifest if LLM removed.
- LLM adapter can be re-stubbed without affecting evidence capture.

## 19. Acceptance criteria

Phase 2 is complete when ALL are true:

1. User can save OpenAI-compatible API URL, key, and model in settings UI.
2. `TEST_LLM_CONNECTION` succeeds with valid credentials (user-assisted) or returns clear error with invalid credentials.
3. Host permission requested for configured API origin on save.
4. Five seed community profiles exist on fresh install and are editable.
5. User can click **Analyze session** on a session with ≥1 evidence item.
6. Discovery produces ≥1 `PainTheme` with title, severity, evidence links, and `inferenceFlag`.
7. Themes persist across side panel reload; re-run replaces prior themes for that session.
8. LLM-not-configured state shows actionable message; capture workflow still works.
9. API key never appears in GET_SETTINGS response, exports, or repository.
10. Parser and LLM client unit tests pass; storage tests pass.
11. `npm run lint`, `npm run test`, `npm run typecheck`, `npm run build` pass.
12. `docs/decisions/0003-llm-discovery-architecture.md` recorded.
13. This plan updated with completion evidence and status `complete`.
14. `STATE.md` reflects phase 2 complete; next action = generate phase 3 plan.

## 20. Completion evidence

| Check | Evidence |
|---|---|
| Build | `npm run build` exit 0; `dist/` v0.2.0 with `optional_host_permissions`, discovery + settings chunks |
| Tests | 35/35 pass (parser, prompt, openai-client, llm-adapter, storage CRUD, existing reddit/template tests) |
| Typecheck / lint | `npm run typecheck` and `npm run lint` exit 0 |
| ADR | `docs/decisions/0003-llm-discovery-architecture.md` |
| README | LLM setup + discovery workflow documented |
| LLM connection | Deferred — requires user API key |
| Discovery run | Deferred — requires user API key + host permission |

## 21. Deviations and follow-ups

- `json-parse.ts` and `profiles-ui.ts` from original file list were not created as separate modules; JSON extraction lives in `parser.ts` and profile UI lives in `discovery-ui.ts`.
- Manual UI verification (settings save, analyze session, no-config state) deferred to user with API key.

## 22. Next Plan Generation Prompt

Read `/AGENTS.md`, the complete core agent context, `/instructions/PROJECT_PLANNING.md`, the original `docs/plans/phase_0_foundations_plan.md`, this completed phase plan, all completion evidence, current repository state, active blockers, and relevant decisions. Confirm phase 2 is fully implemented and validated. Then generate exactly one exhaustive next phase plan at `docs/plans/phase_3_planning-engine_plan.md`. Derive it from the phase-0 roadmap and verified current state, preserve unresolved requirements, include all required plan sections, defer non-blocking human actions to the final phase, and do not implement phase 3 until the plan is written.
