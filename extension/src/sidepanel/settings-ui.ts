import { sendMessage } from "../shared/messages/client";
import type { PublicLlmSettings } from "../shared/llm/llm-adapter";
import type { SaveSettingsInput } from "../shared/llm/llm-adapter";

export async function loadPublicSettings(): Promise<PublicLlmSettings> {
  const response = await sendMessage<PublicLlmSettings>({ type: "GET_SETTINGS" });
  return response.ok
    ? (response.data ?? { configured: false })
    : { configured: false };
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
      ? " Settings saved, but API host permission was not granted."
      : "";
  return { ok: true, message: `Settings saved.${permissionNote}` };
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
    ? "LLM configured"
    : "LLM not configured — add settings to run discovery";
  root.append(status);

  const form = document.createElement("form");
  form.id = "settings-form";

  const apiUrl = document.createElement("input");
  apiUrl.type = "url";
  apiUrl.id = "settings-api-url";
  apiUrl.placeholder = "https://api.openai.com/v1";
  apiUrl.value = settings.apiUrl ?? "https://api.openai.com/v1";

  const apiKey = document.createElement("input");
  apiKey.type = "password";
  apiKey.id = "settings-api-key";
  apiKey.placeholder = settings.configured ? "•••••••• (unchanged if blank)" : "API key";

  const model = document.createElement("input");
  model.type = "text";
  model.id = "settings-model";
  model.placeholder = "gpt-4o-mini";
  model.value = settings.model ?? "gpt-4o-mini";

  const temperature = document.createElement("input");
  temperature.type = "number";
  temperature.id = "settings-temperature";
  temperature.min = "0";
  temperature.max = "1";
  temperature.step = "0.1";
  temperature.value = String(settings.temperature ?? 0.2);

  form.append(
    createField("API URL", apiUrl),
    createField("API key", apiKey),
    createField("Model", model),
    createField("Temperature", temperature),
  );

  const actions = document.createElement("div");
  actions.className = "button-row";

  const saveBtn = document.createElement("button");
  saveBtn.type = "submit";
  saveBtn.textContent = "Save settings";

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
    const result = await saveSettings({
      apiUrl: apiUrl.value,
      apiKey: apiKey.value,
      model: model.value,
      temperature: Number(temperature.value),
    });
    onFeedback(result.message);
    if (result.ok) {
      apiKey.value = "";
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
