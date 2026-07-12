export type OAuthStatus = "not_configured" | "configured";

export interface OAuthState {
  status: OAuthStatus;
  message: string;
}

export function getOAuthStatus(): OAuthState {
  return {
    status: "not_configured",
    message:
      "Reddit OAuth is not configured. See docs/plans/final_implementation_checklist.md for REDDIT_CLIENT_ID and backend proxy setup.",
  };
}

export class OAuthNotConfiguredError extends Error {
  constructor(message = "Reddit OAuth is not configured in v1.") {
    super(message);
    this.name = "OAuthNotConfiguredError";
  }
}
