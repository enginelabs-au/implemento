export const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

export const OPENROUTER_API_URL = "https://openrouter.ai/api/v1";

export const DEFAULT_TEMPERATURE = 0.2;

export const HARD_TASK_MAX_DAILY_USD = 1;

export interface ModelOption {
  id: string;
  label: string;
}

export const GEMINI_MODEL_OPTIONS: ModelOption[] = [
  { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash (default)" },
  { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
];

export const GEMINI_FALLBACK_CHAIN = GEMINI_MODEL_OPTIONS.map((m) => m.id);

export const OPENROUTER_NANO_MODEL = "openai/gpt-5.4-nano";

export const OPENROUTER_HARD_TASK_MODEL = "openai/gpt-5.6-sol-pro";

export function chainFromPreferredModel(preferredModel: string): string[] {
  const index = GEMINI_FALLBACK_CHAIN.indexOf(preferredModel);
  if (index === -1) return [...GEMINI_FALLBACK_CHAIN];
  return GEMINI_FALLBACK_CHAIN.slice(index);
}

export const LLM_HOST_ORIGINS = [
  "https://generativelanguage.googleapis.com/*",
  "https://openrouter.ai/*",
] as const;
