import { browserStorageAdapter } from "../../shared/storage/browser-storage";
import {
  createLlmAdapterForWorker,
  type PublicLlmSettings,
  type SaveSettingsInput,
} from "../../shared/llm/llm-adapter";
import { LLM_HOST_ORIGINS } from "../../shared/llm/model-config";
import type { ImplementoResponse } from "../../shared/messages/types";

function ok<T>(data?: T): ImplementoResponse<T> {
  return { ok: true, data };
}

function fail(error: string): ImplementoResponse<never> {
  return { ok: false, error };
}

export async function saveSettingsHandler(
  input: SaveSettingsInput,
): Promise<ImplementoResponse<PublicLlmSettings & { permissionGranted?: boolean }>> {
  if (!input.model.trim()) {
    return fail("Model is required.");
  }

  const publicSettings = await browserStorageAdapter.saveSettings(input);
  let permissionGranted = true;

  if (chrome.permissions?.request) {
    try {
      permissionGranted = await chrome.permissions.request({
        origins: [...LLM_HOST_ORIGINS],
      });
    } catch {
      permissionGranted = false;
    }
  }

  return ok({ ...publicSettings, permissionGranted });
}

export async function getSettingsHandler(): Promise<ImplementoResponse<PublicLlmSettings>> {
  const settings = await browserStorageAdapter.getPublicSettings();
  return ok(settings);
}

export async function testLlmConnectionHandler(): Promise<ImplementoResponse<{ message: string }>> {
  const adapter = await createLlmAdapterForWorker(browserStorageAdapter);
  if (!adapter.isConfigured()) {
    return fail(
      "LLM not configured. Set GEMINI_API_KEY and OPENROUTER_API_KEY in .env, then run npm run build.",
    );
  }

  try {
    const result = await adapter.complete({
      system: "Reply with the single word: ok",
      user: "ping",
      temperature: 0,
    });
    return ok({ message: result.content.slice(0, 80) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connection test failed.";
    return fail(message);
  }
}
