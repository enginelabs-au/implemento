import type { CommunityProfile, EvidenceItem, PainTheme } from "../types/domain";
import { truncateQuote } from "../discovery/prompt";

const MAX_EVIDENCE_IN_BLUEPRINT = 15;
const MAX_BLUEPRINT_INPUT_CHARS = 12000;

export interface BlueprintPromptInput {
  sessionName: string;
  projectTitle: string;
  themes: PainTheme[];
  evidence: EvidenceItem[];
  profiles: CommunityProfile[];
}

export interface Phase0PromptInput {
  sessionName: string;
  blueprintMarkdown: string;
  themes: PainTheme[];
}

export function buildBlueprintSystemPrompt(): string {
  return [
    "You are a product strategist synthesizing Reddit pain research into an implemento strategy blueprint.",
    "Ground every claim in the provided pain themes and evidence. Mark inference where evidence is thin.",
    "Respond with JSON only — no markdown fences, no commentary.",
    "Use this exact shape with string values for every field:",
    '{"project_slug":"kebab-case","project_title":"string","executive_decision":"string","evidence_method":"string","intelligence_report":"string","user_problem":"string","competitive_landscape":"string","uvp":"string","validation_experiments":"string","prd":"string","mvp_scope":"string","architecture":"string","interfaces":"string","security":"string","delivery_map":"string","gtm":"string","risks":"string","sources":"string","handoff":"string"}',
    "Rules:",
    "- delivery_map must list phases 0–5 at high level (no detailed phase 1+ plans).",
    "- prd and mvp_scope must include explicit non-goals.",
    "- handoff must describe what phase_0_foundations_plan.md should establish.",
    "- Use markdown-friendly plain text inside JSON strings (newlines allowed).",
  ].join("\n");
}

export function buildBlueprintUserPrompt(input: BlueprintPromptInput): string {
  const evidenceById = new Map(input.evidence.map((item) => [item.id, item]));
  const themeBlock = input.themes
    .map((theme) => {
      const quotes = theme.evidenceIds
        .map((id) => evidenceById.get(id))
        .filter(Boolean)
        .slice(0, 3)
        .map((item) => truncateQuote(item!.quote))
        .join(" | ");
      return [
        `Title: ${theme.title}`,
        `Summary: ${theme.summary}`,
        `Severity: ${theme.severity}/10 · ${theme.frequency}`,
        `Inference: ${theme.inferenceFlag}`,
        `Evidence quotes: ${quotes || "(none)"}`,
        `Workarounds: ${theme.workaroundPhrases.join("; ") || "(none)"}`,
        `Buyer signals: ${theme.buyerSignals.join("; ") || "(none)"}`,
      ].join("\n");
    })
    .join("\n\n---\n\n");

  const profileBlock = input.profiles
    .map(
      (profile) =>
        `r/${profile.subreddit}: tone=${profile.tone}; patterns=${profile.postPatterns.join(", ")}`,
    )
    .join("\n");

  const extraEvidence = input.evidence
    .slice(0, MAX_EVIDENCE_IN_BLUEPRINT)
    .map(
      (item) =>
        `[${item.id}] r/${item.subreddit} (${item.type}): ${truncateQuote(item.quote)}`,
    )
    .join("\n");

  return [
    `Session: ${input.sessionName}`,
    `Project title: ${input.projectTitle}`,
    "",
    "Pain themes:",
    themeBlock || "(none)",
    "",
    "Community profiles:",
    profileBlock || "(none)",
    "",
    "Additional evidence (reference by theme):",
    extraEvidence || "(none)",
  ].join("\n");
}

export function buildPhase0SystemPrompt(): string {
  return [
    "You are a project planner creating a phase 0 foundations plan from an approved strategy blueprint.",
    "Follow implemento PROJECT_PLANNING methodology: phase 0 maps the whole project; later phases are generated just-in-time.",
    "Respond with JSON only — no markdown fences, no commentary.",
    "Use this exact shape with string values for every field:",
    '{"phase_title":"string","objective":"string","relation":"string","entry_criteria":"string","scope":"string","non_goals":"string","audit":"string","assumptions":"string","dependencies":"string","architecture":"string","files":"string","supporting_docs":"string","tasks":"string","delegation":"string","validation_rows":"string","security":"string","env_rows":"string","deferred_rows":"string","rollback":"string","acceptance":"string","completion":"string","deviations":"string","next_plan_prompt":"string"}',
    "Rules:",
    "- validation_rows, env_rows, and deferred_rows are markdown table body rows (no header).",
    "- tasks should be numbered implementation tasks for phase 0 only.",
    "- next_plan_prompt must instruct generating phase_1 plan after phase 0 is verified.",
    "- Do not invent detailed phase 1+ implementation — only map them in relation/dependencies.",
  ].join("\n");
}

export function truncateBlueprintMarkdown(markdown: string): string {
  if (markdown.length <= MAX_BLUEPRINT_INPUT_CHARS) return markdown;
  return `${markdown.slice(0, MAX_BLUEPRINT_INPUT_CHARS)}\n\n[truncated for token budget]`;
}

export function buildPhase0UserPrompt(input: Phase0PromptInput): string {
  const themeSummary = input.themes
    .map((theme) => `- ${theme.title} (${theme.severity}/10)`)
    .join("\n");

  return [
    `Session: ${input.sessionName}`,
    "",
    "Pain themes summary:",
    themeSummary || "(none)",
    "",
    "Blueprint markdown:",
    truncateBlueprintMarkdown(input.blueprintMarkdown),
  ].join("\n");
}

export function buildJsonRepairPrompt(invalidOutput: string): string {
  return `Fix this into valid JSON matching the required schema. Return JSON only.\n\n${invalidOutput}`;
}
