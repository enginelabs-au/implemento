import { sendMessage } from "../shared/messages/client";
import type { PublicLlmSettings } from "../shared/llm/llm-adapter";
import type { SaveSettingsInput } from "../shared/llm/llm-adapter";

export async function loadPublicSettings(): Promise<PublicLlmSettings> {
  const response = await sendMessage<PublicLlmSettings>({ type: "GET_SETTINGS" });
  return response.ok
    ? (response.data ?? { configured: false, models: [] })
    : { configured: false, models: [] };
}

export async function saveSettings(
  settings: SaveSettingsInput,
): Promise<{ ok: boolean; message: string }> {
  const response = await sendMessage<PublicLlmSettings & { permissionGranted?: boolean }>({
    type: "SAVE_SETTINGS",
    settings,
  });
  if (!response.ok) return { ok: false, message: response.error };
  const permissionNote =
    response.data?.permissionGranted === false
      ? " Model saved, but API host permissions were not granted."
      : "";
  return { ok: true, message: `Model preference saved.${permissionNote}` };
}

export async function testLlmConnection(): Promise<string> {
  const response = await sendMessage<{ message: string }>({ type: "TEST_LLM_CONNECTION" });
  if (!response.ok) return response.error;
  return `Connection ok: ${response.data?.message ?? "ok"}`;
}

export function renderSettingsUi(
  root: HTMLElement,
  settings: PublicLlmSettings,
  onFeedback: (message: string) => void,
): void {
  root.replaceChildren();

  const status = document.createElement("p");
  status.className = settings.configured ? "status-ok" : "status-warn";
  status.textContent = settings.configured
    ? "LLM configured from build environment (Gemini + OpenRouter)"
    : "LLM not configured — set GEMINI_API_KEY and OPENROUTER_API_KEY in .env, then rebuild";
  root.append(status);

  const note = document.createElement("p");
  note.className = "hint";
  note.textContent =
    "Temperature 0.2 and max reasoning are applied automatically. Fallback: Gemini chain → GPT-5.4 Nano → GPT-5.6 Sol Pro (max $1/day, only after all others fail).";
  root.append(note);

  const form = document.createElement("form");
  form.id = "settings-form";

  const modelSelect = document.createElement("select");
  modelSelect.id = "settings-model";
  const options = settings.models?.length
    ? settings.models
    : [{ id: "gemini-3.5-flash", label: "Gemini 3.5 Flash (default)" }];
  for (const option of options) {
    const el = document.createElement("option");
    el.value = option.id;
    el.textContent = option.label;
    if (option.id === (settings.model ?? "gemini-3.5-flash")) {
      el.selected = true;
    }
    modelSelect.append(el);
  }

  form.append(createField("Preferred Gemini model", modelSelect));

  const actions = document.createElement("div");
  actions.className = "button-row";

  const saveBtn = document.createElement("button");
  saveBtn.type = "submit";
  saveBtn.textContent = "Save model";

  const testBtn = document.createElement("button");
  testBtn.type = "button";
  testBtn.className = "secondary";
  testBtn.textContent = "Test connection";
  testBtn.addEventListener("click", async () => {
    onFeedback("Testing connection…");
    onFeedback(await testLlmConnection());
  });

  actions.append(saveBtn, testBtn);
  form.append(actions);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const result = await saveSettings({ model: modelSelect.value });
    onFeedback(result.message);
    if (result.ok) {
      document.dispatchEvent(new CustomEvent("implemento:refresh"));
    }
  });

  root.append(form);
}

function createField(labelText: string, input: HTMLElement): HTMLElement {
  const label = document.createElement("label");
  label.textContent = labelText;
  label.append(input);
  return label;
}
