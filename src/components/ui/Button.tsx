import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-gradient-to-r from-primary-600 to-primary-500
    text-white shadow-lg shadow-primary-500/50
    hover:shadow-xl hover:shadow-primary-500/60
    disabled:from-primary-300 disabled:to-primary-300
  `,
  secondary: `
    bg-slate-200 text-slate-700
    hover:bg-slate-300
    disabled:bg-slate-100 disabled:text-slate-400
  `,
  danger: `
    bg-gradient-to-r from-red-600 to-red-500
    text-white shadow-lg shadow-red-500/50
    hover:shadow-xl hover:shadow-red-500/60
    disabled:from-red-300 disabled:to-red-300
  `,
  ghost: `
    bg-transparent text-slate-600
    hover:bg-slate-100
    disabled:text-slate-300
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-6 py-2.5 text-sm rounded-xl',
  lg: 'px-8 py-3 text-base rounded-xl',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  className = '',
  children,
  ...props
}) => {
  const isDisabled = disabled || isLoading;

  return (
    <button
      className={`
        font-medium
        active:scale-95
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        flex items-center justify-center gap-2
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      disabled={isDisabled}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : leftIcon ? (
        leftIcon
      ) : null}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};
