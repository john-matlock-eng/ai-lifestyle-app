import { createContext, useContext } from "react";
import { HttpAiClient } from "./HttpAiClient";
import { MockAiClient } from "./MockAiClient";
import type { AiClient } from "./types";

const client: AiClient =
  import.meta.env.VITE_USE_AI_MOCK === "true" ? MockAiClient : HttpAiClient;

const AiContext = createContext<AiClient>(client);
export const AiProvider = AiContext.Provider;
export const useAi = () => useContext(AiContext);
