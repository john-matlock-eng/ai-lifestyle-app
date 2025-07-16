import { setupWorker } from "msw/browser";
import { authHandlers } from "./authHandlers";

// This configures a Service Worker with the given request handlers
export const worker = setupWorker(...authHandlers);

// Start the worker
export async function startMockServiceWorker() {
  if (import.meta.env.MODE === "development") {
    const result = await worker.start({
      onUnhandledRequest: "bypass",
      serviceWorker: {
        url: "/mockServiceWorker.js",
      },
    });

    // Log helpful info for debugging
    const stored = sessionStorage.getItem("msw-mock-users");
    if (stored) {
      const users = new Map(JSON.parse(stored));
      console.log("[MSW] Mock users in database:", Array.from(users.keys()));
    }
    console.log("[MSW] Mock Service Worker Status:");
    console.log("[MSW] ✅ AWS API Endpoints (Real):");
    console.log("  - GET /health");
    console.log("  - POST /auth/register");
    console.log("  - POST /auth/login");
    console.log("  - GET /users/profile");
    console.log("  - POST /auth/refresh");
    console.log("[MSW] ⚠️ Mock-Only Endpoints (Not on AWS yet):");
    console.log("  - POST /auth/mfa/verify");
    console.log(
      "[MSW] Test accounts for local development (MFA testing only):",
    );
    console.log("  - user@example.com / ExistingP@ss123 (no MFA)");
    console.log("  - mfa@example.com / MfaUserP@ss123 (MFA enabled)");

    return result;
  }
}
