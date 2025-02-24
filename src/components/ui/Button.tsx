// src/components/ui/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary';
    children: React.ReactNode;
  }
  
  export default function Button({ 
    variant = 'primary', 
    children, 
    className = '',
    ...props 
  }: ButtonProps) {
    const baseStyles = 'px-4 py-2 rounded font-medium transition-colors';
    const variants = {
      primary: 'bg-blue-500 text-white hover:bg-blue-600',
      secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300'
    };
  
    return (
      <button 
        className={`${baseStyles} ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }