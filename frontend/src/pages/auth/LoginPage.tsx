import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import LoginForm from '../../features/auth/components/LoginForm';
// import DevTools from '../../components/common/DevTools';

const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState<{ type: 'info' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const messageParam = searchParams.get('message');
    
    if (messageParam === 'session_expired') {
      setMessage({
        type: 'info',
        text: 'Your session has expired. Please sign in again.',
      });
    } else if (messageParam === 'security_logout') {
      setMessage({
        type: 'info',
        text: 'You have been logged out for security reasons. Please sign in again.',
      });
    } else if (messageParam === 'logout_success') {
      setMessage({
        type: 'info',
        text: 'You have been successfully logged out.',
      });
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-background text-theme">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="mt-6 text-center text-3xl font-extrabold text-theme">
          AI Lifestyle App
        </h1>
      </div>

      <div className="mt-8">
        {message && (
          <div className="max-w-md mx-auto mb-4">
            <div
              className={`rounded-md p-4 ${
                message.type === 'error'
                  ? 'bg-red-50 text-red-800 border border-red-200'
                  : 'bg-blue-50 text-blue-800 border border-blue-200'
              }`}
            >
              <p className="text-sm">{message.text}</p>
            </div>
          </div>
        )}
        <LoginForm />
      </div>
    </div>
  );
};

export default LoginPage;
