---
blueprint: implemento-browser-extension
status: complete
created: 2026-07-11
updated: 2026-07-11
owner: lead-agent
---

# Implemento — Reddit-native market discovery and solution planning extension

## 1. Executive decision

**Build** a Manifest V3 browser extension called **Implemento** that operationalizes the repository's agent control plane (`/AGENTS.md`, `/instructions/STRATEGY.md`, `/instructions/PROJECT_PLANNING.md`) as a Reddit-native product workflow.

**Primary wedge:** GummySearch closed to new signups (November 2025), leaving a gap for founders and indie builders who research markets on Reddit. Existing replacements (PainPointy, Arieo, Reddinbox, Linkeddit, PainOnSocial) focus on monitoring, pain scoring, or alerts — none package **problem discovery → solution blueprint → phased implementation plan → community-appropriate post drafts** in one browser-native flow grounded in a reproducible methodology.

**MVP platform:** Chrome extension (MV3) with side panel, local-first storage, optional user-supplied LLM API key. Firefox port deferred.

**MVP Reddit access:** DOM and in-page JSON extraction while the user browses Reddit (no Reddit API approval required for v1 read path). OAuth-backed Reddit Data API is a later-phase upgrade for search, monitoring, and bulk analysis.

**Commercial posture (provisional):** Personal/non-commercial free tier aligned with Reddit's free API tier; commercial packaging deferred until usage and API approval path are validated.

---

## 2. Evidence and research method

### Methods used

- Repository audit: workspace is an agent control plane scaffold (`.cursor/`) with no application code yet.
- Web research on Reddit API constraints (2026), competitive landscape post-GummySearch shutdown, and browser extension technical constraints.
- Instruction-file analysis: product workflow must mirror `STRATEGY.md` (3 arms) and `PROJECT_PLANNING.md` (sequential phase plans).

### Research limitations

- No live Reddit API app registration attempted (approval can take days and may fail silently).
- No primary user interviews performed; assumptions below are provisional.
- Competitor pricing and feature claims are from public marketing pages; not independently verified.
- Third-party blog sources on Reddit API (redditapis.com, redaccs.com) are secondary; official Reddit developer documentation should be consulted before API integration phases.

---

## 3. Intelligence report

### Target communities (initial seed set)

| Community | Relevance | Observable patterns |
|---|---|---|
| r/SaaS | B2B founders validating problems, sharing build journeys | Problem-first posts, transparent build logs, "what would you pay for" threads |
| r/Entrepreneur | Broader founder audience, idea validation | Story-led posts, lessons learned, resource drops |
| r/startups | Early-stage product discovery | YC-style directness, competitor comparisons, MVP feedback requests |
| r/sideproject | Builders shipping small products | Show-and-tell, demo links with restraint, "I built X because Y hurt" |
| r/indiehackers | Indie SaaS builders | Revenue transparency, niche problem posts, anti-spam norms |

### Recurring pain signals (inferred from category norms + competitor positioning)

- **Volume overload:** Thousands of relevant threads; manual reading does not scale.
- **Evidence quality:** Surveys and interviews are slow; Reddit has unfiltered complaints but lacks structure.
- **Tool gap post-GummySearch:** Monitoring-focused tools replaced one slice; phased build planning and ethical launch drafting are underserved.
- **Promotion anxiety:** Founders fear rule violations and community backlash when posting about their solutions.
- **Workflow fragmentation:** Research in browser, planning in Notion/Docs, posting back in Reddit — context is lost.

### Manual workarounds observed in the category

- Saved Reddit posts + spreadsheets for pain themes
- Copy-paste threads into ChatGPT for summarization
- Ad-hoc subreddit lurking to learn "what works" before posting
- Separate tools for alerts (Syften, F5Bot) vs analysis (PainPointy, Arieo)

---

## 4. User/problem definition

### Primary user

**Solo founder or indie builder** (technical or semi-technical) who uses Reddit to discover market problems and wants a structured path from evidence to build plan to community-appropriate outreach.

### Job-to-be-done

When I'm researching a market on Reddit, I want to capture real pain evidence, synthesize a solution plan, and draft posts that fit community norms — so I can validate and build without losing context or spamming communities.

### Problem statement

Reddit contains high-signal market problems, but the path from thread evidence → product blueprint → implementation phases → ethical launch posts is manual, fragmented, and not supported by browser-native tools — especially after GummySearch stopped onboarding new users.

### Desired outcome

A side-panel workflow on Reddit that produces durable artifacts matching the repository's `docs/blueprints/` and `docs/plans/` structure, plus ranked post suggestions adapted to each community's conventions.

### Product promise

**"From Reddit pain to phased plan to post — in the browser, by the book."**

---

