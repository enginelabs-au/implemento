import { browserStorageAdapter } from "../../shared/storage/browser-storage";
import { createLlmAdapterForWorker } from "../../shared/llm/llm-adapter";
import {
  buildSuggestionSystemPrompt,
  buildSuggestionUserPrompt,
} from "../../shared/suggestions/prompt";
import {
  parseSuggestionResponse,
  SuggestionParseError,
} from "../../shared/suggestions/parser";
import type { SuggestFieldRequest, SuggestFieldResponse } from "../../shared/suggestions/types";
import type { ImplementoResponse } from "../../shared/messages/types";

function ok<T>(data: T): ImplementoResponse<T> {
  return { ok: true, data };
}

function fail(error: string): ImplementoResponse<never> {
  return { ok: false, error };
}

export async function suggestFieldHandler(
  request: SuggestFieldRequest,
): Promise<ImplementoResponse<SuggestFieldResponse>> {
  const adapter = await createLlmAdapterForWorker(browserStorageAdapter);
  if (!adapter.isConfigured()) {
    return fail("LLM not configured. Rebuild after setting API keys in .env.");
  }

  let session = null;
  if (request.sessionId) {
    const sessions = await browserStorageAdapter.getSessions();
    session = sessions.find((item) => item.id === request.sessionId) ?? null;
  }

  const themes = request.sessionId
    ? await browserStorageAdapter.listPainThemes(request.sessionId)
    : [];

  const variationSeed =
    request.variationSeed ??
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const system = buildSuggestionSystemPrompt();
  const user = buildSuggestionUserPrompt({
    fieldType: request.fieldType,
    session,
    themes,
    subreddit: request.subreddit,
    currentValue: request.currentValue,
    variationSeed,
  });

  try {
    const result = await adapter.complete({ system, user, temperature: 0.9 });
    const parsed = parseSuggestionResponse(result.content);
    return ok(parsed);
  } catch (error) {
    if (error instanceof SuggestionParseError) {
      return fail(error.message);
    }
    const message = error instanceof Error ? error.message : "Suggestion failed.";
    return fail(message);
  }
}
