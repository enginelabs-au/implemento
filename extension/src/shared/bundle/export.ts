import type { ImplementoStorageSchema } from "../types/domain";
import { BUNDLE_VERSION, type SessionBundleV1 } from "./schema";

export function buildSessionBundle(
  data: ImplementoStorageSchema,
  sessionId: string,
): SessionBundleV1 | null {
  const session = data.sessions.find((item) => item.id === sessionId);
  if (!session) return null;

  const subredditSet = new Set(
    session.subreddits.map((sub) => sub.replace(/^r\//i, "").toLowerCase()),
  );

  const communityProfiles = data.communityProfiles.filter((profile) =>
    subredditSet.has(profile.subreddit.replace(/^r\//i, "").toLowerCase()),
  );

  return {
    bundleVersion: BUNDLE_VERSION,
    exportedAt: new Date().toISOString(),
    session,
    evidence: data.evidence.filter((item) => item.sessionId === sessionId),
    painThemes: data.painThemes.filter((theme) => theme.sessionId === sessionId),
    communityProfiles,
    blueprint: data.blueprints.find((item) => item.sessionId === sessionId) ?? null,
    phasePlans: data.phasePlans.filter((plan) => plan.sessionId === sessionId),
    postDrafts: data.postDrafts.filter((draft) => draft.sessionId === sessionId),
  };
}

export function serializeSessionBundle(bundle: SessionBundleV1): string {
  return JSON.stringify(bundle, null, 2);
}
