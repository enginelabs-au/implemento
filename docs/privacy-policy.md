# Implemento Privacy Policy

**Last updated:** 2026-07-11  
**Version:** 1.0.0

Implemento is a Chrome browser extension for Reddit-native market discovery, planning, and post draft suggestions. This policy describes how the extension handles data.

## Summary

- Data is stored **locally** in your browser (`chrome.storage.local`).
- **No telemetry** is collected in v1.
- **No account** is required to use Implemento.
- LLM calls are **user-initiated** and use your **bring-your-own-key (BYOK)** credentials.
- Reddit content is read from pages you visit; the extension does not post on your behalf.

## Data we store locally

| Data | Purpose | Location |
|---|---|---|
| Research sessions | Organize evidence and artifacts | `chrome.storage.local` |
| Pinned evidence | Quotes and metadata from Reddit | `chrome.storage.local` |
| Pain themes, profiles, blueprints, plans, drafts | Discovery and planning outputs | `chrome.storage.local` |
| LLM settings (URL, model, API key) | User-configured AI provider access | `chrome.storage.local` only |

API keys are **never** included in markdown exports or JSON session bundles.

## Data sent to third parties

Implemento sends data to third parties **only when you take an explicit action**:

| Action | Recipient | Data sent |
|---|---|---|
| Test LLM connection | Your configured LLM API host | Minimal test prompt |
| Run discovery / planning / post drafts | Your configured LLM API host | Session excerpts (evidence, themes, blueprint, profiles) needed for generation |

You choose the LLM provider and grant host permission in Chrome. Implemento does not operate a backend proxy for LLM requests in v1.

## Reddit data

On `reddit.com` pages you open, the extension:

- Reads visible page content via a content script (DOM parsing)
- Does **not** authenticate to Reddit
- Does **not** post, vote, or message on your behalf
- Does **not** scrape beyond the active tab context you use with the side panel

## Session bundle export/import

You may export a session as JSON for backup or transfer. Bundles contain research artifacts only — not API keys or unrelated sessions. Import validates schema version 1 and sanitizes text fields.

## Permissions

| Permission | Why |
|---|---|
| `storage` | Persist sessions and artifacts locally |
| `sidePanel` | Research workflow UI |
| `tabs` | Read active Reddit tab context |
| `https://*.reddit.com/*` | Content script on Reddit |
| `optional_host_permissions` (`https://*/*`, `http://*/*`) | User-granted access to LLM API origin only when configured |

## Children's privacy

Implemento is not directed at children under 13 and does not knowingly collect personal information from children.

## Changes

Material changes to this policy will be reflected in the repository and store listing before publication updates.

## Contact

For privacy questions about this open-source project, open an issue in the project repository.
