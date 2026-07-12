export type LlmProvider = "gemini" | "openrouter";

export interface LlmReasoningConfig {
  geminiReasoningEffort?: "high";
  openrouterReasoning?: { effort?: "high"; mode?: "pro" };
}

export interface ChatCompletionRequest {
  apiUrl: string;
  apiKey: string;
  model: string;
  provider: LlmProvider;
  temperature?: number;
  system: string;
  user: string;
  reasoning?: LlmReasoningConfig;
}

export interface ChatCompletionUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ChatCompletionResult {
  content: string;
  usage?: ChatCompletionUsage;
}

export class LlmHttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "LlmHttpError";
    this.status = status;
  }
}

type FetchFn = typeof fetch;

function normalizeCompletionsUrl(apiUrl: string): string {
  const trimmed = apiUrl.replace(/\/+$/, "");
  if (trimmed.endsWith("/chat/completions")) return trimmed;
  if (trimmed.endsWith("/v1")) return `${trimmed}/chat/completions`;
  return `${trimmed}/v1/chat/completions`;
}

function buildRequestBody(request: ChatCompletionRequest): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: request.model,
    temperature: request.temperature ?? 0.2,
    messages: [
      { role: "system", content: request.system },
      { role: "user", content: request.user },
    ],
  };

  if (request.provider === "gemini") {
    body.reasoning_effort = request.reasoning?.geminiReasoningEffort ?? "high";
  }

  if (request.provider === "openrouter" && request.reasoning?.openrouterReasoning) {
    body.reasoning = request.reasoning.openrouterReasoning;
  }

  return body;
}

function buildHeaders(request: ChatCompletionRequest): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${request.apiKey}`,
  };
  if (request.provider === "openrouter") {
    headers["HTTP-Referer"] = "https://github.com/enginelabs-au/implemento";
    headers["X-Title"] = "Implemento";
  }
  return headers;
}

export async function callChatCompletions(
  request: ChatCompletionRequest,
  fetchImpl: FetchFn = fetch,
): Promise<ChatCompletionResult> {
  const url = normalizeCompletionsUrl(request.apiUrl);
  const response = await fetchImpl(url, {
    method: "POST",
    headers: buildHeaders(request),
    body: JSON.stringify(buildRequestBody(request)),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new LlmHttpError(
      response.status,
      `LLM request failed (${response.status}): ${body.slice(0, 200)}`,
    );
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    };
  };
  const content = json.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("LLM response missing message content.");
  }

  const usage = json.usage
    ? {
        promptTokens: json.usage.prompt_tokens ?? 0,
        completionTokens: json.usage.completion_tokens ?? 0,
        totalTokens: json.usage.total_tokens ?? 0,
      }
    : undefined;

  return { content, usage };
}

export function extractApiOriginPattern(apiUrl: string): string | null {
  try {
    const origin = new URL(apiUrl).origin;
    return `${origin}/*`;
  } catch {
    return null;
  }
}

export function estimateUsdCost(
  model: string,
  usage?: ChatCompletionUsage,
): number {
  if (!usage) return 0.05;
  const input = usage.promptTokens / 1_000_000;
  const output = usage.completionTokens / 1_000_000;

  if (model.includes("gpt-5.6-sol-pro")) {
    return input * 5 + output * 30;
  }
  if (model.includes("gpt-5.4-nano")) {
    return input * 0.2 + output * 1.25;
  }
  return input * 0.5 + output * 2;
}
