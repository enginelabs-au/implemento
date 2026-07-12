import { sanitizeText } from "../reddit/sanitize";
import type { ImplementoStorageSchema } from "../types/domain";
import {
  BundleValidationError,
  isSessionBundleV1,
  type ImportBundleOptions,
  type SessionBundleV1,
} from "./schema";

function sanitizeBundle(bundle: SessionBundleV1): SessionBundleV1 {
  return {
    ...bundle,
    session: {
      ...bundle.session,
      name: sanitizeText(bundle.session.name),
      subreddits: bundle.session.subreddits.map((sub) =>
        sanitizeText(sub.replace(/^r\//i, "")),
      ),
    },
    evidence: bundle.evidence.map((item) => ({
      ...item,
      quote: sanitizeText(item.quote),
      subreddit: sanitizeText(item.subreddit.replace(/^r\//i, "")),
      redditUrl: sanitizeText(item.redditUrl),
      tags: item.tags.map((tag) => sanitizeText(tag)),
    })),
    painThemes: bundle.painThemes.map((theme) => ({
      ...theme,
      title: sanitizeText(theme.title),
      summary: sanitizeText(theme.summary),
      workaroundPhrases: theme.workaroundPhrases.map((p) => sanitizeText(p)),
      buyerSignals: theme.buyerSignals.map((p) => sanitizeText(p)),
    })),
    communityProfiles: bundle.communityProfiles.map((profile) => ({
      ...profile,
      subreddit: sanitizeText(profile.subreddit.replace(/^r\//i, "")),
      tone: sanitizeText(profile.tone),
      rulesNotes: sanitizeText(profile.rulesNotes),
      promoPolicy: sanitizeText(profile.promoPolicy),
      postPatterns: profile.postPatterns.map((p) => sanitizeText(p)),
    })),
    blueprint: bundle.blueprint
      ? { ...bundle.blueprint, markdown: sanitizeText(bundle.blueprint.markdown) }
      : null,
    phasePlans: bundle.phasePlans.map((plan) => ({
      ...plan,
      markdown: sanitizeText(plan.markdown),
    })),
    postDrafts: bundle.postDrafts.map((draft) => ({
      ...draft,
      subreddit: sanitizeText(draft.subreddit.replace(/^r\//i, "")),
      title: sanitizeText(draft.title),
      body: sanitizeText(draft.body),
      riskNotes: sanitizeText(draft.riskNotes),
    })),
  };
}

function removeSessionArtifacts(data: ImplementoStorageSchema, sessionId: string): void {
  data.sessions = data.sessions.filter((s) => s.id !== sessionId);
  data.evidence = data.evidence.filter((e) => e.sessionId !== sessionId);
  data.painThemes = data.painThemes.filter((t) => t.sessionId !== sessionId);
  data.blueprints = data.blueprints.filter((b) => b.sessionId !== sessionId);
  data.phasePlans = data.phasePlans.filter((p) => p.sessionId !== sessionId);
  data.postDrafts = data.postDrafts.filter((d) => d.sessionId !== sessionId);
}

function remapSessionIds(bundle: SessionBundleV1, newSessionId: string): SessionBundleV1 {
  const session = { ...bundle.session, id: newSessionId };
  return {
    ...bundle,
    session,
    evidence: bundle.evidence.map((item) => ({ ...item, sessionId: newSessionId })),
    painThemes: bundle.painThemes.map((item) => ({ ...item, sessionId: newSessionId })),
    blueprint: bundle.blueprint
      ? { ...bundle.blueprint, sessionId: newSessionId, id: crypto.randomUUID() }
      : null,
    phasePlans: bundle.phasePlans.map((item) => ({
      ...item,
      sessionId: newSessionId,
      id: crypto.randomUUID(),
    })),
    postDrafts: bundle.postDrafts.map((item) => ({
      ...item,
      sessionId: newSessionId,
      id: crypto.randomUUID(),
    })),
  };
}

export function parseSessionBundleJson(raw: string): SessionBundleV1 {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new BundleValidationError("Bundle file is not valid JSON.");
  }
  if (!isSessionBundleV1(parsed)) {
    throw new BundleValidationError("Unsupported or invalid bundle schema.");
  }
  return sanitizeBundle(parsed);
}

export function applySessionBundleImport(
  data: ImplementoStorageSchema,
  bundle: SessionBundleV1,
  options: ImportBundleOptions,
): { sessionId: string; replaced: boolean } {
  const sanitized = sanitizeBundle(bundle);
  const existing = data.sessions.some((s) => s.id === sanitized.session.id);

  if (existing && !options.replaceIfExists) {
    const newSessionId = crypto.randomUUID();
    const remapped = remapSessionIds(sanitized, newSessionId);
    mergeBundleIntoStorage(data, remapped);
    data.settings.activeSessionId = newSessionId;
    return { sessionId: newSessionId, replaced: false };
  }

  if (existing && options.replaceIfExists) {
    removeSessionArtifacts(data, sanitized.session.id);
  }

  mergeBundleIntoStorage(data, sanitized);
  data.settings.activeSessionId = sanitized.session.id;
  return { sessionId: sanitized.session.id, replaced: existing };
}

function mergeBundleIntoStorage(data: ImplementoStorageSchema, bundle: SessionBundleV1): void {
  data.sessions.push(bundle.session);
  data.evidence.push(...bundle.evidence);
  data.painThemes.push(...bundle.painThemes);
  data.phasePlans.push(...bundle.phasePlans);
  data.postDrafts.push(...bundle.postDrafts);
  if (bundle.blueprint) data.blueprints.push(bundle.blueprint);

  for (const profile of bundle.communityProfiles) {
    const normalized = profile.subreddit.replace(/^r\//i, "");
    const index = data.communityProfiles.findIndex(
      (item) => item.subreddit.replace(/^r\//i, "") === normalized,
    );
    const next = { ...profile, subreddit: normalized };
    if (index >= 0) data.communityProfiles[index] = next;
    else data.communityProfiles.push(next);
  }
}
