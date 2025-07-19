import type { AiClient } from "./types";

function delay(ms = 600) {
  return new Promise((res) => setTimeout(res, ms));
}

export const MockAiClient: AiClient = {
  async reflect({ text, prompt }) {
    await delay();
    return {
      reply: `🤖 MOCK: Based on "${text.slice(0, 40)}...", here's a reflective Q:\n${prompt.replace(/Suggest|Which|Describe/i, "In your opinion,")}`,
    };
  },

  async analyzeMood() {
    await delay();
    return {
      emotions: {
        joy: 0.4,
        sadness: 0.1,
        anger: 0.05,
        fear: 0.05,
        neutral: 0.4,
      },
    };
  },

  async summarizeWeek({ entries }) {
    await delay(800);
    return {
      summary: `🤖 MOCK: You wrote ${entries.length} entries. Keep it up!`,
      highlights: ["Consistency ✅", "Mood trending positive 📈"],
    };
  },
};
