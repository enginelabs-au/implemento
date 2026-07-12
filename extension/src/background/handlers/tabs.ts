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

  return sendToTab<T>(tab.id, message);
}

export async function sendToTab<T>(
  tabId: number,
  message: ImplementoMessage,
  retries = 4,
): Promise<ImplementoResponse<T>> {
  let lastError = "No response from content script.";

  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      const response = (await chrome.tabs.sendMessage(tabId, message)) as
        | ImplementoResponse<T>
        | undefined;
      if (response) return response;
    } catch (error) {
      lastError =
        error instanceof Error ? error.message : "Failed to reach content script.";
      await sleep(500);
    }
  }

  return { ok: false, error: lastError };
}

export async function fetchPageContext(
  useJsonFallback = false,
): Promise<ImplementoResponse<PageContext>> {
  return sendToActiveRedditTab<PageContext>({
    type: "GET_PAGE_CONTEXT",
    useJsonFallback,
  });
}

export async function fetchPageContextFromUrl(
  url: string,
  useJsonFallback = false,
): Promise<ImplementoResponse<PageContext>> {
  const tab = await chrome.tabs.create({ url, active: false });
  if (!tab.id) {
    return { ok: false, error: "Failed to open Reddit tab." };
  }

  try {
    await waitForTabComplete(tab.id);
    await sleep(1200);
    return sendToTab<PageContext>(
      tab.id,
      { type: "GET_PAGE_CONTEXT", useJsonFallback },
      6,
    );
  } finally {
    try {
      await chrome.tabs.remove(tab.id);
    } catch {
      // Tab may already be closed.
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitForTabComplete(tabId: number, timeoutMs = 20000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      reject(new Error("Reddit tab load timed out."));
    }, timeoutMs);

    const listener = (id: number, info: chrome.tabs.TabChangeInfo) => {
      if (id === tabId && info.status === "complete") {
        clearTimeout(timer);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };

    chrome.tabs.onUpdated.addListener(listener);
    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError) return;
      if (tab.status === "complete") {
        clearTimeout(timer);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    });
  });
}
