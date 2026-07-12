import type {
  CommunityProfile,
  CommunityProfileSuggestion,
  EvidenceItem,
  PhasePlanStatus,
  ResearchSession,
} from "../types/domain";
import type { PageContext } from "../reddit/types";
import type { SaveSettingsInput } from "../llm/llm-adapter";
import type { SuggestFieldType } from "../suggestions/types";

export type ImplementoMessage =
  | { type: "PING" }
  | { type: "GET_PAGE_CONTEXT"; useJsonFallback?: boolean }
  | { type: "GET_SELECTION" }
  | {
      type: "PIN_EVIDENCE";
      evidence: Omit<EvidenceItem, "id" | "capturedAt"> & { id?: string };
    }
  | { type: "LIST_EVIDENCE"; sessionId: string }
  | { type: "REMOVE_EVIDENCE"; evidenceId: string }
  | { type: "LIST_SESSIONS" }
  | { type: "CREATE_SESSION"; name: string }
  | { type: "SET_ACTIVE_SESSION"; sessionId: string }
  | { type: "GET_ACTIVE_SESSION" }
  | { type: "SAVE_SETTINGS"; settings: SaveSettingsInput }
  | { type: "GET_SETTINGS" }
  | { type: "TEST_LLM_CONNECTION" }
  | {
      type: "SUGGEST_FIELD";
      fieldType: SuggestFieldType;
      sessionId?: string;
      subreddit?: string;
      currentValue?: string;
      variationSeed?: string;
    }
  | { type: "RUN_DISCOVERY"; sessionId?: string }
  | {
      type: "AUTO_COLLECT_EVIDENCE";
      sessionId?: string;
      query?: string;
      subreddits?: string[];
    }
  | {
      type: "RUN_FULL_DISCOVERY";
      sessionId?: string;
      query?: string;
      subreddits?: string[];
    }
  | { type: "LIST_PAIN_THEMES"; sessionId: string }
  | { type: "LIST_COMMUNITY_PROFILES" }
  | { type: "UPDATE_COMMUNITY_PROFILE"; profile: CommunityProfile }
  | { type: "APPLY_PROFILE_SUGGESTION"; suggestion: CommunityProfileSuggestion }
  | { type: "GENERATE_BLUEPRINT"; sessionId?: string; projectTitle?: string }
  | { type: "GENERATE_PHASE0"; sessionId?: string }
  | { type: "GET_BLUEPRINT"; sessionId: string }
  | { type: "GET_PHASE_PLAN"; sessionId: string; phaseNumber: number }
  | {
      type: "MARK_PHASE_PLAN_STATUS";
      sessionId: string;
      phaseNumber: number;
      status: PhasePlanStatus;
    }
  | { type: "GENERATE_POST_DRAFTS"; sessionId?: string; subreddits: string[] }
  | { type: "LIST_POST_DRAFTS"; sessionId: string }
  | { type: "EXPORT_SESSION_BUNDLE"; sessionId?: string }
  | { type: "IMPORT_SESSION_BUNDLE"; raw: string; replaceIfExists: boolean }
  | { type: typeof STORAGE_UPDATED_EVENT };

export type ImplementoResponse<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

export type PageContextResponse = ImplementoResponse<PageContext>;
export type SelectionResponse = ImplementoResponse<{ text: string }>;
export type EvidenceListResponse = ImplementoResponse<EvidenceItem[]>;
export type SessionsResponse = ImplementoResponse<ResearchSession[]>;
export type ActiveSessionResponse = ImplementoResponse<{
  session: ResearchSession | null;
}>;
export type PinEvidenceResponse = ImplementoResponse<{
  evidence: EvidenceItem;
  duplicate: boolean;
}>;

export const STORAGE_UPDATED_EVENT = "STORAGE_UPDATED" as const;
