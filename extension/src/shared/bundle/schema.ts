import type {
  Blueprint,
  CommunityProfile,
  EvidenceItem,
  PainTheme,
  PhasePlan,
  PostDraft,
  ResearchSession,
} from "../types/domain";

export const BUNDLE_VERSION = 1 as const;

export interface SessionBundleV1 {
  bundleVersion: typeof BUNDLE_VERSION;
  exportedAt: string;
  session: ResearchSession;
  evidence: EvidenceItem[];
  painThemes: PainTheme[];
  communityProfiles: CommunityProfile[];
  blueprint: Blueprint | null;
  phasePlans: PhasePlan[];
  postDrafts: PostDraft[];
}

export interface ImportBundleOptions {
  replaceIfExists: boolean;
}

export class BundleValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BundleValidationError";
  }
}

export function isSessionBundleV1(value: unknown): value is SessionBundleV1 {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    record.bundleVersion === BUNDLE_VERSION &&
    typeof record.exportedAt === "string" &&
    typeof record.session === "object" &&
    Array.isArray(record.evidence) &&
    Array.isArray(record.painThemes) &&
    Array.isArray(record.communityProfiles) &&
    Array.isArray(record.phasePlans) &&
    Array.isArray(record.postDrafts)
  );
}

export function assertNoSecretsInBundleJson(json: string): void {
  const lowered = json.toLowerCase();
  if (lowered.includes("llmapikey") || lowered.includes('"apikey"')) {
    throw new BundleValidationError("Bundle must not contain API keys.");
  }
}
