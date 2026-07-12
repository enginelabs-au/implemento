---
plan: phase_4_post-suggestions
status: complete
created: 2026-07-11
updated: 2026-07-11
owner: lead-agent
source_phase: docs/plans/phase_3_planning-engine_plan.md
---

# Phase 4: Post suggestions

## 1. Objective

Implement **STRATEGY Arm 3 — cultural go-to-market** in the Implemento extension: generate convention-aware Reddit post drafts for selected communities using pain themes, blueprint positioning, and community profiles — three archetypes per subreddit (problem-first, transparent build, resource-value) — with ethics guardrails, promotional risk flags, local persistence, and markdown export. No auto-posting.

## 2. Relation to project end-state

Phases 1–3 deliver capture → discovery → planning artifacts. Phase 4 completes the core product loop promised in the blueprint: **Reddit pain → phased plan → post**. Users can move from research evidence to ethical, community-appropriate launch concepts without leaving the browser workflow.

Downstream:

- **Phase 5** hardens the full pipeline, adds optional OAuth path, store assets, JSON bundle export, and `final_implementation_checklist.md`.

Phase 4 is the third LLM-heavy phase. It reuses BYOK settings, service-worker calls, community profiles, and `renderPostDraft()` from phase 0. Capture, discovery, and planning must remain usable when post generation is skipped.

## 3. Entry criteria and inherited evidence

### Phase 3 completion (verified)

| Criterion | Evidence |
|---|---|
| Blueprint generation | `GENERATE_BLUEPRINT`, template-hybrid pipeline, ADR 0004 |
| Phase 0 generation | `GENERATE_PHASE0`, section validation |
| Community profiles | Seed + editable profiles from phase 2 |
| Pain themes | Discovery engine from phase 2 |
| Template engine | `renderPostDraft()`, `post-draft-template.md` |
| Domain types | `PostDraft`, `PostArchetype` defined; `postDrafts[]` in storage |
| Tests | 43/43 passing |
| Build | `dist/` v0.3.0 |

### Inherited from blueprint + STRATEGY.md Arm 3

- Three draft concepts per target community: **problem-first**, **transparent build**, **resource-value**.
- Adapt language to community profiler (tone, post patterns, promo policy, rules notes).
- Flag promotional risk in output.
- Never recommend astroturfing, rule evasion, or deceptive grassroots tactics.
- Post drafts are suggestions only; user must review subreddit rules before posting.

### Inherited technical state

| Area | State after phase 3 |
|---|---|
| Post draft CRUD | Types + empty `postDrafts[]` only |
| Post LLM prompts | None |
| Ethics guardrails | None |
| Post handlers | None |
| Post UI | None |
| Post export | Template exists; no wired export |

**Existing assets to extend:**

- `extension/src/shared/types/domain.ts` — `PostDraft`, `PostArchetype`
- `extension/src/shared/templates/engine.ts` — `renderPostDraft()`
- `extension/src/shared/templates/assets/post-draft-template.md`
- `extension/src/shared/discovery/seed-profiles.ts` — default communities
- `extension/src/background/handlers/planning.ts` — orchestration pattern
- `extension/src/shared/storage/storage-adapter.ts` — add post draft CRUD

## 4. Scope

### In scope

