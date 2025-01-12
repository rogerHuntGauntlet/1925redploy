import { useMemo } from 'react';

interface Requirement {
  label: string;
  test: (password: string) => boolean;
}

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

const requirements: Requirement[] = [
  {
    label: 'At least 8 characters long',
    test: (password) => password.length >= 8,
  },
  {
    label: 'Contains a number',
    test: (password) => /\d/.test(password),
  },
  {
    label: 'Contains a lowercase letter',
    test: (password) => /[a-z]/.test(password),
  },
  {
    label: 'Contains an uppercase letter',
    test: (password) => /[A-Z]/.test(password),
  },
  {
    label: 'Contains a special character',
    test: (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
  },
];

export default function PasswordStrengthIndicator({ password, className = '' }: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => {
    if (!password) return 0;
    return requirements.filter(req => req.test(password)).length;
  }, [password]);

  const strengthPercentage = (strength / requirements.length) * 100;
  
  const getStrengthColor = () => {
    if (strengthPercentage <= 20) return 'bg-red-500';
    if (strengthPercentage <= 40) return 'bg-orange-500';
    if (strengthPercentage <= 60) return 'bg-yellow-500';
    if (strengthPercentage <= 80) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthLabel = () => {
    if (strengthPercentage <= 20) return 'Very Weak';
    if (strengthPercentage <= 40) return 'Weak';
    if (strengthPercentage <= 60) return 'Fair';
    if (strengthPercentage <= 80) return 'Good';
    return 'Strong';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Progress bar */}
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getStrengthColor()}`}
          style={{ width: `${strengthPercentage}%` }}
        />
      </div>

      {/* Strength label */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">Password Strength:</span>
        <span className={`font-medium ${getStrengthColor().replace('bg-', 'text-')}`}>
          {getStrengthLabel()}
        </span>
      </div>

      {/* Requirements list */}
      <ul className="space-y-1 text-sm">
        {requirements.map((req, index) => (
          <li
            key={index}
            className={`flex items-center space-x-2 ${
              req.test(password) ? 'text-green-600' : 'text-gray-500'
            }`}
          >
            {req.test(password) ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <span>{req.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
} 