import { sendMessage } from "../shared/messages/client";
import type { SessionBundleV1 } from "../shared/bundle/schema";

export async function exportSessionBundle(
  sessionId: string,
): Promise<{ ok: boolean; message: string; json?: string; bundle?: SessionBundleV1 }> {
  const response = await sendMessage<{ bundle: SessionBundleV1; json: string }>({
    type: "EXPORT_SESSION_BUNDLE",
    sessionId,
  });
  if (!response.ok) return { ok: false, message: response.error };
  return {
    ok: true,
    message: "Session bundle ready.",
    json: response.data?.json,
    bundle: response.data?.bundle,
  };
}

export async function importSessionBundle(
  raw: string,
  replaceIfExists: boolean,
): Promise<string> {
  const response = await sendMessage<{ sessionId: string; replaced: boolean }>({
    type: "IMPORT_SESSION_BUNDLE",
    raw,
    replaceIfExists,
  });
  if (!response.ok) return response.error;
  const replaced = response.data?.replaced ? "replaced" : "imported as new";
  return `Session ${replaced} successfully.`;
}

export function renderBundleUi(
  root: HTMLElement,
  options: {
    hasSession: boolean;
    sessionName: string;
    onExport: () => void;
    onImport: (file: File, replaceIfExists: boolean) => void;
  },
): void {
  root.replaceChildren();

  const note = document.createElement("p");
  note.className = "muted";
  note.textContent =
    "Export or import a session JSON bundle. API keys are never included.";
  root.append(note);

  const actions = document.createElement("div");
  actions.className = "button-row";

  const exportBtn = document.createElement("button");
  exportBtn.type = "button";
  exportBtn.textContent = "Export session bundle";
  exportBtn.disabled = !options.hasSession;
  exportBtn.addEventListener("click", options.onExport);
  actions.append(exportBtn);

  const importLabel = document.createElement("label");
  importLabel.className = "file-input-label";
  importLabel.textContent = "Import session bundle";
  const importInput = document.createElement("input");
  importInput.type = "file";
  importInput.accept = "application/json,.json";
  importInput.addEventListener("change", () => {
    const file = importInput.files?.[0];
    if (!file) return;
    const replace = window.confirm(
      `Import "${file.name}"?\n\nOK = replace session if ID exists.\nCancel = import as new session.`,
    );
    options.onImport(file, replace);
    importInput.value = "";
  });
  importLabel.append(importInput);

  root.append(actions, importLabel);

  if (!options.hasSession) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "Select a session to export.";
    root.append(empty);
  }
}
