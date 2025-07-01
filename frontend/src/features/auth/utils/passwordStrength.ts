export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  isStrong: boolean;
}

export const checkPasswordStrength = (password: string): PasswordStrength => {
  const feedback: string[] = [];
  let score = 0;

  // Check length
  if (password.length >= 8) {
    score++;
  } else {
    feedback.push('At least 8 characters required');
  }

  if (password.length >= 12) {
    score++;
  }

  // Check for lowercase
  if (/[a-z]/.test(password)) {
    score++;
  } else {
    feedback.push('Add lowercase letters');
  }

  // Check for uppercase
  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push('Add uppercase letters');
  }

  // Check for numbers
  if (/[0-9]/.test(password)) {
    score++;
  } else {
    feedback.push('Add numbers');
  }

  // Check for special characters
  if (/[^a-zA-Z0-9]/.test(password)) {
    score++;
  } else {
    feedback.push('Add special characters');
  }

  // Check for common patterns
  const commonPatterns = [
    /^123456/,
    /^password/i,
    /^qwerty/i,
    /^abc123/i,
    /^admin/i,
    /^letmein/i,
  ];

  if (commonPatterns.some(pattern => pattern.test(password))) {
    score = Math.max(0, score - 2);
    feedback.push('Avoid common passwords');
  }

  // Normalize score to 0-4 range
  const normalizedScore = Math.min(4, Math.floor((score / 6) * 4));

  return {
    score: normalizedScore,
    feedback,
    isStrong: normalizedScore >= 3 && feedback.length === 0,
  };
};

export const getPasswordStrengthLabel = (score: number): string => {
  switch (score) {
    case 0:
      return 'Very Weak';
    case 1:
      return 'Weak';
    case 2:
      return 'Fair';
    case 3:
      return 'Good';
    case 4:
      return 'Strong';
    default:
      return 'Very Weak';
  }
};

export const getPasswordStrengthColor = (score: number): string => {
  switch (score) {
    case 0:
      return 'bg-red-500';
    case 1:
      return 'bg-orange-500';
    case 2:
      return 'bg-yellow-500';
    case 3:
      return 'bg-blue-500';
    case 4:
      return 'bg-green-500';
    default:
      return 'bg-gray-300';
  }
};
