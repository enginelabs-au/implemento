---
decision: reddit-dom-capture
status: accepted
date: 2026-07-11
---

# ADR 0002: Reddit DOM-first capture strategy

## Context

Phase 1 must capture Reddit market-research evidence in-browser without Reddit API OAuth approval, bulk scraping, or external servers. Users browse Reddit directly; the extension extracts context from the active tab and pins evidence into local research sessions.

## Decision

Use a **DOM-first capture pipeline**:

| Layer | Approach |
|---|---|
| Page detection | URL patterns in `page-detector.ts` |
| Parsing | Shreddit-oriented selectors in `shared/reddit/parsers/*` |
| Testing | `happy-dom` + HTML fixtures (no live Reddit in CI) |
| Text safety | `textContent` extraction + `sanitizeText()` before storage/render |
| JSON fallback | Optional same-origin `*.json` fetch on user-triggered capture for incomplete post bodies |
| Messaging | Side panel → service worker → content script (`tabs` permission) |
| Persistence | Service worker writes evidence via storage adapter |

### Parser boundaries

- **Post:** title, body, author, score, flair, permalink, up to 20 visible comments
- **Subreddit:** name, title, description, subscriber count (best effort)
- **Search:** query param + up to 10 visible result snippets
- **Profile:** username + karma (read-only, best effort)

### Explicit limits

- No infinite comment loading
- No OAuth Reddit Data API
- No background crawl; user must navigate
- Manual paste fallback always available

## Consequences

### Positive

- Works without Reddit developer app approval
- Parsers unit-testable with fixtures
- Aligns with blueprint privacy posture (local-first)
- Content script stays thin; logic reusable in tests

### Negative

- Breaks when Reddit changes shreddit DOM
- Partial comment capture on long threads
- JSON fallback may return 403/rate limits on some pages

## Rejected alternatives

| Alternative | Reason |
|---|---|
| Reddit API first | Approval friction and commercial tier risk |
| Scrape old.reddit only | Users primarily on new Reddit |
| Side panel DOM access | Impossible under MV3 isolation |
| Auto-capture on navigation | Violates explicit user intent assumption |

## Follow-ups

- Phase 2: cluster pinned evidence with LLM
- Phase 5: optional OAuth for search/monitoring enrichment
