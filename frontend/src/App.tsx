import { Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { store } from "./store";
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'; // Commented out for React 19 compatibility

// Context
import { AuthProvider } from "./contexts";
import { EncryptionProvider } from "./contexts/EncryptionContext";
import { FeatureFlagsProvider } from "./contexts/FeatureFlagsContext";

// Layouts
import PublicLayout from "./components/layout/PublicLayout";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages - Auth
import RegisterPage from "./pages/auth/RegisterPage";
import RegisterSuccessPage from "./pages/auth/RegisterSuccessPage";
import LoginPage from "./pages/auth/LoginPage";

// Pages - App
import DashboardPage from "./pages/DashboardPage";
import SettingsPage from "./pages/SettingsPage";

// Pages - Goals
import GoalsPage from "./pages/goals/GoalsPage";
import CreateGoalPage from "./pages/goals/CreateGoalPage";
import GoalDetailPage from "./pages/goals/GoalDetailPage";

// Pages - Journal
import {
  JournalPageEnhanced,
  JournalEditPageEnhanced,
  JournalViewPageEnhanced,
  SharedJournalsPage,
  JournalImportPage,
} from "./features/journal/pages";
import JournalDebugPage from "./pages/journal/JournalDebugPage";

// Components
import DevTools from "./components/common/DevTools";
import { SessionWarning } from "./components/SessionWarning";
import { EncryptionUnlockPrompt } from "./components/EncryptionUnlockPrompt";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error: unknown) => {
        // Don't retry on 4xx errors
        const axiosError = error as { response?: { status?: number } };
        if (
          axiosError?.response?.status &&
          axiosError.response.status >= 400 &&
          axiosError.response.status < 500
        ) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <FeatureFlagsProvider>
            <EncryptionProvider>
              <Routes>
                {/* Public Routes */}
                <Route element={<PublicLayout />}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route
                    path="/register/success"
                    element={<RegisterSuccessPage />}
                  />
                  <Route
                    path="/forgot-password"
                    element={<div>Forgot Password - Coming Soon</div>}
                  />
                  <Route
                    path="/reset-password/:token"
                    element={<div>Reset Password - Coming Soon</div>}
                  />
                  <Route
                    path="/verify-email/:token"
                    element={<div>Verify Email - Coming Soon</div>}
                  />
                </Route>

                {/* Protected Routes */}
                <Route
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route
                    path="/profile"
                    element={<div>Profile - Coming Soon</div>}
                  />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route
                    path="/settings/security"
                    element={<div>Security Settings - Coming Soon</div>}
                  />

                  {/* Goals Routes */}
                  <Route path="/goals" element={<GoalsPage />} />
                  <Route path="/goals/new" element={<CreateGoalPage />} />
                  <Route path="/goals/:goalId" element={<GoalDetailPage />} />

                  <Route
                    path="/meals"
                    element={<div>Meals - Coming Soon</div>}
                  />
                  <Route
                    path="/workouts"
                    element={<div>Workouts - Coming Soon</div>}
                  />

                  {/* Journal Routes */}
                  <Route path="/journal" element={<JournalPageEnhanced />} />
                  <Route
                    path="/journal/new"
                    element={<JournalEditPageEnhanced />}
                  />
                  <Route
                    path="/journal/shared"
                    element={<SharedJournalsPage />}
                  />
                  <Route
                    path="/journal/import"
                    element={<JournalImportPage />}
                  />
                  <Route path="/journal/debug" element={<JournalDebugPage />} />
                  <Route
                    path="/journal/:entryId"
                    element={<JournalViewPageEnhanced />}
                  />
                  <Route
                    path="/journal/:entryId/edit"
                    element={<JournalEditPageEnhanced />}
                  />
                </Route>

                {/* Default redirect */}
                <Route
                  path="/"
                  element={<Navigate to="/dashboard" replace />}
                />
              </Routes>

              {/* Global Components */}
              <SessionWarning />
              <EncryptionUnlockPrompt />
              <DevTools />
            </EncryptionProvider>
          </FeatureFlagsProvider>
        </AuthProvider>
      </QueryClientProvider>
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </Provider>
  );
}

export default App;
