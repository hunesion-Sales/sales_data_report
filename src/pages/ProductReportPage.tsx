import React, { useState, useMemo } from 'react';
import type { ProductData, ReportFilter } from '@/types';
import { useReport } from '@/hooks/useReport';
import { useProductReport } from '@/hooks/useProductReport';
import { Cloud, CloudOff, Loader2, Package } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { CURRENT_YEAR } from '@/config/appConfig';
import { formatMillionWon, formatCurrency as formatCurrencyFull } from '@/utils/formatUtils';
import { getAvailableYears, getPeriodInfoList } from '@/utils/periodUtils';
import ProductCharts from '@/components/reports/ProductCharts';
import ProductReportTable from '@/components/reports/ProductReportTable';
import ReportFilterBar from '@/components/reports/ReportFilterBar';
import ViewToggle from '@/components/ui/ViewToggle';
import { useViewMode } from '@/hooks/useViewMode';
import KPICardGrid from '@/components/common/KPICardGrid';

const DEFAULT_MONTHS: string[] = [];
const DEFAULT_MONTH_LABELS: Record<string, string> = {};
const INITIAL_DATA: ProductData[] = [];

export default function ProductReportPage() {
    const { firebaseUser, authReady } = useAuth();

    const {
        data, months,
        isLoading, isSaving, error: firestoreError,
    } = useReport(INITIAL_DATA, DEFAULT_MONTHS, DEFAULT_MONTH_LABELS, {
        firebaseUser,
        authReady,
    });

    // 기간 필터 상태
    const [filter, setFilter] = useState<ReportFilter>({
        year: CURRENT_YEAR,
        periodType: 'monthly',
    });

    const availableYears = useMemo(() => getAvailableYears(months), [months]);

    // 기간 필터 적용
    const filteredMonths = useMemo(() => {
        if (filter.periodType === 'monthly') {
            return months.filter(m => m.startsWith(`${filter.year}`));
        }
        const periodInfoList = getPeriodInfoList(filter.year, filter.periodType, months);
        return periodInfoList.flatMap(p => p.months);
    }, [filter.year, filter.periodType, months]);

    // 훅으로 추출된 데이터 가공
    const { mainData, cloudData, totals, cloudTotals } = useProductReport(data, filteredMonths);

    const { viewMode, setViewMode } = useViewMode('profit');

    return (
        <div className="space-y-6 animate-fade-in p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Package className="w-8 h-8 text-primary-600" />
                    <h1 className="text-2xl font-bold text-slate-900">제품별 보고서</h1>
                </div>

                <div className="flex items-center gap-4">
                    <ViewToggle viewMode={viewMode} onChange={setViewMode} />
                    <div className="flex items-center gap-3">
                        {isSaving ? (
                            <span className="flex items-center gap-1 text-xs text-amber-600">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                저장 중...
                            </span>
                        ) : firestoreError ? (
                            <span className="flex items-center gap-1 text-xs text-red-500" title={firestoreError}>
                                <CloudOff className="w-3.5 h-3.5" />
                                오프라인
                            </span>
                        ) : !isLoading ? (
                            <span className="flex items-center gap-1 text-xs text-accent-600">
                                <Cloud className="w-3.5 h-3.5" />
                                동기화됨
                            </span>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* 기간 필터 바 */}
            <ReportFilterBar
                filter={filter}
                onFilterChange={setFilter}
                divisions={[]}
                availableYears={availableYears}
                isLoading={isLoading}
            />

            {/* Summary KPI Cards */}
            <KPICardGrid
                viewMode={viewMode}
                cards={[
                    {
                        label: '총 매출액 (백만원)',
                        value: formatMillionWon(totals.totalSales),
                        subtitle: '전체 제품군 합계',
                        tooltip: formatCurrencyFull(totals.totalSales),
                        color: 'indigo',
                        highlightWhen: 'sales',
                    },
                    {
                        label: '총 매출이익 (백만원)',
                        value: formatMillionWon(totals.totalProfit),
                        subtitle: '전체 제품군 합계',
                        tooltip: formatCurrencyFull(totals.totalProfit),
                        color: 'emerald',
                        highlightWhen: 'profit',
                    },
                    {
                        label: '평균 매출이익률',
                        value: totals.totalSales > 0
                            ? `${((totals.totalProfit / totals.totalSales) * 100).toFixed(1)}%`
                            : '-',
                        subtitle: '전체 평균 매출이익률',
                        color: 'violet',
                    },
                ]}
            />

            {/* 1. Main Report Section */}
            <div className="space-y-6">
                <ProductCharts items={mainData} months={filteredMonths} viewMode={viewMode} />
                <ProductReportTable
                    title="상세 실적 보고서"
                    items={mainData}
                    months={filteredMonths}
                    totals={totals}
                    enableQuarterGrouping={filteredMonths.length > 6}
                />
            </div>

            {/* 2. Cloud Report Section */}
            <div className="mt-12 space-y-6 pt-8 no-print-break-before">
                <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-lg mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                            <Cloud className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-indigo-900">클라우드 실적 보고</h2>
                            <p className="text-sm text-indigo-600">Cloud 서비스 및 관련 제품군 상세 분석</p>
                        </div>
                    </div>
                </div>

                <ProductCharts items={cloudData} months={filteredMonths} viewMode={viewMode} />
                <ProductReportTable
                    title="클라우드 상세 실적"
                    items={cloudData}
                    months={filteredMonths}
                    totals={cloudTotals}
                    enableQuarterGrouping={filteredMonths.length > 6}
                />
            </div>
        </div>
    );
}