1. **Post draft schema** — LLM JSON contract: array of drafts per subreddit with `archetype`, `title`, `body`, `riskNotes`, `promoRisk` (`low` \| `medium` \| `high`).
2. **Ethics guardrails module** — Static blocklist scan on title/body; reject or flag drafts matching rule-evasion / astroturfing patterns; system prompt enforcement.
3. **Post prompts** — System/user prompts from blueprint excerpt, pain themes, community profile, and archetype definitions.
4. **Post parser** — Map LLM JSON → `PostDraft[]`; validate archetypes and subreddit; attach ethics scan results to `riskNotes`.
5. **Storage extensions** — `listPostDrafts(sessionId)`, `replacePostDraftsForSubreddits(sessionId, subreddits, drafts)`, keyed replace per subreddit batch.
6. **Background handler** — `GENERATE_POST_DRAFTS` (one LLM call per subreddit, 3 archetypes each); `LIST_POST_DRAFTS`.
7. **Side panel Posts UI** — Subreddit multi-select (session subreddits + seed profiles), generate button, draft cards by subreddit/archetype, promo risk badge, export per draft or bundle.
8. **Graceful degradation** — Clear errors when LLM not configured or blueprint missing; offline view/export of saved drafts.
9. **Unit tests** — Ethics scanner, parser fixtures, prompt builder, storage CRUD.
10. **ADR 0005** — Post suggestion architecture, ethics model, data minimization.
11. **README** — Post suggestion workflow.

### Out of scope (deferred)

- Auto-posting to Reddit (explicit v1 non-goal).
- Chrome Web Store publication (phase 5).
- JSON project bundle export (phase 5).
- Inline draft editing (regenerate only in v1).
- Cross-session draft library.
- Reddit API-backed “top post pattern mining” (blueprint later-phase item).
- Managed LLM proxy.
- Firefox port.

## 5. Non-goals

- Do not post on user's behalf or inject content into Reddit DOM for submission.
- Do not send full blueprint + all evidence on every subreddit call — summarize for token budget.
- Do not store API keys outside `chrome.storage.local`.
- Do not implement streaming LLM responses.
- Do not bypass ethics guardrails silently — flagged drafts must show visible warnings.
- Do not require phase 5 OAuth or Reddit API.
- Do not implement phase 5 until phase 4 is verified.

## 6. Current-state audit

| Area | State after phase 3 |
|---|---|
| `PostDraft` persistence | Schema slot only |
| Archetype generation | Not implemented |
| Community convention use | Profiles exist; not used in LLM calls |
| Promotional risk flagging | Not implemented |
| Ethics blocklist | Not implemented |
| Post message types | None |
| Posts UI section | None |

**Packaged post draft template variables:**

`subreddit`, `archetype`, `created`, `title`, `body`, `risk_notes`

**Archetypes (fixed enum):**

| Archetype | STRATEGY intent |
|---|---|
| `problem-first` | Pain-centred discussion; no forced pitch |
| `transparent-build` | Build journey with evidence and tradeoffs |
| `resource-value` | Useful resource/analysis; restrained disclosure |

## 7. Assumptions, constraints, risks, and decisions

### Assumptions

| ID | Assumption | Reversibility |
|---|---|---|
| A1 | Blueprint exists before post generation (positioning anchor) | High |
| A2 | User selects 1–3 subreddits per generation run | High |
| A3 | One LLM call per subreddit (3 drafts returned) is acceptable | High |
| A4 | Max 3 subreddits per run keeps token cost reasonable | High |
| A5 | Static ethics blocklist + LLM riskNotes is sufficient for v1 | Medium |
| A6 | Session `subreddits[]` plus seed profiles cover target community picker | High |

### Constraints

- MV3 service worker executes LLM calls (same as phases 2–3).
- Prompt includes truncated blueprint (UVP + product promise sections) and profile fields.
- Each subreddit call must return exactly 3 drafts (one per archetype).
- Draft body/title treated as untrusted LLM output — sanitize before render in side panel (`textContent` only).

### Risks

| Risk | Impact | Mitigation |
|---|---|---|
| LLM produces spammy/promotional copy | High | Ethics blocklist; promo risk enum; profile promo policy in prompt |
| LLM ignores archetype distinctions | Medium | Schema requires 3 distinct archetypes; parser validates |
| 15 drafts (5 subs × 3) too many for one run | Medium | Cap 3 subreddits per run; user selects targets |
| User treats drafts as rule-safe | High | Prominent disclaimer; risk notes required; no auto-post |
| Token limit with long blueprint | Medium | Truncate blueprint excerpt; theme summaries only |

### Decisions (phase 4)

