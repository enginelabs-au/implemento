# Chrome Web Store Listing — Implemento

**Target version:** 1.0.0  
**Category suggestion:** Productivity

## Short description

Reddit-native market discovery, phased planning, and ethical post draft suggestions — local-first, BYOK LLM.

## Detailed description

Implemento helps founders and builders turn Reddit research into actionable artifacts:

1. **Capture** pain evidence from posts, comments, and selections
2. **Discover** recurring market problems with LLM-assisted theme extraction
3. **Plan** strategy blueprints and phase 0 foundation plans
4. **Draft** community-appropriate Reddit posts with promotional risk notes

All research data stays in your browser. LLM features use your own API key and only run when you click generate/analyze. Export markdown plans or JSON session bundles for your workspace.

**Important:** Post drafts are suggestions only. Always review subreddit rules before posting.

## Privacy policy URL

Host `docs/privacy-policy.md` at a public URL before submission (see `docs/plans/final_implementation_checklist.md`).

## Permissions justification

| Permission | User-facing justification |
|---|---|
| `storage` | Save research sessions, evidence, and generated plans locally |
| `sidePanel` | Side panel workflow for capture and generation |
| `tabs` | Detect the active Reddit tab for page context |
| Host: `https://*.reddit.com/*` | Read Reddit page content you are viewing for evidence capture |
| Optional host: `https://*/*`, `http://*/*` | Connect to your chosen LLM API endpoint after you configure settings |

## Data handling (store questionnaire)

- **Collects data:** No server-side collection; local storage only
- **Sells data:** No
- **Uses data for unrelated purposes:** No
- **Single purpose:** Reddit research → planning artifacts

## Screenshots (suggested)

1. Side panel — session + evidence capture on a Reddit thread
2. Discovery — pain themes list
3. Planning — blueprint and phase 0 export
4. Post drafts — archetypes with risk badges
5. Settings — BYOK LLM configuration

## Icons

Placeholder icons ship in `extension/public/icons/`. Designed 128×128 marketing icon recommended for store polish (optional for sideload).

## Single purpose statement

Implemento assists users in researching market problems on Reddit and producing structured planning and draft-post artifacts from that research.
