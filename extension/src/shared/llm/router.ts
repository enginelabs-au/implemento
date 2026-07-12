import {
  callChatCompletions,
  estimateUsdCost,
  type ChatCompletionResult,
} from "./openai-client";
import {
  chainFromPreferredModel,
  GEMINI_API_URL,
  OPENROUTER_API_URL,
  OPENROUTER_HARD_TASK_MODEL,
  OPENROUTER_NANO_MODEL,
} from "./model-config";
import { BUILD_LLM_SECRETS } from "./secrets.generated";
import type { LlmCompletionRequest, LlmCompletionResponse } from "./types";

export interface ResolvedLlmRuntime {
  preferredModel: string;
  temperature: number;
  geminiApiKey: string;
  openrouterApiKey: string;
}

export interface HardTaskSpendState {
  date: string;
  usd: number;
}

export interface CompleteWithRouterOptions {
  hardTaskSpend?: HardTaskSpendState;
  onHardTaskSpend?: (next: HardTaskSpendState) => Promise<void>;
  fetchImpl?: typeof fetch;
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function maxReasoningGemini() {
  return { geminiReasoningEffort: "high" as const };
}

function maxReasoningOpenRouter(mode?: "pro") {
  return mode === "pro"
    ? { openrouterReasoning: { mode: "pro" as const } }
    : { openrouterReasoning: { effort: "high" as const } };
}

export function resolveLlmRuntime(storage: {
  llmModel?: string;
  llmTemperature?: number;
  llmApiKey?: string;
}): ResolvedLlmRuntime {
  const preferredModel = storage.llmModel || BUILD_LLM_SECRETS.defaultModel;
  return {
    preferredModel,
    temperature: storage.llmTemperature ?? BUILD_LLM_SECRETS.defaultTemperature,
    geminiApiKey: storage.llmApiKey || BUILD_LLM_SECRETS.geminiApiKey,
    openrouterApiKey: BUILD_LLM_SECRETS.openrouterApiKey,
  };
}

export function isLlmRuntimeConfigured(runtime: ResolvedLlmRuntime): boolean {
  return Boolean(
    runtime.geminiApiKey && runtime.openrouterApiKey && runtime.preferredModel,
  );
}

async function tryEndpoint(
  endpoint: {
    apiUrl: string;
    apiKey: string;
    model: string;
    provider: "gemini" | "openrouter";
    reasoning?: ReturnType<typeof maxReasoningGemini> | ReturnType<typeof maxReasoningOpenRouter>;
  },
  request: LlmCompletionRequest,
  temperature: number,
  fetchImpl?: typeof fetch,
): Promise<ChatCompletionResult> {
  return callChatCompletions(
    {
      apiUrl: endpoint.apiUrl,
      apiKey: endpoint.apiKey,
      model: endpoint.model,
      provider: endpoint.provider,
      temperature,
      system: request.system,
      user: request.user,
      reasoning: endpoint.reasoning,
    },
    fetchImpl,
  );
}

export async function completeWithRouter(
  runtime: ResolvedLlmRuntime,
  request: LlmCompletionRequest,
  options: CompleteWithRouterOptions = {},
): Promise<LlmCompletionResponse> {
  const fetchImpl = options.fetchImpl;
  const errors: string[] = [];
  const chain = chainFromPreferredModel(runtime.preferredModel);

  for (const model of chain) {
    try {
      const result = await tryEndpoint(
        {
          apiUrl: BUILD_LLM_SECRETS.geminiApiUrl || GEMINI_API_URL,
          apiKey: runtime.geminiApiKey,
          model,
          provider: "gemini",
          reasoning: maxReasoningGemini(),
        },
        request,
        runtime.temperature,
        fetchImpl,
      );
      return { content: result.content };
    } catch (error) {
      errors.push(`${model}: ${error instanceof Error ? error.message : "failed"}`);
    }
  }

  const nanoModel = BUILD_LLM_SECRETS.openrouterNanoModel || OPENROUTER_NANO_MODEL;
  try {
    const result = await tryEndpoint(
      {
        apiUrl: BUILD_LLM_SECRETS.openrouterApiUrl || OPENROUTER_API_URL,
        apiKey: runtime.openrouterApiKey,
        model: nanoModel,
        provider: "openrouter",
        reasoning: maxReasoningOpenRouter(),
      },
      request,
      runtime.temperature,
      fetchImpl,
    );
    return { content: result.content };
  } catch (error) {
    errors.push(`${nanoModel}: ${error instanceof Error ? error.message : "failed"}`);
  }

  const spend = options.hardTaskSpend;
  const maxDaily = BUILD_LLM_SECRETS.hardTaskMaxDailyUsd;
  const spentToday =
    spend?.date === todayUtc() ? spend.usd : 0;

  if (spentToday < maxDaily && options.onHardTaskSpend) {
    const hardModel = BUILD_LLM_SECRETS.hardTaskModel || OPENROUTER_HARD_TASK_MODEL;
    try {
      const result = await tryEndpoint(
        {
          apiUrl: BUILD_LLM_SECRETS.openrouterApiUrl || OPENROUTER_API_URL,
          apiKey: runtime.openrouterApiKey,
          model: hardModel,
          provider: "openrouter",
          reasoning: maxReasoningOpenRouter("pro"),
        },
        request,
        runtime.temperature,
        fetchImpl,
      );
      const cost = estimateUsdCost(hardModel, result.usage);
      await options.onHardTaskSpend({
        date: todayUtc(),
        usd: spentToday + cost,
      });
      return { content: result.content };
    } catch (error) {
      errors.push(`${hardModel}: ${error instanceof Error ? error.message : "failed"}`);
    }
  }

  throw new Error(`All LLM providers failed.\n${errors.join("\n")}`);
}
