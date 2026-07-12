---
decision: extension-stack
status: accepted
date: 2026-07-11
---

# ADR 0001: Browser extension stack for Implemento

## Context

Implemento is a Reddit-native workflow tool that must run in-context while users browse, produce markdown artifacts aligned with the implemento control plane, and stay local-first for privacy. Phase 0 requires a loadable foundation without Reddit capture or LLM integration.

## Decision

Use **Chrome Manifest V3** with:

| Layer | Choice |
|---|---|
| Language | TypeScript (strict) |
| Bundler | Vite 6 |
| Extension plugin | `@crxjs/vite-plugin` |
| Primary UI | Chrome Side Panel API |
| Storage | `chrome.storage.local` via typed adapter |
| Tests | Vitest (Node) for shared modules |
| Lint | ESLint 9 flat config + typescript-eslint |

Domain logic lives in `extension/src/shared/` and is testable without a browser. Chrome APIs are bound in thin modules (`browser-storage.ts`, service worker, side panel entry).

Templates are packaged as static assets under `extension/src/shared/templates/assets/`, derived from `.cursor/templates/phase-plan-template.md` and `STRATEGY.md` blueprint sections.

## Consequences

### Positive

- Fast dev loop with Vite HMR
- MV3 aligns with Chrome Web Store requirements
- Side panel supports multi-step workflow better than popup
- Shared modules testable in Node without Puppeteer for phase 0

### Negative

- MV3 service worker is event-driven; long-running tasks need offscreen docs later
- CRXJS beta plugin may require manifest path conventions
- `chrome.storage` requires mocks in unit tests

## Rejected alternatives

| Alternative | Reason |
|---|---|
| Plasmo | Additional abstraction; Vite+CRXJS sufficient for control |
| Pure SaaS web app | Loses in-context Reddit workflow |
| Firefox first | Chrome MV3 is v1 target per blueprint |
| Embed Reddit API secret in extension | Security violation; deferred to backend OAuth proxy |
| Popup-only UI | Too cramped for blueprint/plan/draft workflow |

## Follow-ups

- Phase 1: content scripts + message passing to background
- Phase 2: LLM adapter implementation with user-supplied API key in storage
- Phase 5: optional backend for Reddit OAuth secret handling
