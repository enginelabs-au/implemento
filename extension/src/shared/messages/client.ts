import type { ImplementoMessage, ImplementoResponse } from "./types";

export function sendMessage<T = unknown>(
  message: ImplementoMessage,
): Promise<ImplementoResponse<T>> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response: ImplementoResponse<T>) => {
      if (chrome.runtime.lastError) {
        resolve({
          ok: false,
          error: chrome.runtime.lastError.message ?? "Message failed.",
        });
        return;
      }
      resolve(response ?? { ok: false, error: "Empty response." });
    });
  });
}
