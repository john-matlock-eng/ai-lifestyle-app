import React from 'react';
import { Link } from 'react-router-dom';

const TestNavigation: React.FC = () => {
  return (
    <div className="fixed bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4 z-50">
      <h3 className="text-sm font-semibold mb-2">Test Navigation</h3>
      <div className="flex flex-col gap-2">
        <Link 
          to="/login" 
          className="text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Login (Production)
        </Link>
        <Link 
          to="/register" 
          className="text-xs px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          Register (Production)
        </Link>
        <Link 
          to="/auth-test" 
          className="text-xs px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
        >
          Auth Test (Debug)
        </Link>
        <div className="mt-2 pt-2 border-t">
          <p className="text-xs text-gray-600">
            Check console for errors
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestNavigation;