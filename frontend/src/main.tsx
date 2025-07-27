import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import "./styles/habit-animations.css";
import App from "./App.tsx";
import { ThemeProvider } from "./contexts";

// Start MSW in development
async function prepare() {
  if (import.meta.env.MODE === "development") {
    try {
      const { startMockServiceWorker } = await import("./mocks/browser");
      await startMockServiceWorker();
      console.log("[App] MSW initialized successfully");
    } catch (error) {
      console.error("[App] Failed to start MSW:", error);
      console.log("[App] API calls will fail unless backend is running");
    }
  }
}

prepare().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <ThemeProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </StrictMode>,
  );
});
