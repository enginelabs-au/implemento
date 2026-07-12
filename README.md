# Implemento

Reddit-native browser extension for market problem discovery, solution planning, and community-appropriate post suggestions — built on the [implemento agent control plane](.cursor/AGENTS.md) methodology.

**Blueprint:** [docs/blueprints/2026-07-11_implemento.md](docs/blueprints/2026-07-11_implemento.md)  
**Privacy:** [docs/privacy-policy.md](docs/privacy-policy.md)  
**Remaining human actions:** [docs/plans/final_implementation_checklist.md](docs/plans/final_implementation_checklist.md)

## What it does

Implemento turns Reddit research into durable artifacts that match the control-plane workflow:

1. **Capture** pain evidence from Reddit
2. **Discover** recurring market problems
3. **Plan** blueprints and sequential phase plans
4. **Draft** ethical, convention-aware posts
5. **Export** markdown artifacts and JSON session bundles

## Full workflow (v1.0.0)

1. Load unpacked `dist/` in Chrome
2. Configure LLM settings (API URL, key, model) → grant host permission → test connection
3. Create a research session
4. On Reddit, pin posts, selections, or comments as evidence
5. Run **Analyze session** in Discovery
6. Generate **blueprint** and **phase 0** plan in Planning; export markdown
7. Generate **post drafts** for target subreddits; review promotional risk
8. **Export session bundle** (JSON) for backup; **import** to restore on another profile

API keys stay in `chrome.storage.local` only. They are never included in exports or session bundles.

## Development

### Prerequisites

- Node.js 20+
- Google Chrome

### Setup

```bash
npm install
npm run build
```

### Load unpacked in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `dist/` directory at the repository root

### Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Typecheck + production build to `dist/` |
| `npm run test` | Vitest unit and integration tests |
| `npm run lint` | ESLint on `extension/src` |
| `npm run typecheck` | TypeScript strict check |

CI runs the same validation on push/PR via `.github/workflows/ci.yml`.

### Capture evidence on Reddit

1. Open any `reddit.com` page and the Implemento side panel
2. Create or select a research session
3. **Refresh page context** — page type, subreddit, and title appear
4. **Pin post**, **Pin selection**, or **Pin comment** on visible content
5. Use **Manual paste fallback** if DOM parsing fails

### Configure LLM and run discovery

1. Enter OpenAI-compatible **API URL**, **API key**, and **model** in Settings
2. **Save settings** and allow Chrome host permission for your API origin
3. **Test connection**
4. Pin evidence, then **Analyze session** in Discovery

### Planning and post drafts

1. **Generate blueprint** after pain themes exist
2. **Generate phase 0** after blueprint exists
3. Export markdown artifacts for your `docs/` workspace
4. **Generate post drafts** after blueprint exists; select up to 3 subreddits
5. Review risk badges and subreddit rules before posting

### Session bundle portability

1. Open **Data & portability** in the side panel
2. **Export session bundle** — downloads `implemento-session_<slug>_<date>.json`
3. **Import session bundle** — choose file; confirm to replace existing session ID or import as new

## Troubleshooting

| Issue | Likely cause | Fix |
|---|---|---|
| LLM test fails / permission denied | Host permission not granted | Re-save settings; allow optional host permission for API origin |
| Page context empty | Not on Reddit or tab inactive | Open a `reddit.com` post; click Refresh page context |
| Discovery blocked | No evidence or LLM not configured | Pin evidence; configure and test LLM |
| Blueprint blocked | No pain themes | Run discovery first |
| Post drafts blocked | No blueprint | Generate blueprint first |
| Ethics block on drafts | Critical promotional pattern | Edit draft approach; drafts are suggestions only |
| Import fails | Invalid or wrong bundle version | Export fresh bundle from v1.0.0; check JSON is valid |

## Repository layout

```text
extension/          Chrome MV3 extension source
docs/               Blueprints, plans, decisions, privacy policy
.cursor/            Agent control plane (methodology source)
```

## Methodology alignment

This product implements the instruction files under `.cursor/instructions/`:

- `STRATEGY.md` — discovery, synthesis, cultural GTM
- `PROJECT_PLANNING.md` — sequential phased plans
- `AGENTS.md` — operating contract and file roles

Exported markdown is designed to drop into `docs/blueprints/` and `docs/plans/` in any implemento workspace.

## Status

**v1.0.0 — MVP feature-complete (sideload-ready)**

- Phase 0: foundation ✓
- Phase 1: Reddit capture ✓
- Phase 2: discovery engine ✓
- Phase 3: planning engine ✓
- Phase 4: post suggestions ✓
- Phase 5: hardening & release ✓

Chrome Web Store submission and live OAuth remain in [final_implementation_checklist.md](docs/plans/final_implementation_checklist.md).
