import React, { useState } from 'react';
import axios, { AxiosError } from 'axios';

interface ApiResponse {
  status: number;
  headers: Record<string, string>;
  data: unknown;
}

interface ApiErrorResponse {
  message: string;
  status?: number;
  statusText?: string;
  data?: unknown;
  headers?: Record<string, string>;
  config?: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    data?: unknown;
  };
}

type HttpMethod = 'GET' | 'POST' | 'OPTIONS';

const ApiDebugger: React.FC = () => {
  const [response, setResponse] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testEndpoint = async (path: string, method: HttpMethod = 'GET', data?: Record<string, unknown>) => {
    setLoading(true);
    setResponse('');
    setError('');

    const apiUrl = import.meta.env.VITE_API_URL;
    const fullUrl = `${apiUrl}${path}`;

    try {
      console.log(`Testing ${method} ${fullUrl}`, data);
      
      const config = {
        method,
        url: fullUrl,
        headers: {
          'Content-Type': 'application/json',
        },
        data: method === 'POST' ? data : undefined,
      };

      const result = await axios(config);
      
      const apiResponse: ApiResponse = {
        status: result.status,
        headers: result.headers as Record<string, string>,
        data: result.data
      };
      
      setResponse(JSON.stringify(apiResponse, null, 2));
    } catch (err) {
      console.error('API Test Error:', err);
      
      const axiosError = err as AxiosError;
      const errorResponse: ApiErrorResponse = {
        message: axiosError.message,
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        headers: axiosError.response?.headers as Record<string, string>,
        config: {
          url: axiosError.config?.url,
          method: axiosError.config?.method,
          headers: axiosError.config?.headers as Record<string, string>,
          data: axiosError.config?.data
        }
      };
      
      setError(JSON.stringify(errorResponse, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const tests = [
    {
      name: 'Test API Base URL',
      action: () => testEndpoint('/', 'GET')
    },
    {
      name: 'Test Health Check',
      action: () => testEndpoint('/health', 'GET')
    },
    {
      name: 'Test Auth Login (with test data)',
      action: () => testEndpoint('/auth/login', 'POST', {
        email: 'test@example.com',
        password: 'Test123!'
      })
    },
    {
      name: 'Test Auth Login (username variant)',
      action: () => testEndpoint('/auth/login', 'POST', {
        username: 'test@example.com',
        password: 'Test123!'
      })
    },
    {
      name: 'Test OPTIONS (CORS preflight)',
      action: () => testEndpoint('/auth/login', 'OPTIONS')
    }
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">API Debugger</h2>
      
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <p className="font-semibold">API URL: {import.meta.env.VITE_API_URL || 'Not configured'}</p>
        <p className="text-sm text-gray-600">Environment: {import.meta.env.VITE_ENVIRONMENT}</p>
      </div>

      <div className="space-y-2 mb-6">
        {tests.map((test, index) => (
          <button
            key={index}
            onClick={test.action}
            disabled={loading}
            className="block w-full text-left px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {test.name}
          </button>
        ))}
      </div>

      {loading && (
        <div className="mb-4 p-4 bg-blue-100 rounded">
          <p>Testing API...</p>
        </div>
      )}

      {response && (
        <div className="mb-4">
          <h3 className="font-semibold text-green-600 mb-2">Success Response:</h3>
          <pre className="p-4 bg-green-50 rounded overflow-auto text-sm">
            {response}
          </pre>
        </div>
      )}

      {error && (
        <div className="mb-4">
          <h3 className="font-semibold text-red-600 mb-2">Error Response:</h3>
          <pre className="p-4 bg-red-50 rounded overflow-auto text-sm">
            {error}
          </pre>
        </div>
      )}

      <div className="mt-6 p-4 bg-yellow-50 rounded">
        <h3 className="font-semibold mb-2">Common Issues:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>CORS not enabled on API Gateway</li>
          <li>Missing stage name in API URL (e.g., /dev or /v1)</li>
          <li>Request format mismatch (email vs username)</li>
          <li>API Gateway method not deployed</li>
        </ul>
      </div>
    </div>
  );
};

export default ApiDebugger;
