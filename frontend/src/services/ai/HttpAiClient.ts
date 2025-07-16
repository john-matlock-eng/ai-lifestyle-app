import type { AiClient } from "./types";
import apiClient from "../../api/client";

export const HttpAiClient: AiClient = {
  reflect: (body) => apiClient.post("/ai/reflect", body).then((r) => r.data),
  analyzeMood: (body) =>
    apiClient.post("/ai/analyze-mood", body).then((r) => r.data),
  summarizeWeek: (body) =>
    apiClient.post("/ai/summarize-week", body).then((r) => r.data),
};
