import type { PostArchetype, PromoRisk } from "../types/domain";

export const POST_ARCHETYPES: PostArchetype[] = [
  "problem-first",
  "transparent-build",
  "resource-value",
];

export const PROMO_RISKS: PromoRisk[] = ["low", "medium", "high"];

export interface PostDraftPayload {
  archetype: PostArchetype;
  title: string;
  body: string;
  riskNotes: string;
  promoRisk: PromoRisk;
}

export interface PostDraftsResponsePayload {
  subreddit: string;
  drafts: PostDraftPayload[];
}

export function isPostArchetype(value: string): value is PostArchetype {
  return (POST_ARCHETYPES as string[]).includes(value);
}

export function isPromoRisk(value: string): value is PromoRisk {
  return (PROMO_RISKS as string[]).includes(value);
}

export function normalizeSubreddit(value: string): string {
  return value.replace(/^r\//i, "").trim();
}