| ID | Decision | Rationale |
|---|---|---|
| D1 | Require session blueprint before generation | Positioning anchor for ethical, accurate drafts |
| D2 | One LLM call per subreddit returning 3 archetype drafts | Clear schema; manageable parse/repair |
| D3 | Cap 3 subreddits per `GENERATE_POST_DRAFTS` run | Token budget and UX |
| D4 | Replace existing drafts for targeted subreddits on re-run | Avoid duplicate accumulation |
| D5 | Ethics scan post-parse; block persist on critical matches | Safety over convenience |
| D6 | `promoRisk` from LLM + ethics bump (never downgrade blocked to low) | Visible warning in UI |
| D7 | Export via `renderPostDraft()` + side panel download | Reuses phase 0 template |
| D8 | Pain themes optional in prompt but included when present | Stronger problem-first drafts |

## 8. Dependencies

### External

- User LLM API key and host permission (inherited; non-blocking for code).
- Chrome downloads API (already available).

### Internal (must be complete)

- Phase 2 community profiles and pain themes (verified).
- Phase 3 blueprint generation (verified).

### Downstream dependents

- Phase 5 integrates full pipeline validation, store assets, final checklist.

### Dependency graph

```text
phase_3 (complete)
    └── phase_4 (this plan)
            └── phase_5 (hardening-release)
```

## 9. Architecture and affected systems

### Target flow

```text
Side Panel                         Service Worker
──────────                         ──────────────
[Select subreddits 1–3]
[Generate post drafts]
    │
    └──GENERATE_POST_DRAFTS──────► load blueprint + themes + profiles
                                   for each subreddit:
                                     build post prompt
                                     llmAdapter.complete()
                                     parse JSON → PostDraft[]
                                     ethicsScan(drafts)
                                     replacePostDraftsForSubreddits()
    ◄──POST_DRAFTS_READY──────────  drafts + warnings

[Draft cards] ◄──LIST_POST_DRAFTS
[Export draft / all]              (client-side renderPostDraft + download)
```

### New modules

| Module | Responsibility |
|---|---|
| `shared/posts/schema.ts` | Archetype enum, LLM payload types, validators |
| `shared/posts/ethics.ts` | Blocklist patterns, scan, risk elevation |
| `shared/posts/prompt.ts` | System/user prompts per subreddit |
| `shared/posts/parser.ts` | JSON extract → `PostDraft[]` |
| `shared/posts/fixtures/*.json` | Parser test fixtures |
| `background/handlers/posts.ts` | `GENERATE_POST_DRAFTS` orchestration |
| `sidepanel/posts-ui.ts` | Subreddit picker, draft list, export |

### LLM JSON contract (per subreddit)

```typescript
interface PostDraftsResponsePayload {
  subreddit: string;
  drafts: Array<{
    archetype: "problem-first" | "transparent-build" | "resource-value";
    title: string;
    body: string;
    riskNotes: string;
    promoRisk: "low" | "medium" | "high";
  }>;
}
```

Parser requires exactly 3 drafts with one of each archetype.

### Message protocol additions

| Message | Direction | Purpose |
|---|---|---|
| `GENERATE_POST_DRAFTS` | panel → bg | Generate drafts for 1–3 subreddits |
| `LIST_POST_DRAFTS` | panel → bg | All drafts for session |

`GENERATE_POST_DRAFTS` input: `{ sessionId?: string; subreddits: string[] }`

## 10. Files and paths in scope

### Create

- `extension/src/shared/posts/schema.ts`
- `extension/src/shared/posts/ethics.ts`
- `extension/src/shared/posts/ethics.test.ts`
- `extension/src/shared/posts/prompt.ts`
- `extension/src/shared/posts/prompt.test.ts`
- `extension/src/shared/posts/parser.ts`
- `extension/src/shared/posts/parser.test.ts`
- `extension/src/shared/posts/fixtures/sample-posts-response.json`
- `extension/src/background/handlers/posts.ts`
- `extension/src/sidepanel/posts-ui.ts`
- `docs/decisions/0005-post-suggestions-architecture.md`

