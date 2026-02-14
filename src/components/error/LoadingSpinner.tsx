import { Loader2 } from 'lucide-react';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

/**
 * 로딩 스피너 컴포넌트
 */
export function LoadingSpinner({ size = 'md', message }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <Loader2 className={`${sizeClasses[size]} text-blue-600 animate-spin`} />
      {message && (
        <p className="mt-2 text-sm text-gray-600">{message}</p>
      )}
    </div>
  );
}

export default LoadingSpinner;
