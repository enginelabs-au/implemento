import { browserStorageAdapter } from "../../shared/storage/browser-storage";
import {
  createLlmAdapter,
  settingsFromStorage,
  type PublicLlmSettings,
  type SaveSettingsInput,
} from "../../shared/llm/llm-adapter";
import { extractApiOriginPattern } from "../../shared/llm/openai-client";
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
  if (!input.apiUrl.trim() || !input.model.trim()) {
    return fail("API URL and model are required.");
  }

  const publicSettings = await browserStorageAdapter.saveSettings(input);
  const originPattern = extractApiOriginPattern(input.apiUrl);
  let permissionGranted = true;

  if (originPattern && chrome.permissions?.request) {
    try {
      permissionGranted = await chrome.permissions.request({
        origins: [originPattern],
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
  const settings = await browserStorageAdapter.getLlmSettingsForWorker();
  const adapter = createLlmAdapter(settingsFromStorage(settings));
  if (!adapter.isConfigured()) {
    return fail("Configure API URL, API key, and model first.");
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
