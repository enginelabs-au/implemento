import type { LlmCompletionRequest, LlmCompletionResponse, LlmSettings } from "./types";
import { NotConfiguredError } from "./types";
import {
  completeWithRouter,
  isLlmRuntimeConfigured,
  resolveLlmRuntime,
  type HardTaskSpendState,
} from "./router";
import { BUILD_LLM_SECRETS } from "./secrets.generated";
import { GEMINI_MODEL_OPTIONS } from "./model-config";

export interface LlmAdapter {
  isConfigured(): boolean;
  complete(request: LlmCompletionRequest): Promise<LlmCompletionResponse>;
}

export interface LlmAdapterDependencies {
  getHardTaskSpend?: () => Promise<HardTaskSpendState | undefined>;
  setHardTaskSpend?: (state: HardTaskSpendState) => Promise<void>;
}

export function createLlmAdapter(
  settings: LlmSettings,
  deps: LlmAdapterDependencies = {},
): LlmAdapter {
  const runtime = resolveLlmRuntime({
    llmModel: settings.model,
    llmTemperature: settings.temperature,
    llmApiKey: settings.apiKey,
  });
  const isConfigured = isLlmRuntimeConfigured(runtime);

  return {
    isConfigured() {
      return isConfigured;
    },
    async complete(request: LlmCompletionRequest): Promise<LlmCompletionResponse> {
      if (!isConfigured) {
        throw new NotConfiguredError(
          "LLM is not configured. Rebuild the extension after setting GEMINI_API_KEY and OPENROUTER_API_KEY in .env.",
        );
      }

      return completeWithRouter(runtime, request, {
        hardTaskSpend: deps.getHardTaskSpend ? await deps.getHardTaskSpend() : undefined,
        onHardTaskSpend: deps.setHardTaskSpend,
      });
    },
  };
}

export const LLM_SETTING_KEYS = {
  model: "IMPLEMENTO_LLM_MODEL",
  temperature: "IMPLEMENTO_LLM_TEMPERATURE",
} as const;

export function settingsFromStorage(settings: {
  llmApiUrl?: string;
  llmApiKey?: string;
  llmModel?: string;
  llmTemperature?: number;
}): LlmSettings {
  return {
    apiUrl: settings.llmApiUrl ?? BUILD_LLM_SECRETS.geminiApiUrl,
    apiKey: settings.llmApiKey ?? BUILD_LLM_SECRETS.geminiApiKey,
    model: settings.llmModel ?? BUILD_LLM_SECRETS.defaultModel,
    temperature: settings.llmTemperature ?? BUILD_LLM_SECRETS.defaultTemperature,
  };
}

export interface PublicLlmSettings {
  configured: boolean;
  model?: string;
  temperature?: number;
  models: Array<{ id: string; label: string }>;
}

export function toPublicSettings(settings: {
  llmApiUrl?: string;
  llmApiKey?: string;
  llmModel?: string;
  llmTemperature?: number;
}): PublicLlmSettings {
  const runtime = resolveLlmRuntime({
    llmModel: settings.llmModel,
    llmTemperature: settings.llmTemperature,
    llmApiKey: settings.llmApiKey,
  });
  return {
    configured: isLlmRuntimeConfigured(runtime),
    model: runtime.preferredModel,
    temperature: runtime.temperature,
    models: GEMINI_MODEL_OPTIONS,
  };
}

export interface SaveSettingsInput {
  model: string;
}

export interface LlmWorkerStorage {
  getLlmSettingsForWorker(): Promise<{
    llmApiUrl?: string;
    llmApiKey?: string;
    llmModel?: string;
    llmTemperature?: number;
  }>;
  getHardTaskSpend(): Promise<HardTaskSpendState | undefined>;
  setHardTaskSpend(state: HardTaskSpendState): Promise<void>;
}

export async function createLlmAdapterForWorker(
  storage: LlmWorkerStorage,
): Promise<LlmAdapter> {
  const settings = await storage.getLlmSettingsForWorker();
  return createLlmAdapter(settingsFromStorage(settings), {
    getHardTaskSpend: () => storage.getHardTaskSpend(),
    setHardTaskSpend: (state) => storage.setHardTaskSpend(state),
  });
}
