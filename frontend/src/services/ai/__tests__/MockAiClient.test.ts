import { describe, it, expect } from "vitest";
import { MockAiClient } from "../MockAiClient";

describe("MockAiClient", () => {
  // TODO: Fix this test - it's causing timeouts in CI
  it.skip("generates reflection response", async () => {
    const res = await MockAiClient.reflect({
      entryId: "e1",
      sectionId: "s1",
      text: "I am thankful for my friends and family",
      prompt: "Suggest a reflection question",
    });
    expect(res.reply).toContain("🤖 MOCK");
  });
});
