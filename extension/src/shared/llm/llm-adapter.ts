import type { LlmCompletionRequest, LlmCompletionResponse, LlmSettings } from "./types";
import { NotConfiguredError } from "./types";
import { callChatCompletions } from "./openai-client";

export interface LlmAdapter {
  isConfigured(): boolean;
  complete(request: LlmCompletionRequest): Promise<LlmCompletionResponse>;
}

export function createLlmAdapter(settings: LlmSettings): LlmAdapter {
  const isConfigured = Boolean(settings.apiUrl && settings.apiKey && settings.model);

  return {
    isConfigured() {
      return isConfigured;
    },
    async complete(request: LlmCompletionRequest): Promise<LlmCompletionResponse> {
      if (!isConfigured || !settings.apiUrl || !settings.apiKey || !settings.model) {
        throw new NotConfiguredError(
          "Configure API URL, API key, and model in Implemento settings.",
        );
      }

      const result = await callChatCompletions({
        apiUrl: settings.apiUrl,
        apiKey: settings.apiKey,
        model: settings.model,
        temperature: settings.temperature ?? request.temperature,
        system: request.system,
        user: request.user,
      });

      return { content: result.content };
    },
  };
}

export const LLM_SETTING_KEYS = {
  apiUrl: "IMPLEMENTO_LLM_API_URL",
  apiKey: "IMPLEMENTO_LLM_API_KEY",
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
    apiUrl: settings.llmApiUrl,
    apiKey: settings.llmApiKey,
    model: settings.llmModel,
    temperature: settings.llmTemperature,
  };
}

export interface PublicLlmSettings {
  configured: boolean;
  apiUrl?: string;
  model?: string;
  temperature?: number;
}

export function toPublicSettings(settings: {
  llmApiUrl?: string;
  llmApiKey?: string;
  llmModel?: string;
  llmTemperature?: number;
}): PublicLlmSettings {
  return {
    configured: Boolean(settings.llmApiUrl && settings.llmApiKey && settings.llmModel),
    apiUrl: settings.llmApiUrl,
    model: settings.llmModel,
    temperature: settings.llmTemperature,
  };
}

export interface SaveSettingsInput {
  apiUrl: string;
  apiKey?: string;
  model: string;
  temperature?: number;
}
