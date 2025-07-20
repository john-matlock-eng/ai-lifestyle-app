import React, { useState } from "react";
import apiClient from "../../../api/client";

const TestRegistrationForm: React.FC = () => {
  const [response, setResponse] = useState<string>("");
  const [error, setError] = useState<string>("");

  const testRegistration = async () => {
    try {
      // Test 1: Direct API call with camelCase
      const payload1 = {
        firstName: "John",
        lastName: "Matlock",
        email: "john@matlock.engineering",
        password: "TestPassword123!"
      };
      
      console.log("Test 1 - Sending camelCase payload:", JSON.stringify(payload1));
      
      const result1 = await apiClient.post("/auth/register", payload1);
      setResponse(`Success with camelCase: ${JSON.stringify(result1.data)}`);
    } catch (err: any) {
      console.error("Test 1 failed:", err);
      setError(`Test 1 failed: ${err.response?.data?.message || err.message}`);
      
      // Test 2: Try with snake_case
      try {
        const payload2 = {
          first_name: "John",
          last_name: "Matlock",
          email: "john@matlock.engineering",
          password: "TestPassword123!"
        };
        
        console.log("Test 2 - Sending snake_case payload:", JSON.stringify(payload2));
        
        const result2 = await apiClient.post("/auth/register", payload2);
        setResponse(`Success with snake_case: ${JSON.stringify(result2.data)}`);
      } catch (err2: any) {
        console.error("Test 2 also failed:", err2);
        setError(prev => prev + `\nTest 2 failed: ${err2.response?.data?.message || err2.message}`);
      }
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Registration API Test</h2>
      
      <button
        onClick={testRegistration}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Test Registration API
      </button>
      
      {response && (
        <div className="mt-4 p-4 bg-green-100 rounded">
          <h3 className="font-bold">Success:</h3>
          <pre className="text-sm">{response}</pre>
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-4 bg-red-100 rounded">
          <h3 className="font-bold">Error:</h3>
          <pre className="text-sm whitespace-pre-wrap">{error}</pre>
        </div>
      )}
      
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h3 className="font-bold">Check Console for:</h3>
        <ul className="list-disc list-inside text-sm">
          <li>Exact payload being sent</li>
          <li>Response details</li>
          <li>Any transformation by axios interceptors</li>
        </ul>
      </div>
    </div>
  );
};

export default TestRegistrationForm;