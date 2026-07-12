import type { PostDraft } from "../types/domain";
import {
  isPostArchetype,
  isPromoRisk,
  normalizeSubreddit,
  POST_ARCHETYPES,
  type PostDraftPayload,
  type PostDraftsResponsePayload,
} from "./schema";

export class PostParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PostParseError";
  }
}

function extractJsonObject(raw: string): Record<string, unknown> {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new PostParseError("LLM response did not contain JSON.");
  }
  try {
    const parsed = JSON.parse(candidate.slice(start, end + 1)) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new PostParseError("LLM response JSON must be an object.");
    }
    return parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof PostParseError) throw error;
    throw new PostParseError("LLM response JSON is invalid.");
  }
}

function mapDraftPayload(draft: unknown, index: number): PostDraftPayload {
  if (!draft || typeof draft !== "object") {
    throw new PostParseError(`Draft ${index + 1} is invalid.`);
  }
  const record = draft as Record<string, unknown>;
  const archetype = String(record.archetype ?? "");
  if (!isPostArchetype(archetype)) {
    throw new PostParseError(`Draft ${index + 1} has invalid archetype.`);
  }
  const title = String(record.title ?? "").trim();
  const body = String(record.body ?? "").trim();
  const riskNotes = String(record.riskNotes ?? "").trim();
  const promoRiskRaw = String(record.promoRisk ?? "medium");
  if (!title || !body) {
    throw new PostParseError(`Draft ${index + 1} missing title or body.`);
  }
  if (!isPromoRisk(promoRiskRaw)) {
    throw new PostParseError(`Draft ${index + 1} has invalid promoRisk.`);
  }
  return {
    archetype,
    title,
    body,
    riskNotes: riskNotes || "Review subreddit rules before posting.",
    promoRisk: promoRiskRaw,
  };
}

export function parsePostDraftsResponse(
  raw: string,
  sessionId: string,
  expectedSubreddit: string,
): PostDraft[] {
  const record = extractJsonObject(raw);
  const subreddit = normalizeSubreddit(String(record.subreddit ?? expectedSubreddit));
  if (subreddit.toLowerCase() !== normalizeSubreddit(expectedSubreddit).toLowerCase()) {
    throw new PostParseError("Response subreddit does not match request.");
  }
  if (!Array.isArray(record.drafts)) {
    throw new PostParseError("Post drafts JSON missing drafts array.");
  }
  if (record.drafts.length !== 3) {
    throw new PostParseError("Post drafts must include exactly 3 archetypes.");
  }

  const payloads = record.drafts.map((draft, index) => mapDraftPayload(draft, index));
  const archetypes = new Set(payloads.map((item) => item.archetype));
  if (archetypes.size !== 3) {
    throw new PostParseError("Drafts must include three unique archetypes.");
  }
  for (const required of POST_ARCHETYPES) {
    if (!archetypes.has(required)) {
      throw new PostParseError(`Missing required archetype: ${required}`);
    }
  }

  return payloads.map((payload) => ({
    id: crypto.randomUUID(),
    sessionId,
    subreddit,
    archetype: payload.archetype,
    title: payload.title,
    body: payload.body,
    riskNotes: payload.riskNotes,
    promoRisk: payload.promoRisk,
  }));
}

export function toPostDraftsResponsePayload(
  subreddit: string,
  drafts: PostDraftPayload[],
): PostDraftsResponsePayload {
  return { subreddit: normalizeSubreddit(subreddit), drafts };
}
