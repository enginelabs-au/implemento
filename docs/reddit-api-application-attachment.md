# Implemento — Reddit Data API Application (Non-Devvit)

**Applicant posture:** Option A — personal, non-commercial  
**Repository:** https://github.com/enginelabs-au/implemento  
**Version:** 1.0.0 (Chrome MV3 extension)  
**Date:** 2026-07-13

---

## 1. Summary

Implemento is an **external Chrome browser extension** (not a Devvit/Reddit-hosted app) that helps a single user organize **personal market-research notes** while browsing Reddit manually.

This application requests **read-only** Reddit Data API access via OAuth to enrich research (search, fetch public post/comment metadata). It does **not** operate as an automated bot on the Reddit platform.

---

## 2. Benefit / purpose for Redditors

- **No automated interaction** with other Redditors (no posts, votes, DMs, or follows).
- **Indirect benefit:** helps the applicant research community pain points and norms before contributing manually, supporting more relevant and rule-compliant participation when they choose to post.
- **No change** to other users' Reddit experience; no in-feed app or visible bot account.

---

## 3. What the app does on the Reddit platform

| On Reddit (platform) | External (Chrome extension) |
|---|---|
| No automated posting, commenting, voting, or messaging | User browses Reddit normally |
| No background monitoring bot | User pins evidence from pages they view |
| No subreddit deployment | Optional read-only API calls when user researches |
| No karma or feature manipulation | Local storage of private research notes |

**Planned API use (read-only, user-initiated):**

- Search public posts/comments in subreddits being researched
- Fetch public post/comment metadata for threads the user is already reading
- Low volume, under 100 QPM, OAuth-authenticated

**Will NOT:**

- Bulk export, resale, or redistribution of Reddit data
- Model training on Reddit content
- Inferring sensitive user attributes
- Circumventing rate limits or safety mechanisms

**LLM disclosure:** When the user explicitly clicks "Analyze," short pinned excerpts may be sent to the user's own third-party LLM API (bring-your-own-key) for on-demand summarization only — not training.

---

## 4. Why not Devvit

Devvit is for apps, games, and mod tools **hosted inside Reddit**. Implemento cannot be built on Devvit because:

1. **External browser extension** with side-panel UX across tabs/sessions
2. **Local-first architecture** (`chrome.storage.local`, session JSON bundles)
3. **Personal research workflow** outside Reddit's hosted runtime
4. **BYOK LLM pipeline** in extension service worker (not Devvit execution model)
5. **Not a mod tool** or in-subreddit community utility

---

## 5. Subreddits (personal research)

Primary communities:

- r/SaaS
- r/Entrepreneur
- r/startups
- r/sideproject
- r/indiehackers

Occasional read-only use in other public subreddits when manually researching a specific topic. No automated subreddit-specific bot deployment.

---

## 6. OAuth & technical details

| Item | Value |
|---|---|
| OAuth scopes | `read` (primary); `identity` only if required |
| Rate limit | Designed to stay well under 100 QPM |
| User-Agent | `chrome:implemento:v1.0.0 (by /u/[APPLICANT_USERNAME])` |
| Client secret | Stored on personal backend proxy only — never in extension |
| Data storage | Local browser storage; no public data resale |
| Privacy policy | `docs/privacy-policy.md` in repository |

**Architecture:**

```text
User browser (Chrome)
  └── Implemento extension (side panel, DOM capture, local storage)
        └── Optional: personal OAuth backend proxy
              └── oauth.reddit.com (read-only API)
```

---

## 7. Commercial posture

Personal, non-commercial use. No ads, subscriptions, paywalls, data licensing, or monetization at time of application.

---

## 8. Compliance commitments

- [Responsible Builder Policy](https://support.reddithelp.com/hc/en-us/articles/42728983564564-Responsible-Builder-Policy)
- [Data API Terms](https://redditinc.com/policies/data-api-terms)
- [Data API Wiki](https://support.reddithelp.com/hc/en-us/articles/16160319875092-Reddit-Data-API-Wiki) (User-Agent, rate limits, deletion policy)
- Delete stored Reddit content when deleted on Reddit (48-hour guideline)
- No duplicate or misleading access requests

---

## 9. Links

| Resource | URL |
|---|---|
| Source code | https://github.com/enginelabs-au/implemento |
| Privacy policy (in repo) | https://github.com/enginelabs-au/implemento/blob/main/docs/privacy-policy.md |
| ADR: DOM capture | https://github.com/enginelabs-au/implemento/blob/main/docs/decisions/0002-reddit-dom-capture.md |
| ADR: OAuth deferral | https://github.com/enginelabs-au/implemento/blob/main/docs/decisions/0006-release-architecture.md |

---

## 10. Operating username (optional)

`/u/[APPLICANT_USERNAME]` — personal account for OAuth only; no automated platform actions under this account.
