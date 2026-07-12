import type { PostDraft, PromoRisk } from "../types/domain";

export class PostEthicsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PostEthicsError";
  }
}

const CRITICAL_PATTERNS: RegExp[] = [
  /\bastroturf/i,
  /\bfake account/i,
  /\bban evasion/i,
  /\bevade ban/i,
  /\bvote manip/i,
  /\bupvote (?:your|my|our)/i,
  /\buse alts?\b/i,
  /\balternate accounts?\b/i,
  /\bspam\b.*\bcomment/i,
  /\bignore (?:the )?rules/i,
  /\bcircumvent\b.*\brule/i,
];

const WARNING_PATTERNS: RegExp[] = [
  /\bcheck out my\b/i,
  /\bbuy now\b/i,
  /\blimited time\b/i,
  /\bsign up (?:today|now)\b/i,
  /\bclick (?:here|my link)\b/i,
];

export interface EthicsScanResult {
  criticalMatches: string[];
  warningMatches: string[];
  elevatedRisk: PromoRisk;
}

function collectMatches(text: string, patterns: RegExp[]): string[] {
  const matches: string[] = [];
  for (const pattern of patterns) {
    if (pattern.test(text)) {
      matches.push(pattern.source);
    }
  }
  return matches;
}

function bumpRisk(current: PromoRisk, next: PromoRisk): PromoRisk {
  const order: PromoRisk[] = ["low", "medium", "high"];
  return order.indexOf(next) > order.indexOf(current) ? next : current;
}

export function scanDraftEthics(
  draft: Pick<PostDraft, "title" | "body" | "riskNotes" | "promoRisk">,
): EthicsScanResult {
  const combined = `${draft.title}\n${draft.body}\n${draft.riskNotes}`;
  const criticalMatches = collectMatches(combined, CRITICAL_PATTERNS);
  const warningMatches = collectMatches(combined, WARNING_PATTERNS);

  let elevatedRisk = draft.promoRisk;
  if (warningMatches.length > 0) {
    elevatedRisk = bumpRisk(elevatedRisk, "medium");
  }
  if (criticalMatches.length > 0) {
    elevatedRisk = "high";
  }

  return { criticalMatches, warningMatches, elevatedRisk };
}

export function assertDraftEthics(
  draft: Pick<PostDraft, "title" | "body" | "riskNotes" | "promoRisk">,
): EthicsScanResult {
  const result = scanDraftEthics(draft);
  if (result.criticalMatches.length > 0) {
    throw new PostEthicsError(
      `Draft blocked by ethics guardrails: ${result.criticalMatches.join(", ")}`,
    );
  }
  return result;
}

export function applyEthicsToDraft(draft: PostDraft): PostDraft {
  const result = assertDraftEthics(draft);
  const notes = [...new Set([draft.riskNotes, ...result.warningMatches.map((m) => `Warning: matched ${m}`)])]
    .filter(Boolean)
    .join("\n");
  return {
    ...draft,
    promoRisk: result.elevatedRisk,
    riskNotes: notes.trim(),
  };
}
