import React from "react";
import RegistrationForm from "../../features/auth/components/RegistrationForm";

const RegisterPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-background text-theme">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img
          className="mx-auto h-12 w-auto"
          src="/logo.svg"
          alt="AI Lifestyle App"
        />
        <h1 className="mt-6 text-center text-3xl font-extrabold text-theme">
          AI Lifestyle App
        </h1>
      </div>

      <div className="mt-8">
        <RegistrationForm />
      </div>
    </div>
  );
};

export default RegisterPage;
