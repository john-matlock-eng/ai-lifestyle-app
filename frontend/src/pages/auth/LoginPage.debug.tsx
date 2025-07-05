import React from 'react';

const LoginPage: React.FC = () => {

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          AI Lifestyle App - Debug Mode
        </h1>
      </div>

      <div className="mt-8 w-full max-w-md mx-auto">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <h2 className="text-center text-2xl font-bold text-gray-900 mb-6">
            Login Form Loading Test
          </h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded">
              <p className="text-sm">React Version: {React.version}</p>
            </div>
            
            <div className="p-4 bg-green-50 rounded">
              <p className="text-sm">If you can see this, the page is rendering correctly.</p>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded">
              <p className="text-sm">The LoginForm component may have an issue.</p>
            </div>
            
            <button 
              onClick={() => window.location.reload()} 
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
