// Super simple registration to test API without any complexity
import React from "react";

const RegisterTestPage: React.FC = () => {
  const handleTestRegistration = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: "John",
          lastName: "Matlock", 
          email: "john@matlock.engineering",
          password: "TestPassword123!"
        })
      });

      const data = await response.json();
      console.log('Response status:', response.status);
      console.log('Response data:', data);
      
      if (!response.ok) {
        console.error('Registration failed:', data);
      } else {
        console.log('Registration successful!', data);
      }
    } catch (error) {
      console.error('Network error:', error);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Direct API Test (No Axios)</h1>
      <button 
        onClick={handleTestRegistration}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Test Registration with Fetch
      </button>
      <p className="mt-4 text-sm text-gray-600">
        Open console to see the exact request/response
      </p>
    </div>
  );
};

export default RegisterTestPage;