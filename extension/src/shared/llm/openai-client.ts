export interface ChatCompletionRequest {
  apiUrl: string;
  apiKey: string;
  model: string;
  temperature?: number;
  system: string;
  user: string;
}

export interface ChatCompletionResult {
  content: string;
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

export async function callChatCompletions(
  request: ChatCompletionRequest,
  fetchImpl: FetchFn = fetch,
): Promise<ChatCompletionResult> {
  const url = normalizeCompletionsUrl(request.apiUrl);
  const response = await fetchImpl(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${request.apiKey}`,
    },
    body: JSON.stringify({
      model: request.model,
      temperature: request.temperature ?? 0.2,
      messages: [
        { role: "system", content: request.system },
        { role: "user", content: request.user },
      ],
    }),
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
  };
  const content = json.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("LLM response missing message content.");
  }
  return { content };
}

export function extractApiOriginPattern(apiUrl: string): string | null {
  try {
    const origin = new URL(apiUrl).origin;
    return `${origin}/*`;
  } catch {
    return null;
  }
}
