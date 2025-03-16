// src/components/ui/Button.tsx
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
  loading?: boolean;
}

export default function Button({ 
  variant = 'primary', 
  children, 
  className = '',
  loading = false,
  disabled = false,
  ...props 
}: ButtonProps) {
  const baseStyles = 'px-4 py-2 rounded font-medium transition-colors flex items-center justify-center';
  const variants = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600 disabled:bg-blue-300',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400'
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className} ${loading ? 'relative' : ''}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
        </div>
      )}
      <span className={loading ? 'opacity-0' : ''}>{children}</span>
    </button>
  );
}