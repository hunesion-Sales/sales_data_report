import React, { useMemo } from 'react';
import type { ProductData, ProcessedProduct, Totals } from '@/types';
import { getMonthFullLabel } from '@/types';
import { useReport } from '@/hooks/useReport';
import { Table as TableIcon, Printer, Cloud, CloudOff, Loader2, Package } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { formatMillionWon, formatCurrency as formatCurrencyFull } from '@/utils/formatUtils';
import ProductCharts from '@/components/reports/ProductCharts';
import ProductReportTable from '@/components/reports/ProductReportTable';
import ViewToggle from '@/components/ui/ViewToggle';
import { useViewMode } from '@/hooks/useViewMode';
import KPICardGrid from '@/components/common/KPICardGrid';

// --- 초기 데이터 (동적 월 구조) ---
// --- 초기 데이터 (DB 로딩 전 빈 상태) ---
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

    // 제품의 특정 월 데이터를 안전하게 가져오기
    const getMonthData = (item: ProductData, monthKey: string) => {
        return item.months[monthKey] ?? { sales: 0, cost: 0 };
    };

    // --- 데이터 가공 및 통계 계산 ---
    const { mainData, cloudData } = useMemo(() => {
        // 빈 월 데이터 생성 헬퍼
        const emptyMonths = (): Record<string, { sales: number; cost: number }> => {
            const m: Record<string, { sales: number; cost: number }> = {};
            months.forEach(key => { m[key] = { sales: 0, cost: 0 }; });
            return m;
        };

        const aggregatedGroups: Record<string, ProductData> = {
            '유지보수': { id: 'maintenance_total', product: '유지보수', months: emptyMonths() },
            '기타': { id: 'etc_total', product: '기타', months: emptyMonths() },
        };

        // Groups
        const regularItems: ProductData[] = [];
        const cloudItems: ProductData[] = [];
        const cloudSubtotal: ProductData = { id: 'cloud_total', product: 'Cloud 서비스', months: emptyMonths() };

        data.forEach(item => {
            // 1. Maintenance & Etc/HW Aggregation
            if (item.product.endsWith('_MA')) {
                months.forEach(mk => {
                    const md = getMonthData(item, mk);
                    aggregatedGroups['유지보수'].months[mk].sales += md.sales;
                    aggregatedGroups['유지보수'].months[mk].cost += md.cost;
                });
            } else if (item.product === 'H/W' || item.product === '기타') {
                months.forEach(mk => {
                    const md = getMonthData(item, mk);
                    aggregatedGroups['기타'].months[mk].sales += md.sales;
                    aggregatedGroups['기타'].months[mk].cost += md.cost;
                });
            }
            // 2. Cloud Items
            else if (item.product.toUpperCase().includes('CLOUD')) {
                cloudItems.push(item);
                // Add to Cloud Subtotal
                months.forEach(mk => {
                    const md = getMonthData(item, mk);
                    cloudSubtotal.months[mk].sales += md.sales;
                    cloudSubtotal.months[mk].cost += md.cost;
                });
            }
            // 3. Regular Items
            else {
                regularItems.push(item);
            }
        });

        // Sort Lists Ascending by Name
        regularItems.sort((a, b) => a.product.localeCompare(b.product));
        cloudItems.sort((a, b) => a.product.localeCompare(b.product));

        // Helper to process list
        const processList = (list: ProductData[]) => list.map(item => {
            const processedMonths: Record<string, { sales: number; cost: number; profit: number }> = {};
            let totalSales = 0;
            let totalCost = 0;

            months.forEach(mk => {
                const md = getMonthData(item, mk);
                const profit = md.sales - md.cost;
                processedMonths[mk] = { sales: md.sales, cost: md.cost, profit };
                totalSales += md.sales;
                totalCost += md.cost;
            });

            return {
                id: item.id,
                product: item.product,
                months: processedMonths,
                totalSales,
                totalCost,
                totalProfit: totalSales - totalCost,
            };
        });

        // Main Report Data: Regular -> Cloud Service -> Maintenance -> Etc
        const mainRaw = [
            ...regularItems,
            cloudSubtotal,
            aggregatedGroups['유지보수'],
            aggregatedGroups['기타']
        ];

        // Cloud Report Data: Individual Cloud Items
        const cloudRaw = [...cloudItems];

        return {
            mainData: processList(mainRaw),
            cloudData: processList(cloudRaw)
        };
    }, [data, months]);

    const totals = useMemo<Totals>(() => {
        const byMonth: Record<string, { sales: number; cost: number; profit: number }> = {};
        months.forEach(mk => { byMonth[mk] = { sales: 0, cost: 0, profit: 0 }; });

        let totalSales = 0;
        let totalCost = 0;

        // Use mainData for totals (it includes Cloud Service aggregated, and verified single entries)
        mainData.forEach(item => {
            months.forEach(mk => {
                const md = item.months[mk] ?? { sales: 0, cost: 0, profit: 0 };
                byMonth[mk].sales += md.sales;
                byMonth[mk].cost += md.cost;
                byMonth[mk].profit += md.profit;
            });
            totalSales += item.totalSales;
            totalCost += item.totalCost;
        });

        return { byMonth, totalSales, totalCost, totalProfit: totalSales - totalCost };
    }, [mainData, months]);

    // Cloud Totals (for Cloud Report Footer)
    const cloudTotals = useMemo<Totals>(() => {
        const byMonth: Record<string, { sales: number; cost: number; profit: number }> = {};
        months.forEach(mk => { byMonth[mk] = { sales: 0, cost: 0, profit: 0 }; });

        let totalSales = 0;
        let totalCost = 0;

        cloudData.forEach(item => {
            months.forEach(mk => {
                const md = item.months[mk] ?? { sales: 0, cost: 0, profit: 0 };
                byMonth[mk].sales += md.sales;
                byMonth[mk].cost += md.cost;
                byMonth[mk].profit += md.profit;
            });
            totalSales += item.totalSales;
            totalCost += item.totalCost;
        });

        return { byMonth, totalSales, totalCost, totalProfit: totalSales - totalCost };
    }, [cloudData, months]);

    const { viewMode, setViewMode } = useViewMode('sales');

    return (
        <div className="space-y-6 animate-fade-in p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Package className="w-8 h-8 text-primary-600" />
                    <h1 className="text-2xl font-bold text-slate-900">제품별 보고서</h1>
                </div>

                <div className="flex items-center gap-4">
                    {/* View Mode Toggle */}
                    <ViewToggle viewMode={viewMode} onChange={setViewMode} />

                    {/* Firestore Data Status */}
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
                {/* Product Charts (Main) */}
                <ProductCharts items={mainData} months={months} viewMode={viewMode} />

                {/* Detailed Report Table (Main) */}
                <ProductReportTable
                    title="상세 실적 보고서"
                    items={mainData}
                    months={months}
                    totals={totals}
                />
            </div>

            {/* 2. Cloud Report Section (Separate) */}
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

                {/* Product Charts (Cloud) */}
                <ProductCharts items={cloudData} months={months} viewMode={viewMode} />

                {/* Detailed Report Table (Cloud) */}
                <ProductReportTable
                    title="클라우드 상세 실적"
                    items={cloudData}
                    months={months}
                    totals={cloudTotals}
                />
            </div>
        </div>
    );
}
