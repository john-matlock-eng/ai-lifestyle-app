import React, { useState } from "react";
import EnhancedRegistrationForm from "../../features/auth/components/EnhancedRegistrationForm";
import AuthLayout from "../../features/auth/components/AuthLayout";
import { EllieLogo } from "../../components/common";
import type { useEnhancedAuthShihTzu } from "../../hooks/useEnhancedAuthShihTzu";

const RegisterPage: React.FC = () => {
  const [companion, setCompanion] = useState<ReturnType<typeof useEnhancedAuthShihTzu> | undefined>(undefined);

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
            Let's get you started with Ellie, your wellness companion! 🌟
          </p>
        </div>

        <div className="mt-8">
          <EnhancedRegistrationForm companion={companion} />
        </div>
      </div>
    </AuthLayout>
  );
};

export default RegisterPage;
