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
    const timer = setTimeout(() => {
      if (companionRef.current) {
        companionRef.current.setMood('happy');
        // Move to a welcoming position
        const formWidth = 400;
        const formCenterX = window.innerWidth / 2;
        companionRef.current.setPosition({
          x: Math.min(formCenterX + formWidth / 2 + 50, window.innerWidth - 150),
          y: 150,
        });
        setTimeout(() => {
          companionRef.current?.setMood('idle');
        }, 3000);
      }
    }, 100); // Small delay to ensure companion is ready
    
    return () => clearTimeout(timer);
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