## 5. Competitive landscape and gap

| Alternative | Strengths | Weaknesses vs Implemento wedge |
|---|---|---|
| GummySearch (closed) | Subreddit curation, keyword monitoring, theme folders | No new signups; never shipped phased implementation planning |
| PainPointy | Pain intensity ranking, daily reports, quotes | SaaS dashboard; no in-browser workflow; no build planning |
| Arieo | AI demand scan, personas, content repurposing | Web app; broader than Reddit; no agent-methodology exports |
| Reddinbox | Multi-platform AI synthesis | Not extension-native; post drafting not tied to local planning artifacts |
| Linkeddit | Ongoing monitors, thread context | Monitoring-first; no solution/plan generation |
| PainOnSocial | Pain scoring 0–100 | Analysis-only; no cultural GTM drafting |
| Syften / F5Bot | Real-time keyword alerts | Alerts only; no synthesis or planning |
| Raw ChatGPT | Flexible | No Reddit context capture, no community convention memory, no structured plan templates |

### Defensible wedge

Browser-native **methodology-backed** pipeline: Reddit context → strategy blueprint → phase 0 plan → post drafts — with exports that match the implemento control plane file roles.

---

## 6. Unique value proposition and wedge

**UVP:** The only Reddit browser extension that turns live community evidence into implemento-standard blueprints, sequential phase plans, and convention-aware post suggestions — not just pain scores or alerts.

**Testable wedge hypothesis:** Founders who already browse Reddit for research will complete one full "pain → blueprint → phase 0 → post draft" cycle faster in Implemento than with ChatGPT + manual notes, measured by time-to-first-export and self-reported usefulness.

---

## 7. Validation experiments and thresholds

| Experiment | Method | Pass threshold | Fail action |
|---|---|---|---|
| Problem capture usefulness | 5 target users save pain evidence from 3 subreddits | ≥4/5 rate evidence capture "useful" | Improve DOM extraction and thread selection UX |
| Blueprint quality | Blind review of 10 generated blueprints vs manual baseline | ≥7/10 rated "actionable" | Tune prompts and template adherence |
| Plan fidelity | Automated lint: exports contain all required phase-plan sections | 100% section coverage on sample set | Fix template engine |
| Post draft safety | Community mod rule check + human review | 0 rule-violation recommendations in sample | Strengthen cultural audit guardrails |
| Willingness to use | Unpaid waitlist or Chrome Web Store installs (post-beta) | ≥50 installs in 30 days post-launch | Narrow segment or pivot to monitoring-only |

---

## 8. Product requirements document

### Functional requirements (v1)

1. **Reddit context capture**
   - Detect current page type: subreddit, post thread, search results, user profile (read-only).
   - Extract post title, body, comments (paginated lazy load), subreddit metadata, scores, flairs.
   - Allow user to pin threads/comments into a "research session."

2. **Community profiler**
   - Maintain a configurable set of target communities (default seed: 5 listed above).
   - Store per-community notes: tone, taboo topics, successful post patterns, self-promo rules (user-editable + LLM-suggested).

3. **Problem discovery (STRATEGY Arm 1)**
   - Cluster pinned evidence into pain themes with severity and frequency signals.
   - Distinguish evidence vs inference in output.
   - Surface workaround language and buyer signals.

4. **Solution synthesis (STRATEGY Arm 2)**
   - Generate blueprint markdown using `docs/blueprints/` structure from STRATEGY.md.
   - Propose MVP scope, non-goals, architecture sketch, and delivery phase map.

5. **Planning engine (PROJECT_PLANNING)**
   - Generate `phase_0_foundations_plan.md` from blueprint + repo template.
   - Store phase status locally; export on demand.
   - Do not auto-generate later phase plans until user marks prior phase complete (mirrors agent lifecycle).

6. **Post suggestion engine (STRATEGY Arm 3)**
   - Produce three draft concepts per target community: problem-first, transparent build, resource-value.
   - Adapt language to community profiler; flag promotional risk.
   - Never recommend astroturfing, rule evasion, or deceptive grassroots tactics.

7. **Export and portability**
   - Export markdown artifacts to user-chosen folder via downloads API.
   - JSON project bundle for re-import.

8. **Settings**
   - LLM provider selection (OpenAI-compatible API URL + key stored in `chrome.storage.local`, never synced).
   - Community list management.
   - Optional model/temperature controls.

### Non-functional requirements

- **Privacy:** Research data stays local by default; no telemetry without opt-in.
- **Performance:** Side panel interactive within 300ms of open; LLM calls show progress and cancel option.
- **Reliability:** Graceful degradation when LLM unavailable; offline viewing of saved sessions.
- **Security:** MV3 CSP; no remote code execution; sanitize all Reddit-sourced HTML.
- **Accessibility:** Side panel keyboard navigable; sufficient contrast; ARIA labels on primary controls.

