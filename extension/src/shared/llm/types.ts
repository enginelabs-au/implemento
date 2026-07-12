export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LlmCompletionRequest {
  system: string;
  user: string;
  temperature?: number;
}

export interface LlmCompletionResponse {
  content: string;
}

export interface LlmSettings {
  apiUrl?: string;
  apiKey?: string;
  model?: string;
  temperature?: number;
}

export class NotConfiguredError extends Error {
  constructor(message = "LLM is not configured") {
    super(message);
    this.name = "NotConfiguredError";
  }
}
