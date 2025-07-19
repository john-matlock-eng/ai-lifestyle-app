import React, { useRef, useEffect } from "react";
import RegistrationForm from "../../features/auth/components/RegistrationForm";
import AuthLayout from "../../features/auth/components/AuthLayout";
import { useAuthShihTzu } from "../../hooks/useAuthShihTzu";

const RegisterPage: React.FC = () => {
  const companionRef = useRef<ReturnType<typeof useAuthShihTzu> | null>(null);

  const handleShihTzuReady = (companion: ReturnType<typeof useAuthShihTzu>) => {
    companionRef.current = companion;
  };

  useEffect(() => {
    // Special greeting for registration
    if (companionRef.current) {
      companionRef.current.setMood('happy');
      // Move to a welcoming position
      companionRef.current.setPosition({
        x: window.innerWidth / 2 + 200,
        y: 100,
      });
      setTimeout(() => {
        companionRef.current?.setMood('idle');
        companionRef.current?.setPosition({
          x: window.innerWidth - 150,
          y: 50,
        });
      }, 3000);
    }
  }, []);

  return (
    <AuthLayout onShihTzuReady={handleShihTzuReady}>
      <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-theme">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <img
            className="mx-auto h-12 w-auto"
            src="/logo.svg"
            alt="AI Lifestyle App"
            onError={(e) => {
              // Fallback if logo doesn't exist
              e.currentTarget.style.display = 'none';
            }}
          />
          <h1 className="mt-6 text-center text-3xl font-extrabold text-theme">
            AI Lifestyle App
          </h1>
          <p className="mt-2 text-center text-sm text-muted">
            Let's get you started on your journey!
          </p>
        </div>

        <div className="mt-8">
          <RegistrationForm companion={companionRef.current || undefined} />
        </div>
      </div>
    </AuthLayout>
  );
};

export default RegisterPage;