### Explicit non-goals (v1)

- Auto-posting to Reddit
- Bulk scraping without user navigation
- Team collaboration / cloud sync
- Commercial Reddit API tier / $12k/year data licensing
- Full autonomous agent loop (extension assists human; does not replace lead agent)

---

## 9. MVP scope and non-goals

### Required for v1

- Chrome MV3 extension with side panel
- Content script on `reddit.com`
- Research session model (local storage)
- LLM-powered: pain clustering, blueprint, phase 0 plan, post drafts
- Five seed communities with editable profiles
- Markdown export matching templates
- Convention-aware post draft generator with ethics guardrails

### Required later

- Reddit OAuth + approved API client (search, monitors)
- Firefox build
- Backend proxy for users who won't manage API keys
- Phase 1+ plan generation after verified phase completion
- Community success pattern mining from top posts (API-backed)

### Explicitly excluded

- Chrome Web Store publication in phase 0 (deferred to final phase)
- Paid subscription billing
- Multi-user accounts

---

## 10. System architecture and data model

### Platform choice

**Browser extension (MV3) + local-first storage**, optional thin backend in a later phase for Reddit OAuth proxy and managed LLM.

### Component boundaries

```text
┌─────────────────────────────────────────────────────────────┐
│                     Chrome Extension (MV3)                   │
├──────────────┬──────────────────────┬───────────────────────┤
│ Content      │ Service Worker       │ Side Panel UI         │
│ Script       │ (background)         │ (React or vanilla)    │
│ - DOM parse  │ - Session orchestration│ - Workflow steps    │
│ - Page detect│ - LLM adapter        │ - Export actions      │
│ - Selection  │ - Template engine    │ - Settings            │
└──────┬───────┴──────────┬───────────┴──────────┬──────────┘
       │                  │                      │
       v                  v                      v
  reddit.com         chrome.storage.local    downloads API
  (in-page)          indexedDB (optional)    (markdown export)
                            │
                            v
                     User LLM API (BYOK)
```

### Core entities

| Entity | Key fields | Lifecycle |
|---|---|---|
| `ResearchSession` | id, name, createdAt, subreddits[], status | Created on user action; archived/exported |
| `EvidenceItem` | id, sessionId, redditUrl, subreddit, quote, type, tags[], severity | Pinned from page; immutable source snapshot |
| `CommunityProfile` | subreddit, rulesNotes, tone, postPatterns[], promoPolicy | Seed defaults; user edits |
| `PainTheme` | id, sessionId, title, evidenceIds[], severity, inferenceFlag | LLM-generated; user can edit |
| `Blueprint` | id, sessionId, markdown, version | One per session; regenerable |
| `PhasePlan` | id, sessionId, phaseNumber, markdown, status | Phase 0 in v1; later phases on completion |
| `PostDraft` | id, sessionId, subreddit, archetype, title, body, riskNotes | Three archetypes per community |

### Rejected alternatives

| Alternative | Why rejected for v1 |
|---|---|
| Pure SaaS web app | Loses in-context Reddit browsing; user asked for extension |
| Reddit API first | Approval blocker; DOM path validates UX faster |
| Embed full Cursor agent | Out of scope; extension implements methodology, not IDE agent |
| Single popup UI | Side panel better for multi-step workflow |

---

## 11. Interfaces and integrations

### Internal interfaces

- `ContentScript → Background`: `CAPTURE_PAGE`, `PIN_SELECTION`, `GET_PAGE_CONTEXT`
- `SidePanel → Background`: `RUN_ANALYSIS`, `GENERATE_BLUEPRINT`, `GENERATE_PHASE0`, `GENERATE_POSTS`, `EXPORT_MARKDOWN`
- `Background → LLM Adapter`: `complete({ system, user, schema })` with structured JSON for themes

### External integrations (phased)

| Integration | v1 | Later | Failure mode |
|---|---|---|---|
| Reddit DOM | Yes | Supplement | Show manual paste fallback |
| Reddit Data API OAuth | No | Yes | Queue for human approval phase |
| OpenAI-compatible LLM | Yes (BYOK) | Optional proxy | Disable AI features; view saved data |
| Chrome Web Store | No | Yes | Manual sideload for dev |

### Template engine contract

Templates loaded from packaged assets mirroring:
- `.cursor/templates/phase-plan-template.md`
- STRATEGY.md blueprint section structure
- Post draft scaffold (new template in extension)

---

## 12. Security, privacy, reliability, and compliance considerations

### Threat model (abbreviated)

