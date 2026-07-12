import {
  type Blueprint,
  type CommunityProfile,
  type EvidenceItem,
  type ImplementoStorageSchema,
  type PainTheme,
  type PhasePlan,
  type PhasePlanStatus,
  type PostDraft,
  type ResearchSession,
  createResearchSession,
} from "../types/domain";
import { evidenceDedupeKey } from "../reddit/sanitize";
import { SEED_COMMUNITY_PROFILES } from "../discovery/seed-profiles";
import type { SaveSettingsInput } from "../llm/llm-adapter";
import { toPublicSettings, type PublicLlmSettings } from "../llm/llm-adapter";

export interface StorageAdapter {
  getAll(): Promise<ImplementoStorageSchema>;
  setAll(data: ImplementoStorageSchema): Promise<void>;
  getSessions(): Promise<ResearchSession[]>;
  upsertSession(session: ResearchSession): Promise<void>;
  getActiveSessionId(): Promise<string | null>;
  setActiveSessionId(sessionId: string | null): Promise<void>;
  addEvidence(
    item: Omit<EvidenceItem, "id" | "capturedAt"> & { id?: string },
  ): Promise<{ evidence: EvidenceItem; duplicate: boolean }>;
  listEvidence(sessionId: string): Promise<EvidenceItem[]>;
  removeEvidence(evidenceId: string): Promise<boolean>;
  createSession(name: string): Promise<ResearchSession>;
  ensureSeedProfiles(): Promise<void>;
  listCommunityProfiles(): Promise<CommunityProfile[]>;
  upsertCommunityProfile(profile: CommunityProfile): Promise<void>;
  listPainThemes(sessionId: string): Promise<PainTheme[]>;
  replacePainThemes(sessionId: string, themes: PainTheme[]): Promise<void>;
  getBlueprint(sessionId: string): Promise<Blueprint | null>;
  upsertBlueprint(sessionId: string, markdown: string): Promise<Blueprint>;
  getPhasePlan(sessionId: string, phaseNumber: number): Promise<PhasePlan | null>;
  upsertPhasePlan(
    sessionId: string,
    phaseNumber: number,
    markdown: string,
    status?: PhasePlanStatus,
  ): Promise<PhasePlan>;
  markPhasePlanStatus(
    sessionId: string,
    phaseNumber: number,
    status: PhasePlanStatus,
  ): Promise<PhasePlan | null>;
  listPostDrafts(sessionId: string): Promise<PostDraft[]>;
  replacePostDraftsForSubreddits(
    sessionId: string,
    subreddits: string[],
    drafts: PostDraft[],
  ): Promise<void>;
  getPublicSettings(): Promise<PublicLlmSettings>;
  saveSettings(input: SaveSettingsInput): Promise<PublicLlmSettings>;
  getLlmSettingsForWorker(): Promise<ImplementoStorageSchema["settings"]>;
  getHardTaskSpend(): Promise<{ date: string; usd: number } | undefined>;
  setHardTaskSpend(state: { date: string; usd: number }): Promise<void>;
}

type ChromeStorageLocal = {
  get(keys: string | string[] | null): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
};

const STORAGE_KEY = "implemento_data";

function isStorageSchema(value: unknown): value is ImplementoStorageSchema {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    Array.isArray(record.sessions) &&
    Array.isArray(record.evidence) &&
    Array.isArray(record.communityProfiles) &&
    typeof record.settings === "object"
  );
}

export function mergeWithDefaults(
  partial: Partial<ImplementoStorageSchema> | null | undefined,
): ImplementoStorageSchema {
  if (!partial) {
    return {
      sessions: [],
      evidence: [],
      communityProfiles: [],
      painThemes: [],
      blueprints: [],
      phasePlans: [],
      postDrafts: [],
      settings: {},
    };
  }
  return {
    sessions: [...(partial.sessions ?? [])],
    evidence: [...(partial.evidence ?? [])],
    communityProfiles: [...(partial.communityProfiles ?? [])],
    painThemes: [...(partial.painThemes ?? [])],
    blueprints: [...(partial.blueprints ?? [])],
    phasePlans: [...(partial.phasePlans ?? [])],
    postDrafts: [...(partial.postDrafts ?? [])],
    settings: { ...(partial.settings ?? {}) },
  };
}

