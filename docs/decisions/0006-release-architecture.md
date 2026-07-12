---
decision: release-architecture
status: accepted
date: 2026-07-11
---

# ADR 0006: Release architecture

## Context

Phases 0–4 delivered the MVP feature loop (capture → discovery → planning → posts). Phase 5 must harden the extension for sideload and Chrome Web Store submission without expanding scope into live OAuth, telemetry, or managed LLM infrastructure.

## Decision

### Session JSON bundle (v1)

| Aspect | Approach |
|---|---|
| Format | `SessionBundleV1` with `bundleVersion: 1` |
| Scope | One research session and related artifacts |
| Included | session, evidence, painThemes, communityProfiles, blueprint, phasePlans, postDrafts |
| Excluded | `settings` (especially `llmApiKey`), unrelated sessions |
| Import | Schema validation, string sanitization, replace-or-new-session option |
| Security | `assertNoSecretsInBundleJson`; no eval; no network from import |

### CI

GitHub Actions runs `npm ci`, `lint`, `typecheck`, `test`, and `build` on push to `main` and on pull requests.

### OAuth (deferred)

v1 ships `oauth-stub.ts` only:

- `getOAuthStatus()` returns `not_configured`
- `OAuthNotConfiguredError` for future enrichment handlers
- Live OAuth requires a backend proxy holding `REDDIT_CLIENT_SECRET` (never in the extension)

### Release boundaries

| In v1 | Post-v1 / human-only |
|---|---|
| DOM capture | Reddit API enrichment |
| BYOK LLM in service worker | Managed LLM proxy |
| Session JSON portability | Encrypted cloud sync |
| Privacy policy + store listing docs | Store submission execution |
| Placeholder icons | Designed marketing assets |
| Phase 0 plan generation | Phase 1+ plan UI |

### Version

Manifest and package version **1.0.0** marks MVP feature-complete per phases 0–4 scope plus phase 5 hardening.

## Consequences

- Users can back up and restore sessions without exposing API keys.
- Store reviewers receive accurate privacy and permission documentation.
- OAuth and Reddit API approval remain checklist items, not blockers for sideload.
- Future OAuth work follows the documented proxy pattern without refactoring capture.

## References

- `docs/plans/phase_5_hardening-release_plan.md`
- `docs/plans/final_implementation_checklist.md`
- `extension/src/shared/bundle/`
- `extension/src/shared/reddit/oauth-stub.ts`
