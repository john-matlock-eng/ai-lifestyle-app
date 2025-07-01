import React, { useState, useRef, useEffect, FormEvent, KeyboardEvent, ClipboardEvent } from 'react';
import Button from '../../../components/common/Button';

interface MfaCodeInputProps {
  onSubmit: (code: string) => void;
  onCancel: () => void;
  isLoading: boolean;
  error?: string;
}

const MfaCodeInput: React.FC<MfaCodeInputProps> = ({
  onSubmit,
  onCancel,
  isLoading,
  error,
}) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus the first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(0, 1);
    
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are entered
    if (newCode.every(d => d !== '') && newCode.length === 6) {
      onSubmit(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, 6).split('');
    
    const newCode = [...code];
    digits.forEach((digit, i) => {
      if (i < 6) {
        newCode[i] = digit;
      }
    });
    setCode(newCode);

    // Focus the last filled input or the first empty one
    const lastFilledIndex = newCode.findIndex(d => d === '') - 1;
    const focusIndex = lastFilledIndex === -2 ? 5 : lastFilledIndex + 1;
    inputRefs.current[focusIndex]?.focus();

    // Auto-submit if all digits are filled
    if (newCode.every(d => d !== '')) {
      onSubmit(newCode.join(''));
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length === 6) {
      onSubmit(fullCode);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Verification Code
        </label>
        <div className="flex gap-2 justify-center">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={el => inputRefs.current[index] = el}
              type="text"
              inputMode="numeric"
              pattern="\d"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className={`
                w-12 h-12 text-center text-lg font-semibold rounded-md border
                ${error 
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                  : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                }
                focus:outline-none focus:ring-2 focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              disabled={isLoading}
              autoComplete="off"
              aria-label={`Digit ${index + 1}`}
            />
          ))}
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <Button
          type="submit"
          fullWidth
          size="lg"
          isLoading={isLoading}
          loadingText="Verifying..."
          disabled={code.some(d => d === '')}
        >
          Verify
        </Button>

        <Button
          type="button"
          fullWidth
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>

      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600">
          Enter the code from your authenticator app
        </p>
        <button
          type="button"
          className="text-sm text-primary-600 hover:text-primary-500"
          onClick={() => {/* TODO: Implement backup code flow */}}
        >
          Use a backup code instead
        </button>
      </div>
    </form>
  );
};

export default MfaCodeInput;
