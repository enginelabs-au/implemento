---
decision: post-suggestions-architecture
status: accepted
date: 2026-07-11
---

# ADR 0005: Post suggestions architecture

## Context

Phase 4 must complete the core Implemento loop with ethical, community-aware Reddit post drafts. Users have pain themes, blueprints, and community profiles from prior phases. Drafts must follow STRATEGY Arm 3 archetypes without facilitating spam or rule evasion.

## Decision

Use a **per-subreddit LLM pipeline** with post-parse ethics enforcement:

| Layer | Approach |
|---|---|
| Prerequisite | Session blueprint required |
| Input | Blueprint excerpt, pain themes, community profile for target subreddit |
| LLM output | JSON with exactly 3 drafts (one per archetype) |
| Ethics | Static blocklist scan; critical match blocks persist |
| Risk | `promoRisk` from LLM, elevated by ethics scan (never downgraded) |
| Persistence | `replacePostDraftsForSubreddits` for targeted subreddits only |
| Export | `renderPostDraft()` template + side panel download |
| Network | Service worker only; max 3 subreddits per run |

### Archetypes (fixed)

- `problem-first` — pain discussion, no forced pitch
- `transparent-build` — build journey with tradeoffs
- `resource-value` — useful resource, restrained disclosure

### Ethics model

- **Critical patterns** (astroturfing, ban evasion, vote manipulation) → `PostEthicsError`, no persist
- **Warning patterns** (hard sell language) → bump `promoRisk` to at least `medium`
- System prompt forbids unethical tactics; UI shows disclaimer

### Data sent to LLM

Per subreddit: profile fields, theme summaries, truncated blueprint excerpt (~4k chars). Never: API keys, unrelated sessions, full evidence corpus.

## Consequences

### Positive

- Community conventions explicitly injected via profiles
- Safety gate before persistence
- Offline export of saved drafts

### Negative

- Multiple LLM calls for multi-subreddit runs
- No inline editing in v1
- Ethics blocklist may false-positive on educational mentions of banned tactics

## Alternatives considered

| Alternative | Why rejected |
|---|---|
| Single LLM call for all subreddits | Token pressure; weaker per-community adaptation |
| No ethics blocklist | Unacceptable facilitation risk |
| Auto-post to Reddit | Explicit v1 non-goal |

## References

- `docs/plans/phase_4_post-suggestions_plan.md`
- `extension/src/shared/posts/`
- `extension/src/background/handlers/posts.ts`
