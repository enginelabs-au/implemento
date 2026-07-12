import type { ImplementoMessage, ImplementoResponse } from "../../shared/messages/types";
import type { PageContext } from "../../shared/reddit/types";

export async function sendToActiveRedditTab<T>(
  message: ImplementoMessage,
): Promise<ImplementoResponse<T>> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    return { ok: false, error: "No active tab found." };
  }
  if (!tab.url?.includes("reddit.com")) {
    return { ok: false, error: "Active tab is not Reddit." };
  }

  try {
    const response = (await chrome.tabs.sendMessage(tab.id, message)) as
      | ImplementoResponse<T>
      | undefined;
    if (!response) {
      return { ok: false, error: "No response from content script." };
    }
    return response;
  } catch (error) {
    const messageText =
      error instanceof Error ? error.message : "Failed to reach content script.";
    return { ok: false, error: messageText };
  }
}

export async function fetchPageContext(
  useJsonFallback = false,
): Promise<ImplementoResponse<PageContext>> {
  return sendToActiveRedditTab<PageContext>({
    type: "GET_PAGE_CONTEXT",
    useJsonFallback,
  });
}