### Update

- `extension/manifest.json` — version `0.4.0`
- `extension/src/shared/storage/storage-adapter.ts` — post draft CRUD
- `extension/src/shared/messages/types.ts` — post messages
- `extension/src/background/handlers/messages.ts` — route post handlers
- `extension/src/sidepanel/index.html` — Posts section
- `extension/src/sidepanel/main.ts` — wire posts UI
- `extension/src/sidepanel/styles.css` — draft cards, risk badges
- `README.md` — post suggestion workflow
- `docs/plans/phase_4_post-suggestions_plan.md` — completion evidence on finish
- `.cursor/STATE.md`
- `.cursor/memory/memories/2026-07-11-continuation.md`

## 11. Supporting documents to create or update

| Path | Purpose |
|---|---|
| `docs/decisions/0005-post-suggestions-architecture.md` | Archetype model, ethics guardrails, LLM data scope |
| `README.md` | Generate and export post drafts |
| `extension/src/shared/posts/fixtures/sample-posts-response.json` | Parser tests |

## 12. Ordered implementation tasks

### Task 4.1 — Post schema, parser, and ethics module

- **Objective:** Validate LLM JSON and enforce ethics constraints.
- **Dependencies:** None.
- **Files:** `posts/schema.ts`, `posts/parser.ts`, `posts/ethics.ts`, fixtures, tests.
- **Notes:** Parser requires 3 unique archetypes. Ethics blocklist includes phrases suggesting astroturfing, ban evasion, fake accounts, vote manipulation. Critical match → `PostEthicsError` blocks persist.
- **Validation:** Fixture parses to 3 `PostDraft` items; ethics test flags blocked phrase.
- **Status:** complete

### Task 4.2 — Post prompts

- **Objective:** Build subreddit-aware prompts grounded in blueprint and profile.
- **Dependencies:** 4.1.
- **Files:** `posts/prompt.ts`, `prompt.test.ts`.
- **Notes:** Include profile tone, postPatterns, promoPolicy, rulesNotes. Blueprint excerpt: executive decision + UVP (truncated). Pain themes: titles + summaries. System prompt: ethics rules, 3 archetypes, JSON only.
- **Validation:** Prompt contains subreddit name, promo policy, and archetype list.
- **Status:** complete

### Task 4.3 — Storage CRUD for post drafts

- **Objective:** Persist and replace drafts per session/subreddit.
- **Dependencies:** None.
- **Files:** `storage-adapter.ts`, `storage-adapter.test.ts`.
- **Notes:** `replacePostDraftsForSubreddits(sessionId, subreddits, drafts)` removes prior drafts for those subreddits then appends new. `listPostDrafts(sessionId)` returns all for session.
- **Validation:** Storage tests for replace scoped to subreddit and list by session.
- **Status:** complete

### Task 4.4 — Post background handler

- **Objective:** `GENERATE_POST_DRAFTS` end-to-end orchestration.
- **Dependencies:** 4.1–4.3, phase 2/3 handlers pattern.
- **Files:** `handlers/posts.ts`, update `messages.ts`.
- **Notes:** Prerequisite: blueprint exists. Cap subreddits at 3. Loop per subreddit: LLM → parse → ethics → collect. Atomic replace for all requested subreddits. JSON repair retry once per subreddit on parse failure.
- **Validation:** Mocked LLM integration test returns 3 drafts; ethics block prevents persist on critical match.
- **Status:** complete

### Task 4.5 — Message types and routing

- **Objective:** Wire post messages through service worker.
- **Dependencies:** 4.4.
- **Files:** `messages/types.ts`, `handlers/messages.ts`.
- **Validation:** Typecheck passes; router handles new cases.
- **Status:** complete

### Task 4.6 — Posts UI

