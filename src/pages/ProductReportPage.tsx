import React, { useMemo, useState } from 'react';
import type { ProductData, ProcessedProduct, Totals } from '@/types';
import { getMonthFullLabel } from '@/types';
import { useReport } from '@/hooks/useReport';
import { Table as TableIcon, Printer, Cloud, CloudOff, Loader2, Package } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { formatMillionWon, formatCurrency as formatCurrencyFull } from '@/utils/formatUtils';
import ProductCharts from '@/components/reports/ProductCharts';
import ProductReportTable from '@/components/reports/ProductReportTable';

// --- 초기 데이터 (동적 월 구조) ---
// --- 초기 데이터 (DB 로딩 전 빈 상태) ---
const DEFAULT_MONTHS: string[] = [];
const DEFAULT_MONTH_LABELS: Record<string, string> = {};
const INITIAL_DATA: ProductData[] = [];

// --- 월별 배경색 팔레트 (테이블 헤더용) ---
const MONTH_COLORS = [
    { bg: 'bg-blue-50/50', bgLight: 'bg-blue-50/30', text: 'text-blue-700' },
    { bg: 'bg-indigo-50/50', bgLight: 'bg-indigo-50/30', text: 'text-indigo-700' },
    { bg: 'bg-violet-50/50', bgLight: 'bg-violet-50/30', text: 'text-violet-700' },
    { bg: 'bg-purple-50/50', bgLight: 'bg-purple-50/30', text: 'text-purple-700' },
    { bg: 'bg-fuchsia-50/50', bgLight: 'bg-fuchsia-50/30', text: 'text-fuchsia-700' },
    { bg: 'bg-pink-50/50', bgLight: 'bg-pink-50/30', text: 'text-pink-700' },
    { bg: 'bg-rose-50/50', bgLight: 'bg-rose-50/30', text: 'text-rose-700' },
    { bg: 'bg-orange-50/50', bgLight: 'bg-orange-50/30', text: 'text-orange-700' },
    { bg: 'bg-amber-50/50', bgLight: 'bg-amber-50/30', text: 'text-amber-700' },
    { bg: 'bg-cyan-50/50', bgLight: 'bg-cyan-50/30', text: 'text-cyan-700' },
    { bg: 'bg-teal-50/50', bgLight: 'bg-teal-50/30', text: 'text-teal-700' },
    { bg: 'bg-emerald-50/50', bgLight: 'bg-emerald-50/30', text: 'text-emerald-700' },
];

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

    const [viewMode, setViewMode] = useState<'sales' | 'profit'>('sales');

    return (
        <div className="space-y-6 animate-fade-in p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Package className="w-8 h-8 text-primary-600" />
                    <h1 className="text-2xl font-bold text-slate-900">제품별 보고서</h1>
                </div>

                <div className="flex items-center gap-4">
                    {/* View Mode Toggle */}
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('sales')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'sales'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            매출액 보기
                        </button>
                        <button
                            onClick={() => setViewMode('profit')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'profit'
                                ? 'bg-white text-emerald-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            매출이익 보기
                        </button>
                    </div>

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print-avoid-break">
                {/* Sales Card - Blue/Slate Theme */}
                <div className={`bg-white p-6 rounded-xl shadow-sm border-t-4 transition-all ${viewMode === 'sales'
                    ? 'border-indigo-500 shadow-md transform scale-[1.01]'
                    : 'border-slate-300 border-x border-b'
                    }`} title={formatCurrencyFull(totals.totalSales)}>
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-bold text-slate-700">총 매출액</h3>
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${viewMode === 'sales' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                            Sales
                        </span>
                    </div>
                    <div className="space-y-2">
                        <p className="text-3xl font-bold text-slate-800 tracking-tight">
                            {formatMillionWon(totals.totalSales)}
                        </p>
                        <p className="text-sm text-slate-500">전체 제품군 합계 (백만원)</p>
                    </div>
                </div>

                {/* Profit Card - Emerald Theme */}
                <div className={`bg-white p-6 rounded-xl shadow-sm border-t-4 transition-all ${viewMode === 'profit'
                    ? 'border-emerald-500 shadow-md transform scale-[1.01]'
                    : 'border-slate-300 border-x border-b'
                    }`} title={formatCurrencyFull(totals.totalProfit)}>
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-bold text-slate-700">총 매출이익</h3>
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${viewMode === 'profit' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                            Profit
                        </span>
                    </div>
                    <div className="space-y-2">
                        <p className="text-3xl font-bold text-emerald-600 tracking-tight">
                            {formatMillionWon(totals.totalProfit)}
                        </p>
                        <p className="text-sm text-slate-500">전체 제품군 합계 (백만원)</p>
                    </div>
                </div>

                {/* Margin Card - Indigo/Violet Theme */}
                <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-violet-500 border-x border-b">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-bold text-slate-700">평균 매출이익률</h3>
                        <span className="bg-violet-100 text-violet-700 text-xs font-semibold px-2 py-1 rounded">Margin</span>
                    </div>
                    <div className="space-y-2">
                        <p className="text-3xl font-bold text-violet-600 tracking-tight">
                            {totals.totalSales > 0
                                ? `${((totals.totalProfit / totals.totalSales) * 100).toFixed(1)}%`
                                : '-'}
                        </p>
                        <p className="text-sm text-slate-500">전체 평균 매출이익률</p>
                    </div>
                </div>
            </div>

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
