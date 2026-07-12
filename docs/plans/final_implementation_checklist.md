---
document: final_implementation_checklist
status: open
created: 2026-07-11
updated: 2026-07-11
---

# Final Implementation Checklist

## 1. Completion declaration

- [x] All planned agent-executable phases are implemented (phases 0–5).
- [x] All available automated validation passes (`lint`, `typecheck`, `test`, `build`).
- [ ] Manual full-pipeline E2E on Reddit with live LLM — listed below.

## 2. Outstanding defects or unverified items

| Item | Impact | Evidence/status | Required action | Owner |
|---|---|---|---|---|
| Manual E2E smoke test | Medium — unverified live LLM + Reddit flow | Automated tests pass; no live API run in CI | Run smoke test script (section 6) | Human |
| Designed store icons | Low — sideload works with placeholders | `extension/public/icons/` placeholders | Optional: replace before store publish | Human |
| Privacy policy public URL | High for store publish | `docs/privacy-policy.md` in repo | Host at HTTPS URL for store form | Human |

## 3. Environment variables and secrets still required

Never include secret values.

| Variable name | Provider/source | Destination/environment | Why required | Value supplied? | Validation after supply |
|---|---|---|---|---|---|
| `IMPLEMENTO_LLM_API_URL` (settings UI) | User LLM provider | `chrome.storage.local` | Discovery, planning, posts | User | Test connection in side panel |
| `IMPLEMENTO_LLM_API_KEY` (settings UI) | User LLM provider | `chrome.storage.local` only | LLM authentication | User | Test connection succeeds |
| `IMPLEMENTO_LLM_MODEL` (settings UI) | User preference | `chrome.storage.local` | Model selection | User | Generate discovery/themes |
| `IMPLEMENTO_LLM_TEMPERATURE` | User preference | `chrome.storage.local` | Optional sampling | Optional | N/A |
| `REDDIT_CLIENT_ID` | Reddit developer portal | Backend OAuth (post-v1) | Future Reddit API enrichment | No | N/A in v1 |
| `REDDIT_CLIENT_SECRET` | Reddit developer portal | Backend only (never extension) | OAuth token exchange | No | N/A in v1 |

## 4. Human-only account, permission, billing, or legal actions

| Action | Platform | Reason agent cannot perform | Exact completion evidence |
|---|---|---|---|
| Supply LLM API key | OpenAI / compatible provider | User account and billing | Test connection green in side panel |
| Grant LLM host permission | Chrome | Browser permission dialog | Optional host permission allowed for API origin |
| Chrome Web Store developer account ($5) | Google | Payment and Google account | Developer dashboard access |
| Chrome Web Store submission | Google | Human review process | Published or submitted extension ID |
| Host privacy policy URL | User domain / GitHub Pages | Domain and hosting choice | HTTPS URL entered in store listing |
| Create Reddit API application | Reddit | User account + approval wait | App credentials in developer portal |
| Deploy OAuth backend proxy | User infrastructure | Secrets and hosting | Proxy URL documented for future OAuth |

## 5. Production integrations and dashboard actions

### Deployment

- [ ] Load unpacked `dist/` v1.0.0 locally (immediate — no store required)
- [ ] Optional: submit to Chrome Web Store using `docs/store-listing.md`

### DNS and domains

- [ ] Host `docs/privacy-policy.md` at a public HTTPS URL for store submission

### OAuth and identity providers

- [ ] Register Reddit app when API enrichment is desired (post-v1)
- [ ] Deploy backend proxy per ADR 0006; set `REDDIT_CLIENT_ID` / `REDDIT_CLIENT_SECRET` on server only

### Database and storage

- N/A — local-first `chrome.storage.local` only in v1

### APIs, webhooks, email, payments, analytics, and other providers

- [ ] Configure LLM provider account (BYOK)
- No telemetry, payments, or webhooks in v1

## 6. Final smoke tests after manual actions

- [ ] Load unpacked `dist/` v1.0.0 in Chrome
- [ ] Configure LLM → grant host permission → **Test connection** succeeds
- [ ] Create session → open Reddit post → pin evidence
- [ ] **Analyze session** → pain themes appear
- [ ] **Generate blueprint** → **Generate phase 0** → export markdown
- [ ] **Generate post drafts** for 1–3 subreddits → review risk badges
- [ ] **Export session bundle** JSON → clear storage or new profile → **Import bundle** → evidence count restored
- [ ] Confirm exported JSON contains no `llmApiKey`

## 7. Final evidence

| Area | Evidence |
|---|---|
| Phase plans | `docs/plans/phase_0_foundations_plan.md` through `phase_5_hardening-release_plan.md` (complete) |
| ADRs | `docs/decisions/0001`–`0006` |
| Build | `npm run build` → `dist/` v1.0.0 |
| Tests | `npm run test` — unit + bundle + pipeline + prerequisite integration |
| CI | `.github/workflows/ci.yml` |
| Privacy | `docs/privacy-policy.md` |
| Store copy | `docs/store-listing.md` |
| Bundle | `extension/src/shared/bundle/` export/import round-trip tests |
| OAuth stub | `extension/src/shared/reddit/oauth-stub.ts` |

**Validation commands:**

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```
