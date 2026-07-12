import type { PainTheme, ResearchSession } from "../types/domain";
import type { SuggestFieldType } from "./types";

export interface SuggestionPromptContext {
  fieldType: SuggestFieldType;
  session?: ResearchSession | null;
  themes?: PainTheme[];
  subreddit?: string;
  currentValue?: string;
  variationSeed: string;
}

const FIELD_INSTRUCTIONS: Record<SuggestFieldType, string> = {
  discovery_query:
    "A Reddit research search query (3-8 words) to find founder pain points and unmet needs. Focus on problems, frustrations, and workarounds — not solutions.",
  discovery_subreddits:
    "A comma-separated list of 3-5 relevant subreddit names WITHOUT the r/ prefix. Mix niche and mid-size communities where target users discuss pains openly.",
  session_name:
    "A short research session name (3-6 words) describing a market discovery focus for a solo founder building a software product.",
  project_title:
    "A concise product/project title (2-5 words) inspired by discovered pain themes. Should sound like a plausible SaaS or tool name direction, not a marketing slogan.",
  community_tone:
    "One sentence describing the tone and culture of the subreddit for someone drafting authentic posts.",
  community_rules:
    "2-3 sentences summarizing implicit posting norms, taboos, and what gets downvoted in this community.",
  community_promo:
    "One sentence on promotional/self-promo tolerance: low, medium, or high, with a brief reason.",
  community_patterns:
    "3-5 comma-separated post pattern labels that work in this community (e.g. problem-first, build log, ask-for-feedback).",
};

export function buildSuggestionSystemPrompt(): string {
  return [
    "You help solo founders research markets on Reddit.",
    "Return valid JSON only: {\"value\": \"...\"}",
    "Generate a fresh, creative suggestion different from the current value.",
    "Be specific and practical. No markdown, no explanation outside JSON.",
  ].join(" ");
}

export function buildSuggestionUserPrompt(context: SuggestionPromptContext): string {
  const instruction = FIELD_INSTRUCTIONS[context.fieldType];
  const lines = [
    `Field: ${context.fieldType}`,
    `Goal: ${instruction}`,
    `Variation seed: ${context.variationSeed}`,
  ];

  if (context.session) {
    lines.push(`Session: ${context.session.name}`);
    if (context.session.subreddits.length > 0) {
      lines.push(`Subreddits in session: ${context.session.subreddits.join(", ")}`);
    }
  }

  if (context.subreddit) {
    lines.push(`Target subreddit: r/${context.subreddit}`);
  }

  if (context.themes && context.themes.length > 0) {
    const themeSummary = context.themes
      .slice(0, 5)
      .map((theme) => `${theme.title} (severity ${theme.severity})`)
      .join("; ");
    lines.push(`Pain themes discovered: ${themeSummary}`);
  }

  if (context.currentValue?.trim()) {
    lines.push(
      `Current value (generate something different): ${context.currentValue.trim()}`,
    );
  }

  lines.push('Return JSON: {"value": "your suggestion"}');
  return lines.join("\n");
}
