import { describe, expect, it } from "vitest";
import { PostEthicsError, assertDraftEthics, scanDraftEthics } from "./ethics";

describe("post ethics", () => {
  it("flags critical astroturfing language", () => {
    expect(() =>
      assertDraftEthics({
        title: "Great tool",
        body: "Use astroturfing to boost visibility",
        riskNotes: "",
        promoRisk: "low",
      }),
    ).toThrow(PostEthicsError);
  });

  it("elevates promo risk on warning patterns", () => {
    const result = scanDraftEthics({
      title: "Check out my product",
      body: "Sign up now for early access",
      riskNotes: "Mention affiliation",
      promoRisk: "low",
    });
    expect(result.elevatedRisk).toBe("medium");
  });
});
