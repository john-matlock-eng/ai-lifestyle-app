import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts";
import { Button } from "./common";

export const SessionWarning: React.FC = () => {
  const {
    isSessionWarningActive,
    sessionExpiry,
    refreshSession,
    dismissSessionWarning,
    logout,
  } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    if (!isSessionWarningActive || !sessionExpiry) return;

    const updateTimeRemaining = () => {
      const now = new Date();
      const remaining = sessionExpiry.getTime() - now.getTime();

      if (remaining <= 0) {
        setTimeRemaining("Session expired");
        return;
      }

      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, "0")}`);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [isSessionWarningActive, sessionExpiry]);

  if (!isSessionWarningActive) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div
          className="fixed inset-0 bg-black/60 transition-opacity"
          onClick={dismissSessionWarning}
        />

        <div className="relative transform overflow-hidden rounded-lg bg-[var(--surface)] px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
          <div>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
              <svg
                className="h-6 w-6 text-yellow-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>

            <div className="mt-3 text-center sm:mt-5">
              <h3 className="text-base font-semibold leading-6 text-[var(--text)]">
                Session Expiring Soon
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Your session will expire in{" "}
                  <span className="font-semibold text-[var(--text)]">
                    {timeRemaining}
                  </span>
                  . Would you like to continue working?
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
            <Button
              type="button"
              onClick={refreshSession}
              className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
            >
              Continue Session
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => logout("manual")}
              className="mt-3 inline-flex w-full justify-center rounded-md bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[var(--text)] shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-[color:var(--surface-muted)] sm:col-start-1 sm:mt-0"
            >
              Log Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
