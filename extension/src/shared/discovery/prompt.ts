import type { EvidenceItem } from "../types/domain";
import type { CommunityProfile } from "../types/domain";

const MAX_EVIDENCE_ITEMS = 30;
const MAX_QUOTE_LENGTH = 500;

export interface DiscoveryPromptInput {
  sessionName: string;
  evidence: EvidenceItem[];
  profiles: CommunityProfile[];
}

export function truncateQuote(quote: string): string {
  if (quote.length <= MAX_QUOTE_LENGTH) return quote;
  return `${quote.slice(0, MAX_QUOTE_LENGTH)}…`;
}

export function selectEvidenceForPrompt(evidence: EvidenceItem[]): EvidenceItem[] {
  return evidence.slice(0, MAX_EVIDENCE_ITEMS);
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

  return [
    `Session: ${input.sessionName}`,
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
