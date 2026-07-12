import { browserStorageAdapter } from "../../shared/storage/browser-storage";
import { buildSessionBundle, serializeSessionBundle } from "../../shared/bundle/export";
import {
  applySessionBundleImport,
  parseSessionBundleJson,
} from "../../shared/bundle/import";
import {
  assertNoSecretsInBundleJson,
  type SessionBundleV1,
} from "../../shared/bundle/schema";
import type { ImplementoResponse } from "../../shared/messages/types";

function ok<T>(data?: T): ImplementoResponse<T> {
  return { ok: true, data };
}

function fail(error: string): ImplementoResponse<never> {
  return { ok: false, error };
}

export async function exportSessionBundleHandler(
  sessionId?: string,
): Promise<ImplementoResponse<{ bundle: SessionBundleV1; json: string }>> {
  const resolvedSessionId =
    sessionId ?? (await browserStorageAdapter.getActiveSessionId());
  if (!resolvedSessionId) {
    return fail("Create or select a research session first.");
  }

  const data = await browserStorageAdapter.getAll();
  const bundle = buildSessionBundle(data, resolvedSessionId);
  if (!bundle) return fail("Session not found.");

  const json = serializeSessionBundle(bundle);
  assertNoSecretsInBundleJson(json);
  return ok({ bundle, json });
}

export async function importSessionBundleHandler(
  raw: string,
  replaceIfExists: boolean,
): Promise<ImplementoResponse<{ sessionId: string; replaced: boolean }>> {
  try {
    const bundle = parseSessionBundleJson(raw);
    const data = await browserStorageAdapter.getAll();
    const result = applySessionBundleImport(data, bundle, { replaceIfExists });
    await browserStorageAdapter.setAll(data);
    return ok(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import failed.";
    return fail(message);
  }
}
