import { WifiOff, RefreshCcw, Database } from 'lucide-react';

interface Props {
  error?: Error | string;
  onRetry?: () => void;
  title?: string;
}

/**
 * Firestore 연결 실패 시 표시할 Fallback UI
 * - 네트워크 오류, 인증 오류, 권한 오류 등에 대한 안내
 */
export function FirestoreErrorFallback({
  error,
  onRetry,
  title = '데이터를 불러올 수 없습니다'
}: Props) {
  const errorMessage = typeof error === 'string' ? error : error?.message;

  // 에러 유형 감지
  const isNetworkError = errorMessage?.includes('network') ||
                         errorMessage?.includes('offline') ||
                         errorMessage?.includes('Failed to fetch');
  const isAuthError = errorMessage?.includes('permission') ||
                      errorMessage?.includes('PERMISSION_DENIED') ||
                      errorMessage?.includes('unauthorized');
  const isQuotaError = errorMessage?.includes('quota') ||
                       errorMessage?.includes('RESOURCE_EXHAUSTED');

  const getErrorDetails = () => {
    if (isNetworkError) {
      return {
        icon: WifiOff,
        description: '인터넷 연결을 확인해주세요.',
        suggestion: '네트워크 연결 후 다시 시도해주세요.',
      };
    }
    if (isAuthError) {
      return {
        icon: Database,
        description: '접근 권한이 없습니다.',
        suggestion: '로그인 상태를 확인하거나 관리자에게 문의하세요.',
      };
    }
    if (isQuotaError) {
      return {
        icon: Database,
        description: '요청 한도를 초과했습니다.',
        suggestion: '잠시 후 다시 시도해주세요.',
      };
    }
    return {
      icon: Database,
      description: '서버와 통신 중 오류가 발생했습니다.',
      suggestion: '잠시 후 다시 시도해주세요.',
    };
  };

  const details = getErrorDetails();
  const Icon = details.icon;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
        <Icon className="w-6 h-6 text-orange-600" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        {title}
      </h3>

      <p className="text-gray-600 text-sm mb-1">
        {details.description}
      </p>

      <p className="text-gray-500 text-xs mb-4">
        {details.suggestion}
      </p>

      {import.meta.env.DEV && errorMessage && (
        <div className="mb-4 p-2 bg-gray-100 rounded text-xs text-left font-mono text-gray-600 overflow-auto max-h-20">
          {errorMessage}
        </div>
      )}

      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCcw className="w-4 h-4" />
          다시 시도
        </button>
      )}
    </div>
  );
}

export default FirestoreErrorFallback;
