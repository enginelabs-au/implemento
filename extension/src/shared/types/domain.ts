export type SessionStatus = "draft" | "active" | "archived" | "exported";

export interface ResearchSession {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  subreddits: string[];
  status: SessionStatus;
}

export type EvidenceType = "post" | "comment" | "search_result";

export interface EvidenceItem {
  id: string;
  sessionId: string;
  redditUrl: string;
  subreddit: string;
  quote: string;
  type: EvidenceType;
  tags: string[];
  severity?: number;
  capturedAt: string;
}

export interface CommunityProfile {
  subreddit: string;
  rulesNotes: string;
  tone: string;
  postPatterns: string[];
  promoPolicy: string;
}

export type PainFrequency = "low" | "medium" | "high";

export interface PainTheme {
  id: string;
  sessionId: string;
  title: string;
  summary: string;
  evidenceIds: string[];
  severity: number;
  frequency: PainFrequency;
  inferenceFlag: boolean;
  workaroundPhrases: string[];
  buyerSignals: string[];
}

export interface CommunityProfileSuggestion {
  subreddit: string;
  tone?: string;
  postPatterns?: string[];
  promoPolicy?: string;
  rulesNotes?: string;
}

export interface Blueprint {
  id: string;
  sessionId: string;
  markdown: string;
  version: number;
  createdAt: string;
}

export type PhasePlanStatus = "draft" | "complete";

export interface PhasePlan {
  id: string;
  sessionId: string;
  phaseNumber: number;
  markdown: string;
  status: PhasePlanStatus;
  createdAt: string;
}

export type PostArchetype =
  | "problem-first"
  | "transparent-build"
  | "resource-value";

export type PromoRisk = "low" | "medium" | "high";

export interface PostDraft {
  id: string;
  sessionId: string;
  subreddit: string;
  archetype: PostArchetype;
  title: string;
  body: string;
  riskNotes: string;
  promoRisk: PromoRisk;
}

export interface ImplementoStorageSchema {
  sessions: ResearchSession[];
  evidence: EvidenceItem[];
  communityProfiles: CommunityProfile[];
  painThemes: PainTheme[];
  blueprints: Blueprint[];
  phasePlans: PhasePlan[];
  postDrafts: PostDraft[];
  settings: {
    llmApiUrl?: string;
    llmApiKey?: string;
    llmModel?: string;
    llmTemperature?: number;
    llmHardTaskSpend?: { date: string; usd: number };
    discoveryQuery?: string;
    discoverySubreddits?: string;
    activeSessionId?: string;
  };
}

export const DEFAULT_STORAGE: ImplementoStorageSchema = {
  sessions: [],
  evidence: [],
  communityProfiles: [],
  painThemes: [],
  blueprints: [],
  phasePlans: [],
  postDrafts: [],
  settings: {},
};

export function createResearchSession(name: string): ResearchSession {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    createdAt: now,
    updatedAt: now,
    subreddits: [],
    status: "draft",
  };
}
