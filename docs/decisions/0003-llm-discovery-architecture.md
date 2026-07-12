---
decision: llm-discovery-architecture
status: accepted
date: 2026-07-11
---

# ADR 0003: LLM discovery architecture

## Context

Phase 2 must cluster pinned Reddit evidence into ranked pain themes and maintain community profiles. Users bring their own LLM credentials (BYOK) to an OpenAI-compatible endpoint. The extension must keep API keys local, minimize data sent to providers, and remain usable when LLM is not configured.

## Decision

Use a **service-worker LLM pipeline** with structured JSON discovery output:

| Layer | Approach |
|---|---|
| Credentials | `chrome.storage.local` via settings UI (`llmApiUrl`, `llmApiKey`, `llmModel`, `llmTemperature`) |
| Network | `fetch` from service worker only (`openai-client.ts` → `POST /chat/completions`) |
| Permissions | `optional_host_permissions`; request `${apiOrigin}/*` on settings save |
| Discovery | `RUN_DISCOVERY` loads session evidence + profiles, builds prompt, parses JSON → `PainTheme[]` |
| Persistence | `replacePainThemes(sessionId, themes)` on each run; seed `CommunityProfile[]` on install |
| UI | Side panel settings + discovery; no direct LLM fetch from panel (CSP) |

### Data sent to LLM

Only user-initiated discovery runs send:

- Active session name
- Up to 30 evidence items (id, subreddit, type, truncated quote ≤ 500 chars)
- Community profile summaries (subreddit, tone, patterns)

Never sent: API keys, full page HTML, unrelated tabs, browsing history.

### Output contract

LLM returns JSON with `themes[]` and optional `communitySuggestions[]`. Parser validates severity 1–10, frequency enum, and evidence ID references. Themes without valid evidence IDs are rejected. `inferenceFlag` distinguishes direct evidence from inference.

### Security and privacy

- `GET_SETTINGS` returns public settings only — API key never exposed to side panel or exports
- Evidence text treated as untrusted input; system prompt enforces JSON-only output
- One JSON repair retry on parse failure
- Community profile suggestions require explicit user accept (`APPLY_PROFILE_SUGGESTION`)

## Consequences

### Positive

- Works with OpenAI, OpenRouter, LM Studio, and other compatible endpoints
- Capture workflow unaffected when LLM is not configured
- Pain themes and profiles persist offline after discovery

### Negative

- User must grant host permission for their API origin
- Long LLM calls may hit MV3 service worker lifetime limits (mitigated by side-panel progress UI)
- No streaming; user waits for full response

## Alternatives considered

| Alternative | Why rejected |
|---|---|
| Side panel `fetch` to LLM | Blocked by extension CSP for arbitrary hosts |
| Managed proxy backend | Out of scope; adds ops cost and privacy surface |
| Markdown LLM output | Harder to parse reliably into `PainTheme[]` |
| Auto-run on every pin | Token cost and noise; user should control analysis |

## References

- `docs/plans/phase_2_discovery-engine_plan.md`
- `extension/src/shared/llm/openai-client.ts`
- `extension/src/shared/discovery/prompt.ts`
- `extension/src/background/handlers/discovery.ts`