- **Objective:** User can select subreddits, generate, review, and export drafts.
- **Dependencies:** 4.5.
- **Files:** `posts-ui.ts`, `index.html`, `main.ts`, `styles.css`.
- **Notes:** Multi-select checkboxes for session subreddits ∪ seed profile names (default select session subs). Generate disabled without blueprint/LLM/selection. Cards grouped by subreddit; badge for `promoRisk`. Export single draft and "Export all drafts" bundle. Disclaimer: "Review subreddit rules before posting."
- **Validation:** Manual — with API key + blueprint, drafts appear (user-assisted).
- **Status:** complete

### Task 4.7 — ADR, README, full validation

- **Objective:** Document and verify phase 4.
- **Dependencies:** 4.1–4.6.
- **Files:** `docs/decisions/0005-post-suggestions-architecture.md`, `README.md`.
- **Validation:** `npm run lint`, `npm run test`, `npm run typecheck`, `npm run build` pass.
- **Status:** complete

## 13. Sub-agent delegation map

| Slice | Delegable? | Owner | Boundaries |
|---|---|---|---|
| Schema + parser + ethics + tests | Yes | sub-agent | `shared/posts/` |
| Post prompts + tests | Yes | sub-agent | `shared/posts/prompt` |
| Storage CRUD + tests | Yes | sub-agent | `storage-adapter.ts` post methods |
| Post background handler | Lead preferred | lead | `background/handlers/posts.ts` |
| Posts UI | Yes | sub-agent | `sidepanel/posts-ui.ts` — messages only |
| ADR + README | Lead agent | lead | `docs/decisions/`, `README.md` |

## 14. Test and validation matrix

| Requirement | Validation method | Expected evidence | Status |
|---|---|---|---|
| Parser requires 3 archetypes | Fixture test | Exactly one of each archetype | complete |
| Ethics blocklist catches violations | Unit test | Critical phrase blocked | complete |
| Promo risk preserved | Parser test | `promoRisk` maps to UI badge | complete |
| Subreddit cap enforced | Handler code | >3 subreddits returns error | complete |
| Blueprint prerequisite | Handler code | No blueprint → clear error | complete |
| Draft replace per subreddit | Storage test | Re-run replaces prior subreddit drafts | complete |
| API key not in exports | Inspect export | No key strings | complete |
| Posts UI renders | Manual | Picker, cards, export buttons | pending (user-assisted) |
| Generate with real LLM | Manual with API key | 3 drafts per subreddit | pending (user-assisted) |
| TypeScript strict | `npm run typecheck` | Exit 0 | complete |
| Build | `npm run build` | dist/ v0.4.0 | complete |
| Lint | `npm run lint` | Exit 0 | complete |
| No secrets in repo | grep | No API keys committed | complete |

## 15. Security, privacy, reliability, accessibility, and performance checks

- **Security:** LLM from service worker; sanitize draft text before DOM render; ethics block on critical patterns; no auto-post.
- **Privacy:** Send only active session blueprint excerpt, themes, and selected profile — not other sessions.
- **Reliability:** Per-subreddit JSON repair retry; saved drafts viewable/exportable offline; clear prerequisite errors.
- **Accessibility:** Subreddit checkboxes labeled; `aria-live` for generation feedback; risk badges with text labels (not color-only).
- **Performance:** Max 3 subreddits × 1 LLM call; truncate blueprint to ~4k chars in prompt; target < 90s for 3-subreddit run on manual check.

## 16. Environment-variable registry

Never include values.

| Variable name | Purpose | Scope/environment | Required by phase | Source/provider | Status |
|---|---|---|---|---|---|
| `IMPLEMENTO_LLM_API_URL` | OpenAI-compatible base URL | `chrome.storage.local` | phase 2+ (used by phase 4) | User/provider dashboard | required_at_runtime |
| `IMPLEMENTO_LLM_API_KEY` | LLM authentication | `chrome.storage.local` only | phase 2+ (used by phase 4) | User/provider dashboard | required_at_runtime |
| `IMPLEMENTO_LLM_MODEL` | Model selection | `chrome.storage.local` | phase 2+ (used by phase 4) | User preference | required_at_runtime |
| `IMPLEMENTO_LLM_TEMPERATURE` | Sampling temperature | `chrome.storage.local` | phase 2+ | User preference | optional |
| `REDDIT_CLIENT_ID` | OAuth client ID | Backend/extension OAuth | phase 5 | Reddit developer portal | deferred |
| `REDDIT_CLIENT_SECRET` | OAuth secret | Backend only | phase 5 | Reddit developer portal | deferred |