function trackSubredditOnSession(
  data: ImplementoStorageSchema,
  sessionId: string,
  subreddit: string,
): void {
  if (!subreddit) return;
  const session = data.sessions.find((s) => s.id === sessionId);
  if (!session) return;
  const normalized = subreddit.replace(/^r\//i, "");
  if (!session.subreddits.includes(normalized)) {
    session.subreddits.push(normalized);
    session.updatedAt = new Date().toISOString();
  }
}

export function createStorageAdapter(
  storage: ChromeStorageLocal,
): StorageAdapter {
  async function read(): Promise<ImplementoStorageSchema> {
    const result = await storage.get(STORAGE_KEY);
    const raw = result[STORAGE_KEY];
    if (isStorageSchema(raw)) return mergeWithDefaults(raw);
    return mergeWithDefaults(null);
  }

  async function write(data: ImplementoStorageSchema): Promise<void> {
    await storage.set({ [STORAGE_KEY]: data });
  }

  return {
    async getAll() {
      return read();
    },
    async setAll(data) {
      await write(data);
    },
    async getSessions() {
      const data = await read();
      return data.sessions;
    },
    async upsertSession(session) {
      const data = await read();
      const index = data.sessions.findIndex((s) => s.id === session.id);
      if (index >= 0) {
        data.sessions[index] = session;
      } else {
        data.sessions.push(session);
      }
      await write(data);
    },
    async getActiveSessionId() {
      const data = await read();
      return data.settings.activeSessionId ?? null;
    },
    async setActiveSessionId(sessionId) {
      const data = await read();
      data.settings.activeSessionId = sessionId ?? undefined;
      await write(data);
    },
    async addEvidence(item) {
      const data = await read();
      const key = evidenceDedupeKey(item.sessionId, item.redditUrl, item.quote);
      const existing = data.evidence.find(
        (e) => evidenceDedupeKey(e.sessionId, e.redditUrl, e.quote) === key,
      );
      if (existing) {
        return { evidence: existing, duplicate: true };
      }

      const evidence: EvidenceItem = {
        id: item.id ?? crypto.randomUUID(),
        sessionId: item.sessionId,
        redditUrl: item.redditUrl,
        subreddit: item.subreddit.replace(/^r\//i, ""),
        quote: item.quote,
        type: item.type,
        tags: item.tags ?? [],
        severity: item.severity,
        capturedAt: new Date().toISOString(),
      };

      data.evidence.push(evidence);
      trackSubredditOnSession(data, evidence.sessionId, evidence.subreddit);
      await write(data);
      return { evidence, duplicate: false };
    },
    async listEvidence(sessionId) {
      const data = await read();
      return data.evidence.filter((e) => e.sessionId === sessionId);
    },
    async removeEvidence(evidenceId) {
      const data = await read();
      const before = data.evidence.length;
      data.evidence = data.evidence.filter((e) => e.id !== evidenceId);
      if (data.evidence.length === before) return false;
      await write(data);
      return true;
    },
    async createSession(name) {
      const session = createResearchSession(name);
      session.status = "active";
      const data = await read();
      data.sessions.push(session);
      data.settings.activeSessionId = session.id;
      await write(data);
      return session;
    },
    async ensureSeedProfiles() {
      const data = await read();
      if (data.communityProfiles.length > 0) return;
      data.communityProfiles = SEED_COMMUNITY_PROFILES.map((profile) => ({ ...profile }));
      await write(data);
    },
    async listCommunityProfiles() {
      const data = await read();
      return data.communityProfiles;
    },
    async upsertCommunityProfile(profile) {
      const data = await read();
      const normalized = profile.subreddit.replace(/^r\//i, "");
      const index = data.communityProfiles.findIndex(
        (item) => item.subreddit.replace(/^r\//i, "") === normalized,
      );
      const next = { ...profile, subreddit: normalized };
      if (index >= 0) data.communityProfiles[index] = next;
      else data.communityProfiles.push(next);
      await write(data);
    },
    async listPainThemes(sessionId) {
      const data = await read();
      return data.painThemes.filter((theme) => theme.sessionId === sessionId);
    },
    async replacePainThemes(sessionId, themes) {
      const data = await read();
      data.painThemes = [
        ...data.painThemes.filter((theme) => theme.sessionId !== sessionId),
        ...themes,
      ];
      await write(data);
    },
    async getBlueprint(sessionId) {
      const data = await read();
      return data.blueprints.find((item) => item.sessionId === sessionId) ?? null;
    },
    async upsertBlueprint(sessionId, markdown) {
      const data = await read();
      const existing = data.blueprints.find((item) => item.sessionId === sessionId);
      const now = new Date().toISOString();
      const blueprint: Blueprint = {
        id: existing?.id ?? crypto.randomUUID(),
        sessionId,
        markdown,
        version: (existing?.version ?? 0) + 1,
        createdAt: existing?.createdAt ?? now,
      };
      data.blueprints = [
        ...data.blueprints.filter((item) => item.sessionId !== sessionId),
        blueprint,
      ];
      await write(data);
      return blueprint;
    },
    async getPhasePlan(sessionId, phaseNumber) {
      const data = await read();
      return (
        data.phasePlans.find(
          (item) => item.sessionId === sessionId && item.phaseNumber === phaseNumber,
        ) ?? null
      );
    },
    async upsertPhasePlan(sessionId, phaseNumber, markdown, status = "draft") {
      const data = await read();
      const existing = data.phasePlans.find(
        (item) => item.sessionId === sessionId && item.phaseNumber === phaseNumber,
      );
      const now = new Date().toISOString();
      const plan: PhasePlan = {
        id: existing?.id ?? crypto.randomUUID(),
        sessionId,
        phaseNumber,
        markdown,
        status: existing?.status === "complete" ? existing.status : status,
        createdAt: existing?.createdAt ?? now,
      };
      data.phasePlans = [
        ...data.phasePlans.filter(
          (item) => !(item.sessionId === sessionId && item.phaseNumber === phaseNumber),
        ),
        plan,
      ];
      await write(data);
      return plan;
    },
    async markPhasePlanStatus(sessionId, phaseNumber, status) {
      const data = await read();
      const existing = data.phasePlans.find(
        (item) => item.sessionId === sessionId && item.phaseNumber === phaseNumber,
      );
      if (!existing) return null;
      existing.status = status;
      await write(data);
      return existing;
    },
    async listPostDrafts(sessionId) {
      const data = await read();
      return data.postDrafts.filter((draft) => draft.sessionId === sessionId);
    },
    async replacePostDraftsForSubreddits(sessionId, subreddits, drafts) {
      const data = await read();
      const normalized = new Set(
        subreddits.map((sub) => sub.replace(/^r\//i, "").toLowerCase()),
      );
      data.postDrafts = [
        ...data.postDrafts.filter(
          (draft) =>
            !(
              draft.sessionId === sessionId &&
              normalized.has(draft.subreddit.replace(/^r\//i, "").toLowerCase())
            ),
        ),
        ...drafts,
      ];
      await write(data);
    },
    async getPublicSettings() {
      const data = await read();
      return toPublicSettings(data.settings);
    },
    async saveSettings(input) {
      const data = await read();
      data.settings.llmModel = input.model.trim();
      await write(data);
      return toPublicSettings(data.settings);
    },
    async getLlmSettingsForWorker() {
      const data = await read();
      return data.settings;
    },
    async getHardTaskSpend() {
      const data = await read();
      return data.settings.llmHardTaskSpend;
    },
    async setHardTaskSpend(state) {
      const data = await read();
      data.settings.llmHardTaskSpend = state;
      await write(data);
    },
  };
}
