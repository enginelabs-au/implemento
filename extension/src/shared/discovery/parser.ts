import type { PainTheme } from "../types/domain";
import type { CommunityProfileSuggestion } from "../types/domain";
import {
  isDiscoveryFrequency,
  type DiscoveryResponsePayload,
  type DiscoveryThemePayload,
} from "./schema";

export class DiscoveryParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DiscoveryParseError";
  }
}

export function parseDiscoveryResponse(
  raw: string,
  sessionId: string,
  validEvidenceIds: Set<string>,
): {
  themes: PainTheme[];
  suggestions: CommunityProfileSuggestion[];
} {
  const payload = extractJsonObject(raw);
  return mapDiscoveryPayload(payload, sessionId, validEvidenceIds);
}

function extractJsonObject(raw: string): DiscoveryResponsePayload {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new DiscoveryParseError("LLM response did not contain JSON.");
  }
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as DiscoveryResponsePayload;
  } catch {
    throw new DiscoveryParseError("LLM response JSON is invalid.");
  }
}

function mapDiscoveryPayload(
  payload: DiscoveryResponsePayload,
  sessionId: string,
  validEvidenceIds: Set<string>,
): {
  themes: PainTheme[];
  suggestions: CommunityProfileSuggestion[];
} {
  if (!payload || !Array.isArray(payload.themes)) {
    throw new DiscoveryParseError("Discovery JSON missing themes array.");
  }

  const themes = payload.themes.map((theme, index) =>
    mapTheme(theme, sessionId, validEvidenceIds, index),
  );

  const suggestions = (payload.communitySuggestions ?? []).map((item) => ({
    subreddit: normalizeSubreddit(item.subreddit),
    tone: item.tone,
    postPatterns: item.postPatterns,
    promoPolicy: item.promoPolicy,
    rulesNotes: item.rulesNotes,
  }));

  return { themes, suggestions };
}

function mapTheme(
  theme: DiscoveryThemePayload,
  sessionId: string,
  validEvidenceIds: Set<string>,
  index: number,
): PainTheme {
  if (!theme.title || !theme.summary) {
    throw new DiscoveryParseError(`Theme ${index + 1} missing title or summary.`);
  }

  const severity = Number(theme.severity);
  if (!Number.isFinite(severity) || severity < 1 || severity > 10) {
    throw new DiscoveryParseError(`Theme ${index + 1} has invalid severity.`);
  }

  if (!isDiscoveryFrequency(theme.frequency)) {
    throw new DiscoveryParseError(`Theme ${index + 1} has invalid frequency.`);
  }

  const evidenceIds = (theme.evidenceIds ?? []).filter((id) => validEvidenceIds.has(id));
  if (evidenceIds.length === 0) {
    throw new DiscoveryParseError(`Theme ${index + 1} has no valid evidenceIds.`);
  }

  return {
    id: crypto.randomUUID(),
    sessionId,
    title: theme.title,
    summary: theme.summary,
    evidenceIds,
    severity,
    frequency: theme.frequency,
    inferenceFlag: Boolean(theme.inferenceFlag),
    workaroundPhrases: theme.workaroundPhrases ?? [],
    buyerSignals: theme.buyerSignals ?? [],
  };
}

function normalizeSubreddit(value: string): string {
  return value.replace(/^r\//i, "").trim();
}
