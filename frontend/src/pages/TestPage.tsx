// Temporary test page for debugging registration
import React from "react";
import TestRegistrationForm from "../features/auth/components/TestRegistrationForm";

const TestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <TestRegistrationForm />
    </div>
  );
};

export default TestPage;