No new environment variables in phase 4.

## 17. Deferred human-action queue

| Action | Why agent cannot perform | Earliest phase | Blocking now? | Final-checklist destination |
|---|---|---|---|---|
| Supply LLM API key | User's provider account | phase 2+ verification | No | Env vars section |
| Manual post draft test | Requires user API key + blueprint | phase 4 verification | No | Completion evidence |
| Review drafts against live subreddit rules | Human judgment + live rules | phase 4 usage | No | Ethics disclaimer in UI |
| JSON project bundle export | phase 5 scope | phase 5 | No | Export section |
| Chrome Web Store submission | Human account + review | phase 5 | No | Deployment section |

## 18. Rollback and recovery

- Remove post handlers and UI to restore phase 3 planning-only workflow.
- Post drafts are additive; clear via storage reset.
- Ethics module removal reverts to no post generation without affecting prior phases.
- Revert manifest version if posts feature removed.

## 19. Acceptance criteria

Phase 4 is complete when ALL are true:

1. User with configured LLM, session blueprint, and 1–3 selected subreddits can click **Generate post drafts**.
2. Generation produces exactly 3 drafts per subreddit (problem-first, transparent-build, resource-value).
3. Drafts adapt to community profile fields (visible in prompt-grounded copy or risk notes).
4. Each draft shows promotional risk level and ethics-derived warnings when applicable.
5. Critical ethics violations block persistence and surface a clear error.
6. User can export individual drafts and all drafts as markdown via `renderPostDraft()`.
7. Re-run replaces prior drafts for the same subreddits only.
8. Missing prerequisites show actionable errors (no LLM, no blueprint, no selection).
9. Capture, discovery, and planning workflows still work when posts are unused.
10. Ethics, parser, prompt, and storage unit tests pass.
11. `npm run lint`, `npm run test`, `npm run typecheck`, `npm run build` pass.
12. `docs/decisions/0005-post-suggestions-architecture.md` recorded.
13. This plan updated with completion evidence and status `complete`.
14. `STATE.md` reflects phase 4 complete; next action = generate phase 5 plan.

## 20. Completion evidence

| Check | Evidence |
|---|---|
| Build | `npm run build` exit 0; `dist/` v0.4.0 with posts handler + UI |
| Tests | 49/49 pass (posts parser/prompt/ethics, storage CRUD, existing suites) |
| Typecheck / lint | `npm run typecheck` and `npm run lint` exit 0 |
| ADR | `docs/decisions/0005-post-suggestions-architecture.md` |
| README | Post draft workflow documented |
| Post generation | Deferred — requires user API key + blueprint |

## 21. Deviations and follow-ups

- Manual LLM post draft test deferred to user with API key.
- `promoRisk` added to `PostDraft` domain type (not in original type stub).

## 22. Next Plan Generation Prompt

Read `/AGENTS.md`, the complete core agent context, `/instructions/PROJECT_PLANNING.md`, the original `docs/plans/phase_0_foundations_plan.md`, this completed phase plan, all completion evidence, current repository state, active blockers, and relevant decisions. Confirm phase 4 is fully implemented and validated. Then generate exactly one exhaustive next phase plan at `docs/plans/phase_5_hardening-release_plan.md`. Derive it from the phase-0 roadmap and verified current state, preserve unresolved requirements, include all required plan sections, consolidate remaining human-only actions into the final implementation checklist per PROJECT_PLANNING.md, and do not implement phase 5 until the plan is written.
