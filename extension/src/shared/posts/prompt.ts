import type { CommunityProfile, PainTheme } from "../types/domain";
import { POST_ARCHETYPES } from "./schema";

const MAX_BLUEPRINT_EXCERPT = 4000;

export interface PostPromptInput {
  subreddit: string;
  profile: CommunityProfile | null;
  blueprintMarkdown: string;
  themes: PainTheme[];
  sessionName: string;
}

export function extractBlueprintExcerpt(markdown: string): string {
  const sections = [
    "## 1. Executive decision",
    "## 6. Unique value proposition and wedge",
    "## 4. User/problem definition",
  ];
  const chunks: string[] = [];
  for (const heading of sections) {
    const start = markdown.indexOf(heading);
    if (start < 0) continue;
    const next = markdown.indexOf("\n## ", start + heading.length);
    const slice = markdown.slice(start, next > start ? next : start + 1200);
    chunks.push(slice.trim());
  }
  const excerpt = chunks.join("\n\n") || markdown.slice(0, MAX_BLUEPRINT_EXCERPT);
  if (excerpt.length <= MAX_BLUEPRINT_EXCERPT) return excerpt;
  return `${excerpt.slice(0, MAX_BLUEPRINT_EXCERPT)}…`;
}

export function buildPostDraftsSystemPrompt(): string {
  return [
    "You are a Reddit community strategist helping founders draft ethical launch posts.",
    "Produce exactly three post concepts for the target subreddit — one per archetype.",
    "Respond with JSON only — no markdown fences, no commentary.",
    'Shape: {"subreddit":"string","drafts":[{"archetype":"problem-first|transparent-build|resource-value","title":"string","body":"string","riskNotes":"string","promoRisk":"low|medium|high"}]}',
    "Rules:",
    `- Include exactly these archetypes: ${POST_ARCHETYPES.join(", ")}.`,
    "- Adapt tone and structure to the community profile.",
    "- problem-first: pain discussion, no forced pitch.",
    "- transparent-build: build journey with tradeoffs and lessons.",
    "- resource-value: useful resource with restrained product disclosure.",
    "- riskNotes must mention rule/promo considerations for this community.",
    "- Never suggest astroturfing, ban evasion, fake accounts, vote manipulation, or rule circumvention.",
    "- promoRisk: low = educational only; medium = soft mention ok; high = likely promotional.",
  ].join("\n");
}

export function buildPostDraftsUserPrompt(input: PostPromptInput): string {
  const profile = input.profile;
  const profileBlock = profile
    ? [
        `Tone: ${profile.tone}`,
        `Post patterns: ${profile.postPatterns.join(", ") || "(none)"}`,
        `Promo policy: ${profile.promoPolicy}`,
        `Rules notes: ${profile.rulesNotes || "(none)"}`,
      ].join("\n")
    : "(no profile — use conservative, community-first tone)";

  const themeBlock = input.themes
    .map((theme) => `- ${theme.title}: ${theme.summary}`)
    .join("\n");

  return [
    `Session: ${input.sessionName}`,
    `Target subreddit: r/${input.subreddit}`,
    "",
    "Community profile:",
    profileBlock,
    "",
    "Pain themes:",
    themeBlock || "(none)",
    "",
    "Blueprint excerpt:",
    extractBlueprintExcerpt(input.blueprintMarkdown),
  ].join("\n");
}

export function buildJsonRepairPrompt(invalidOutput: string): string {
  return `Fix this into valid JSON with subreddit and exactly 3 drafts (one per archetype). Return JSON only.\n\n${invalidOutput}`;
}
