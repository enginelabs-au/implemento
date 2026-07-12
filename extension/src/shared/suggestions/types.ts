export type SuggestFieldType =
  | "discovery_query"
  | "discovery_subreddits"
  | "session_name"
  | "project_title"
  | "community_tone"
  | "community_rules"
  | "community_promo"
  | "community_patterns";

export interface SuggestFieldRequest {
  fieldType: SuggestFieldType;
  sessionId?: string;
  subreddit?: string;
  currentValue?: string;
  variationSeed?: string;
}

export interface SuggestFieldResponse {
  value: string;
}