- **XSS from Reddit content:** Sanitize before render; never `innerHTML` with raw Reddit HTML.
- **API key exfiltration:** Store only in `chrome.storage.local`; never in exported markdown.
- **Prompt injection via Reddit comments:** Treat all Reddit text as untrusted; system prompts enforce structure.
- **Spam facilitation:** Post drafts are suggestions only; ethics guardrails block rule-evasion patterns.

### Privacy

- Local-first default.
- LLM calls send only user-selected evidence snippets, not full browsing history.
- Opt-in analytics only (deferred).

### Compliance

- Reddit Responsible Builder Policy: v1 avoids bulk API access.
- Chrome Web Store policies: single purpose description, privacy policy required at publish time.
- User responsible for LLM provider terms.

---

## 13. Delivery phase map

| Phase | Slug | Purpose |
|---|---|---|
| 0 | foundations | Extension scaffold, repo layout, template engine, control-plane alignment, dev tooling |
| 1 | reddit-capture | Content scripts, page detection, evidence pinning, session storage |
| 2 | discovery-engine | Pain clustering, community profiler, STRATEGY Arm 1 outputs |
| 3 | planning-engine | Blueprint + phase 0 generation, export, PROJECT_PLANNING alignment |
| 4 | post-suggestions | Convention analysis, three archetype drafts, STRATEGY Arm 3 guardrails |
| 5 | hardening-release | OAuth optional path, tests, store assets, privacy policy, final checklist |

**Dependencies:** 0 → 1 → 2 → 3 → 4 → 5 (3 and 4 can overlap after 2 stabilizes)

---

## 14. Cultural go-to-market strategy

### First reachable audience

Indie hackers and solo founders already browsing r/SaaS, r/startups, r/sideproject — especially ex-GummySearch users searching for alternatives.

### Trust-building assets

- Open methodology docs linking to blueprint/plan structure
- Sample exported artifacts (redacted)
- Transparent build journey posts using the product's own output

### Launch sequence

1. Private sideload beta with 10–20 founders
2. Problem-first posts in r/SaaS and r/sideproject (no hard pitch)
3. Resource-value post: "GummySearch replacement workflow" guide with free extension
4. Transparent build journey series

### Reddit hook concepts (not posting-ready spam)

1. **Problem-first:** "How do you go from Reddit thread to actual MVP plan without losing context?"
2. **Transparent build:** "I'm building a browser extension that exports phased plans the way our agent docs specify — here's the methodology."
3. **Resource-value:** "Template pack: blueprint + phase 0 plan structure for Reddit-sourced product research."

### Ethical constraints

- No astroturfing, no unsolicited DMs, no subreddit rule evasion
- Disclose affiliation when sharing the extension
- Post drafts are starting points; user must review subreddit rules

---

## 15. Risks, pivots, and no-build criteria

| Risk | Mitigation | Pivot if realized |
|---|---|---|
| Reddit DOM changes break capture | Resilient selectors + JSON fallback + manual paste | Prioritize API path |
| Reddit API approval denied | DOM-first MVP | Partner proxy or read-only manual mode |
| LLM output ignores templates | Schema-constrained generation + section linter | Template filling hybrid |
| Crowded pain-point market | Emphasize methodology + planning + post drafting | Narrow to "plan exporter" |
| Chrome store rejection | Early policy review in phase 5 | Firefox + GitHub releases |

**No-build criteria:** If DOM capture cannot reliably extract thread context AND API path is blocked AND users reject BYOK LLM setup — pivot to markdown template CLI only.

---

## 16. Sources and research limitations

- GummySearch shutdown and alternative landscape: public competitor pages (Linkeddit, Trend Seeker, Reddinbox, Arieo, PainPointy blogs/comparisons).
- Reddit API constraints: secondary sources (redditapis.com, redaccs.com); verify against official Reddit developer docs before implementation.
- Repository instructions: `.cursor/instructions/STRATEGY.md`, `.cursor/instructions/PROJECT_PLANNING.md`, `.cursor/AGENTS.md`.
- snoowrap: GitHub README (browserify note for browser usage).

---

## 17. Handoff into `phase_0_foundations_plan.md`

Phase 0 must:

1. Scaffold `extension/` MV3 project (TypeScript, Vite or Plasmo, ESLint).
2. Package template assets derived from `.cursor/templates/phase-plan-template.md` and blueprint structure.
3. Establish `docs/decisions/` for architecture choices.
4. Define environment-variable registry (`IMPLEMENTO_LLM_API_KEY` user-local only; no server secrets in v1).
5. Implement foundation only — no Reddit capture or LLM calls until phase 1+.
6. Map phases 1–5 with acceptance criteria inherited from this blueprint.
7. End with standard next-plan generation prompt for `phase_1_reddit-capture_plan.md`.
