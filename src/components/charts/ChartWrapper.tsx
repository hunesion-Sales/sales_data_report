import { ReactNode, useState, useEffect } from 'react';
import { ResponsiveContainer } from 'recharts';

interface ChartWrapperProps {
    children: ReactNode;
    height?: number;
    className?: string;
    title?: string;
    /** 타이틀 오른쪽에 표시할 컨트롤 (토글 버튼 등) */
    headerRight?: ReactNode;
    loading?: boolean;
    hasData?: boolean;
}

/**
 * Recharts용 안정적인 래퍼 컴포넌트
 * - 고정 높이 보장으로 -1 에러 방지
 * - 마운트 상태 관리로 렌더링 타이밍 제어
 * - 로딩/빈 데이터 상태 처리
 * - minWidth={0} 적용으로 ResponsiveContainer 안정화
 * 
 * @example
 * <ChartWrapper title="월별 매출 추이" height={320} hasData={data.length > 0}>
 *   <BarChart data={data}>
 *     <Bar dataKey="sales" fill="#6366f1" />
 *   </BarChart>
 * </ChartWrapper>
 */
export function ChartWrapper({
    children,
    height = 320,
    className = '',
    title,
    headerRight,
    loading = false,
    hasData = true,
}: ChartWrapperProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        // DOM 마운트 및 애니메이션 종료 후 차트 렌더링 (400ms 딜레이)
        // animate-fade-in(0.3s)이 완전히 끝난 후 렌더링하여 정확한 크기 계산 보장
        const timer = setTimeout(() => setIsMounted(true), 400);
        return () => clearTimeout(timer);
    }, []);

    // 절대 0이 되지 않도록 보장하는 인라인 스타일 (Tailwind보다 우선순위 높음)
    const containerStyle = {
        height: height,
        minHeight: height,
        width: '100%',
        minWidth: '1px', // 0 대신 1px로 설정하여 보장
    };

    const shouldRenderChart = isMounted && !loading && hasData;

    return (
        <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 ${className}`}>
            {(title || headerRight) && (
                <div className="flex items-center justify-between mb-4">
                    {title && <h3 className="text-lg font-bold text-slate-800">{title}</h3>}
                    {headerRight}
                </div>
            )}
            <div style={containerStyle} className="relative">
                {loading ? (
                    // 로딩 스켈레톤 UI
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="w-12 h-12 border-4 border-slate-200 border-t-primary-600 rounded-full animate-spin mb-3" />
                        <span className="text-sm text-slate-500 font-medium">차트 로딩 중...</span>
                    </div>
                ) : !hasData ? (
                    // 데이터 없음 UI
                    <div className="flex flex-col items-center justify-center h-full">
                        <svg className="w-16 h-16 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span className="text-sm text-slate-500 font-medium">표시할 데이터가 없습니다</span>
                        <span className="text-xs text-slate-400 mt-1">데이터를 입력하거나 필터를 조정해주세요</span>
                    </div>
                ) : !isMounted ? (
                    // 마운트 대기 중 (깜빡임 방지)
                    <div className="flex items-center justify-center h-full">
                        <div className="w-8 h-8 border-3 border-slate-200 border-t-slate-400 rounded-full animate-spin" />
                    </div>
                ) : (
                    // 차트 렌더링 - 높이를 명시적으로 지정
                    <ResponsiveContainer width="99%" height={height} minWidth={100} debounce={50}>
                        {children}
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
