import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  type: ToastType;
  message: string;
  onClose?: () => void;
  className?: string;
}

const typeStyles: Record<ToastType, { bg: string; icon: React.ReactNode }> = {
  success: {
    bg: 'bg-accent-600 text-white',
    icon: <CheckCircle className="w-5 h-5" />,
  },
  error: {
    bg: 'bg-red-500 text-white',
    icon: <XCircle className="w-5 h-5" />,
  },
  warning: {
    bg: 'bg-amber-500 text-white',
    icon: <AlertCircle className="w-5 h-5" />,
  },
  info: {
    bg: 'bg-blue-500 text-white',
    icon: <Info className="w-5 h-5" />,
  },
};

export const Toast: React.FC<ToastProps> = ({
  type,
  message,
  onClose,
  className = '',
}) => {
  const style = typeStyles[type];

  return (
    <div
      className={`
        fixed top-4 left-1/2 transform -translate-x-1/2 z-50
        px-6 py-3 rounded-full shadow-lg
        flex items-center gap-2
        animate-bounce-in
        ${style.bg}
        ${className}
      `}
    >
      {style.icon}
      <span className="font-medium text-sm">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-2 p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
