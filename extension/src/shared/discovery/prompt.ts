import type { EvidenceItem } from "../types/domain";
import type { CommunityProfile } from "../types/domain";

const MAX_EVIDENCE_ITEMS = 30;
const MAX_QUOTE_LENGTH = 500;

export interface DiscoveryPromptInput {
  sessionName: string;
  researchQuery?: string;
  subreddits?: string[];
  evidence: EvidenceItem[];
  profiles: CommunityProfile[];
}

export const AUTO_COLLECT_TAG = "auto-collect";

export function discoveryRunTag(runId: string): string {
  return `run:${runId}`;
}

export function isAutoCollectedEvidence(item: EvidenceItem): boolean {
  return item.tags.includes(AUTO_COLLECT_TAG);
}

export function evidenceForDiscoveryRun(
  evidence: EvidenceItem[],
  runId?: string,
): EvidenceItem[] {
  const sorted = [...evidence].sort(
    (a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime(),
  );
  if (!runId) return sorted;
  const runTag = discoveryRunTag(runId);
  const scoped = sorted.filter((item) => item.tags.includes(runTag));
  return scoped.length > 0 ? scoped : sorted.filter(isAutoCollectedEvidence);
}

export function truncateQuote(quote: string): string {
  if (quote.length <= MAX_QUOTE_LENGTH) return quote;
  return `${quote.slice(0, MAX_QUOTE_LENGTH)}…`;
}

export function selectEvidenceForPrompt(evidence: EvidenceItem[]): EvidenceItem[] {
  return evidenceForDiscoveryRun(evidence).slice(0, MAX_EVIDENCE_ITEMS);
}

export function buildDiscoverySystemPrompt(): string {
  return [
    "You are a market discovery analyst for solo founders researching pain points on Reddit.",
    "Cluster the provided evidence into pain themes for product opportunity discovery.",
    "Respond with JSON only — no markdown fences, no commentary.",
    "Use this exact shape:",
    '{"themes":[{"title":"string","summary":"string","severity":1-10,"frequency":"low|medium|high","evidenceIds":["id"],"inferenceFlag":boolean,"workaroundPhrases":["string"],"buyerSignals":["string"]}],"communitySuggestions":[{"subreddit":"string","tone":"string","postPatterns":["string"],"promoPolicy":"string","rulesNotes":"string"}]}',
    "Rules:",
    "- Every theme must cite at least one evidenceIds value from the input.",
    "- Set inferenceFlag true when the theme is inferred beyond direct quotes.",
    "- severity is 1 (mild) to 10 (acute).",
    "- Include workaroundPhrases (manual hacks users mention) and buyerSignals (willingness to pay/switch).",
    "- communitySuggestions are optional improvements to community profiles based on evidence.",
    "- Derive themes only from the evidence provided for this run. Do not invent or recycle themes from prior research.",
  ].join("\n");
}

export function buildDiscoveryUserPrompt(input: DiscoveryPromptInput): string {
  const evidence = selectEvidenceForPrompt(input.evidence);
  const evidenceBlock = evidence
    .map(
      (item) =>
        [
          `ID: ${item.id}`,
          `Subreddit: r/${item.subreddit}`,
          `Type: ${item.type}`,
          `Quote: ${truncateQuote(item.quote)}`,
        ].join("\n"),
    )
    .join("\n\n---\n\n");

  const profileBlock = input.profiles
    .map(
      (profile) =>
        `r/${profile.subreddit}: tone=${profile.tone}; patterns=${profile.postPatterns.join(", ")}`,
    )
    .join("\n");

  const focus =
    input.researchQuery?.trim() ||
    input.sessionName.trim() ||
    "General founder pain discovery";

  return [
    `Session: ${input.sessionName}`,
    `Research focus: ${focus}`,
    input.subreddits?.length
      ? `Target subreddits: ${input.subreddits.map((name) => `r/${name.replace(/^r\//i, "")}`).join(", ")}`
      : "Target subreddits: (from collected evidence)",
    "Analyze only the evidence below for this research focus.",
    "",
    "Community profiles:",
    profileBlock || "(none)",
    "",
    "Evidence items:",
    evidenceBlock,
  ].join("\n");
}

export function buildJsonRepairPrompt(invalidOutput: string): string {
  return `Fix this into valid JSON matching the required discovery schema. Return JSON only.\n\n${invalidOutput}`;
}
