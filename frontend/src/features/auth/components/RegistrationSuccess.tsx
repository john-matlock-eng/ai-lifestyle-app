import React from "react";
import { useLocation, Navigate, Link } from "react-router-dom";
import Button from "../../../components/common/Button";

const RegistrationSuccess: React.FC = () => {
  const location = useLocation();
  const state = location.state as { email?: string; message?: string } | null;

  // Redirect to registration if accessed directly without state
  if (!state?.email) {
    return <Navigate to="/register" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[var(--surface)] py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {/* Success Icon */}
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h2 className="mt-6 text-3xl font-extrabold text-[var(--text)]">
              Registration successful!
            </h2>

            <div className="mt-4 space-y-4">
              <p className="text-sm text-muted">
                {state.message || `We've sent a verification email to:`}
              </p>

              <p className="text-sm font-medium text-[var(--text)]">
                {state.email}
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-blue-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Next steps
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <ol className="list-decimal list-inside space-y-1 text-left">
                        <li>Check your email inbox</li>
                        <li>Click the verification link in the email</li>
                        <li>Sign in to your new account</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <Link to="/login" className="block w-full">
                  <Button fullWidth variant="primary">
                    Go to Sign In
                  </Button>
                </Link>

                <p className="text-xs text-gray-500 text-center">
                  Didn't receive the email? Check your spam folder or{" "}
                  <button
                    type="button"
                    className="font-medium text-primary-600 hover:text-primary-500"
                    onClick={() => {
                      // TODO: Implement resend verification email
                      console.log("Resend verification email");
                    }}
                  >
                    resend verification email
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationSuccess;
