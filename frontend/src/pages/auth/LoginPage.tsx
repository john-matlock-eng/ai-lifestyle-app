import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import EnhancedLoginForm from "../../features/auth/components/EnhancedLoginForm";
import AuthLayout from "../../features/auth/components/AuthLayout";
import { EllieLogo } from "../../components/common";
import type { useEnhancedAuthShihTzu } from "../../hooks/useEnhancedAuthShihTzu";

const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState<{
    type: "info" | "error";
    text: string;
  } | null>(null);
  const [companion, setCompanion] = useState<
    ReturnType<typeof useEnhancedAuthShihTzu> | undefined
  >(undefined);

  useEffect(() => {
    const messageParam = searchParams.get("message");

    if (messageParam === "session_expired") {
      setMessage({
        type: "info",
        text: "Your session has expired. Please sign in again.",
      });
    } else if (messageParam === "security_logout") {
      setMessage({
        type: "info",
        text: "You have been logged out for security reasons. Please sign in again.",
      });
    } else if (messageParam === "logout_success") {
      setMessage({
        type: "info",
        text: "You have been successfully logged out.",
      });
    }
  }, [searchParams]);

  return (
    <AuthLayout onShihTzuReady={setCompanion}>
      <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-theme">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <EllieLogo variant="full" size="lg" className="mb-4" />
          </div>
          <h1 className="mt-6 text-center text-3xl font-extrabold text-theme">
            AI Lifestyle App
          </h1>
          <p className="mt-2 text-center text-sm text-muted">
            Welcome back! Ellie is excited to see you 🐕✨
          </p>
        </div>

        <div className="mt-8">
          {message && (
            <div className="max-w-md mx-auto mb-4">
              <div
                className={`rounded-md p-4 ${
                  message.type === "error"
                    ? "bg-red-50 text-red-800 border border-red-200"
                    : "bg-blue-50 text-blue-800 border border-blue-200"
                }`}
              >
                <p className="text-sm">{message.text}</p>
              </div>
            </div>
          )}
          <EnhancedLoginForm companion={companion} />
        </div>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
