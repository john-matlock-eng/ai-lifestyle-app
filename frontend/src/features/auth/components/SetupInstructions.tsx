import React from 'react';

const SetupInstructions: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 mb-4">
          <svg
            className="h-6 w-6 text-primary-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <p className="text-sm text-gray-600">
          Two-factor authentication adds an extra layer of security to your account by requiring a code from your phone in addition to your password.
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900">What you'll need:</h4>
        
        <div className="space-y-3">
          {/* Step 1 */}
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary-100 text-primary-600 text-sm font-medium">
                1
              </div>
            </div>
            <div className="ml-3">
              <h5 className="text-sm font-medium text-gray-900">
                A smartphone with an authenticator app
              </h5>
              <p className="text-sm text-gray-600 mt-1">
                Install Google Authenticator, Microsoft Authenticator, Authy, or similar
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary-100 text-primary-600 text-sm font-medium">
                2
              </div>
            </div>
            <div className="ml-3">
              <h5 className="text-sm font-medium text-gray-900">
                5 minutes to complete setup
              </h5>
              <p className="text-sm text-gray-600 mt-1">
                You'll scan a QR code and save backup codes
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary-100 text-primary-600 text-sm font-medium">
                3
              </div>
            </div>
            <div className="ml-3">
              <h5 className="text-sm font-medium text-gray-900">
                A secure place to store backup codes
              </h5>
              <p className="text-sm text-gray-600 mt-1">
                You'll receive codes to use if you lose your phone
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-green-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-green-900 mb-2">
          Why enable two-factor authentication?
        </h4>
        <ul className="text-sm text-green-700 space-y-1">
          <li className="flex items-start">
            <svg className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Protects your account even if your password is compromised
          </li>
          <li className="flex items-start">
            <svg className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Prevents unauthorized access to your health and lifestyle data
          </li>
          <li className="flex items-start">
            <svg className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Industry-standard security used by major tech companies
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SetupInstructions;
