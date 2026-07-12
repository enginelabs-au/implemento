export type DiscoveryFrequency = "low" | "medium" | "high";

export interface DiscoveryThemePayload {
  title: string;
  summary: string;
  severity: number;
  frequency: DiscoveryFrequency;
  evidenceIds: string[];
  inferenceFlag: boolean;
  workaroundPhrases: string[];
  buyerSignals: string[];
}

export interface DiscoveryProfileSuggestionPayload {
  subreddit: string;
  tone?: string;
  postPatterns?: string[];
  promoPolicy?: string;
  rulesNotes?: string;
}

export interface DiscoveryResponsePayload {
  themes: DiscoveryThemePayload[];
  communitySuggestions?: DiscoveryProfileSuggestionPayload[];
}

export function isDiscoveryFrequency(value: unknown): value is DiscoveryFrequency {
  return value === "low" || value === "medium" || value === "high";
}
