import { sendMessage } from "../shared/messages/client";
import type { SuggestFieldType } from "../shared/suggestions/types";

export interface SuggestWandOptions {
  sessionId?: string | null;
  subreddit?: string;
  enabled?: boolean;
  onApplied?: (value: string) => void;
}

const WAND_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8 19 13"/><path d="M15 9h0"/><path d="M17.8 6.2 19 5"/><path d="m3 21 9-9"/><path d="M12.2 6.2 11 5"/></svg>`;

export async function fetchFieldSuggestion(
  fieldType: SuggestFieldType,
  options: SuggestWandOptions & { currentValue?: string } = {},
): Promise<{ ok: boolean; value?: string; error?: string }> {
  const response = await sendMessage<{ value: string }>({
    type: "SUGGEST_FIELD",
    fieldType,
    sessionId: options.sessionId ?? undefined,
    subreddit: options.subreddit,
    currentValue: options.currentValue,
    variationSeed: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  });

  if (!response.ok) {
    return { ok: false, error: response.error };
  }

  return { ok: true, value: response.data?.value };
}

export function wrapInputWithSuggestWand(
  input: HTMLInputElement | HTMLTextAreaElement,
  fieldType: SuggestFieldType,
  options: SuggestWandOptions = {},
): HTMLElement {
  const row = document.createElement("div");
  row.className = "field-with-wand";

  const enabled = options.enabled !== false;
  input.classList.add("field-with-wand-input");
  row.append(input);

  const wand = document.createElement("button");
  wand.type = "button";
  wand.className = "suggest-wand";
  wand.innerHTML = WAND_SVG;
  wand.title = enabled ? "Suggest with AI" : "Configure LLM to enable suggestions";
  wand.setAttribute("aria-label", "Suggest with AI");
  wand.disabled = !enabled;

  wand.addEventListener("click", async () => {
    if (!enabled || wand.disabled) return;
    wand.disabled = true;
    wand.classList.add("loading");

    const result = await fetchFieldSuggestion(fieldType, {
      sessionId: options.sessionId,
      subreddit: options.subreddit,
      currentValue: input.value,
    });

    wand.classList.remove("loading");
    wand.disabled = false;

    if (!result.ok || !result.value) {
      input.dispatchEvent(
        new CustomEvent("implemento:suggest-error", {
          bubbles: true,
          detail: result.error ?? "Suggestion failed.",
        }),
      );
      return;
    }

    input.value = result.value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    options.onApplied?.(result.value);
  });

  row.append(wand);
  return row;
}

export function createLabeledFieldWithWand(
  labelText: string,
  input: HTMLInputElement | HTMLTextAreaElement,
  fieldType: SuggestFieldType,
  options: SuggestWandOptions = {},
): HTMLElement {
  const label = document.createElement("label");
  label.textContent = labelText;
  label.append(wrapInputWithSuggestWand(input, fieldType, options));
  return label;
}
