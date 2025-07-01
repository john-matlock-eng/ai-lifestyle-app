import React from 'react';
import RegistrationForm from '../../features/auth/components/RegistrationForm';
import DevTools from '../../components/common/DevTools';

const RegisterPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img
          className="mx-auto h-12 w-auto"
          src="/logo.svg"
          alt="AI Lifestyle App"
        />
        <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
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
