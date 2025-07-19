import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import LoginForm from "../../features/auth/components/LoginForm";
import AuthLayout from "../../features/auth/components/AuthLayout";
import { useAuthShihTzu } from "../../hooks/useAuthShihTzu";

const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState<{
    type: "info" | "error";
    text: string;
  } | null>(null);
  const companionRef = useRef<ReturnType<typeof useAuthShihTzu>>();

  useEffect(() => {
    const messageParam = searchParams.get("message");

    if (messageParam === "session_expired") {
      setMessage({
        type: "info",
        text: "Your session has expired. Please sign in again.",
      });
      // Show concerned shih tzu
      if (companionRef.current) {
        companionRef.current.setMood('idle');
        companionRef.current.handleError();
      }
    } else if (messageParam === "security_logout") {
      setMessage({
        type: "info",
        text: "You have been logged out for security reasons. Please sign in again.",
      });
      if (companionRef.current) {
        companionRef.current.showCuriosity();
      }
    } else if (messageParam === "logout_success") {
      setMessage({
        type: "info",
        text: "You have been successfully logged out.",
      });
      // Wave goodbye
      if (companionRef.current) {
        companionRef.current.setMood('happy');
        // Move to center and wave
        companionRef.current.setPosition({
          x: window.innerWidth / 2 - 50,
          y: 100,
        });
        setTimeout(() => {
          companionRef.current?.setMood('idle');
          // Move back to corner
          companionRef.current?.setPosition({
            x: window.innerWidth - 150,
            y: 50,
          });
        }, 3000);
      }
    }
  }, [searchParams]);

  const handleShihTzuReady = (companion: ReturnType<typeof useAuthShihTzu>) => {
    companionRef.current = companion;
  };

  return (
    <AuthLayout onShihTzuReady={handleShihTzuReady}>
      <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-theme">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h1 className="mt-6 text-center text-3xl font-extrabold text-theme">
            AI Lifestyle App
          </h1>
          <p className="mt-2 text-center text-sm text-muted">
            Your companion is here to help!
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
          <LoginForm companion={companionRef.current} />
        </div>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
