import React, { useMemo, useState } from 'react';
import type { ProductData, ProcessedProduct, Totals } from '@/types';
import { getMonthFullLabel } from '@/types';
import { useReport } from '@/hooks/useReport';
import { Table as TableIcon, Printer, Cloud, CloudOff, Loader2, Package } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { formatMillionWon, formatCurrency as formatCurrencyFull } from '@/utils/formatUtils';
import ProductCharts from '@/components/reports/ProductCharts';

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
    const processedData = useMemo<ProcessedProduct[]>(() => {
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
        const cloudSubtotal: ProductData = { id: 'cloud_total', product: 'Cloud 소계', months: emptyMonths() };

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

        // Construct Final List: Regular -> Cloud -> Cloud Subtotal -> Maintenance -> Etc
        const aggregatedList = [
            ...regularItems,
            ...cloudItems,
            cloudSubtotal,
            aggregatedGroups['유지보수'],
            aggregatedGroups['기타']
        ];

        return aggregatedList.map(item => {
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
    }, [data, months]);

    const totals = useMemo<Totals>(() => {
        const byMonth: Record<string, { sales: number; cost: number; profit: number }> = {};
        months.forEach(mk => { byMonth[mk] = { sales: 0, cost: 0, profit: 0 }; });

        let totalSales = 0;
        let totalCost = 0;

        processedData.forEach(item => {
            // Cloud 소계는 개별 항목들의 합이므로 전체 합계 계산 시 제외 (중복 방지)
            if (item.id === 'cloud_total') return;

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
    }, [processedData, months]);

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print-avoid-break">
                <div className={`bg-white p-6 rounded-xl shadow-sm border transition-all ${viewMode === 'sales' ? 'border-indigo-200 ring-1 ring-indigo-100' : 'border-slate-200'}`} title={formatCurrencyFull(totals.totalSales)}>
                    <p className="text-sm text-slate-500 mb-1">총 매출액 (백만원)</p>
                    <p className="text-2xl font-bold text-slate-900">
                        {formatMillionWon(totals.totalSales)}
                    </p>
                </div>
                <div className={`bg-white p-6 rounded-xl shadow-sm border transition-all ${viewMode === 'profit' ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-slate-200'}`} title={formatCurrencyFull(totals.totalProfit)}>
                    <p className="text-sm text-slate-500 mb-1">총 매출이익 (백만원)</p>
                    <p className="text-2xl font-bold text-emerald-600">
                        {formatMillionWon(totals.totalProfit)}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm text-slate-500 mb-1">평균 이익률</p>
                    <p className="text-2xl font-bold text-indigo-600">
                        {totals.totalSales > 0
                            ? `${((totals.totalProfit / totals.totalSales) * 100).toFixed(1)}%`
                            : '-'}
                    </p>
                </div>
            </div>

            {/* Product Charts */}
            <ProductCharts items={processedData} months={months} viewMode={viewMode} />

            {/* Detailed Report Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print-avoid-break">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <TableIcon className="w-5 h-5 text-slate-500 no-print" />
                        상세 실적 보고서
                    </h3>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-slate-500 font-medium">(단위 : 백만원, 부가세별도)</span>
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-slate-300 rounded hover:bg-slate-50 text-slate-600 transition-colors no-print"
                        >
                            <Printer className="w-4 h-4" />
                            인쇄 / PDF 저장
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right border-collapse">
                        <thead className="bg-slate-100 text-slate-700 font-semibold">
                            <tr>
                                <th rowSpan={2} className="p-3 text-left border-b border-r border-slate-200 min-w-[150px] bg-slate-200 sticky left-0 z-10">제품군</th>
                                {months.map((mk, idx) => {
                                    const color = MONTH_COLORS[idx % MONTH_COLORS.length];
                                    return (
                                        <th key={mk} colSpan={3} className={`p-2 border-b border-r border-slate-200 text-center ${color.bg}`}>
                                            {getMonthFullLabel(mk)}
                                        </th>
                                    );
                                })}
                                <th colSpan={3} className="p-2 border-b border-slate-200 text-center bg-slate-200">전체 합계</th>
                            </tr>
                            <tr className="text-xs">
                                {months.map((mk, idx) => {
                                    const color = MONTH_COLORS[idx % MONTH_COLORS.length];
                                    return (
                                        <React.Fragment key={mk}>
                                            <th className={`p-2 border-b border-r border-slate-200 min-w-[100px] ${color.bgLight}`}>매출액</th>
                                            <th className={`p-2 border-b border-r border-slate-200 min-w-[100px] ${color.bgLight}`}>매입액</th>
                                            <th className={`p-2 border-b border-r border-slate-200 min-w-[100px] ${color.bgLight} ${color.text}`}>이익</th>
                                        </React.Fragment>
                                    );
                                })}
                                <th className="p-2 border-b border-r border-slate-200 min-w-[100px] bg-slate-100">매출액</th>
                                <th className="p-2 border-b border-r border-slate-200 min-w-[100px] bg-slate-100">매입액</th>
                                <th className="p-2 border-b border-slate-200 min-w-[100px] bg-slate-100 text-slate-900">이익</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {processedData.map((row) => (
                                <tr key={row.id} className={`transition-colors hover:bg-blue-50/20 ${row.id === 'cloud_total' ? 'bg-indigo-50/60 font-semibold' :
                                    row.id === 'maintenance_total' || row.id === 'etc_total' ? 'bg-slate-50/80 font-medium' : ''
                                    }`}>
                                    <td className={`p-3 text-left border-r border-slate-100 sticky left-0 ${row.id === 'cloud_total' ? 'bg-indigo-50/60 text-indigo-900' :
                                        row.id === 'maintenance_total' || row.id === 'etc_total' ? 'bg-slate-50/90 text-slate-800' :
                                            'bg-white text-slate-700 font-medium'
                                        }`}>
                                        {row.product}
                                    </td>
                                    {months.map((mk, idx) => {
                                        const md = row.months[mk] ?? { sales: 0, cost: 0, profit: 0 };
                                        const color = MONTH_COLORS[idx % MONTH_COLORS.length];
                                        return (
                                            <React.Fragment key={mk}>
                                                <td className="p-3 text-slate-600 border-r border-slate-100" title={formatCurrencyFull(md.sales)}>{formatMillionWon(md.sales)}</td>
                                                <td className="p-3 text-slate-400 border-r border-slate-100" title={formatCurrencyFull(md.cost)}>{formatMillionWon(md.cost)}</td>
                                                <td className={`p-3 font-medium border-r border-slate-100 ${md.profit < 0 ? 'text-red-500' : color.text}`} title={formatCurrencyFull(md.profit)}>
                                                    {formatMillionWon(md.profit)}
                                                </td>
                                            </React.Fragment>
                                        );
                                    })}
                                    <td className="p-3 font-semibold text-slate-800 border-r border-slate-100 bg-slate-50/30" title={formatCurrencyFull(row.totalSales)}>{formatMillionWon(row.totalSales)}</td>
                                    <td className="p-3 text-slate-500 border-r border-slate-100 bg-slate-50/30" title={formatCurrencyFull(row.totalCost)}>{formatMillionWon(row.totalCost)}</td>
                                    <td className={`p-3 font-bold border-r border-slate-100 bg-slate-50/30 ${row.totalProfit < 0 ? 'text-red-600' : 'text-slate-800'}`} title={formatCurrencyFull(row.totalProfit)}>
                                        {formatMillionWon(row.totalProfit)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-slate-800 text-white font-bold sticky bottom-0">
                            <tr>
                                <td className="p-3 text-center border-r border-slate-600 sticky left-0 bg-slate-800 z-10">합계</td>
                                {months.map(mk => {
                                    const md = totals.byMonth[mk] ?? { sales: 0, cost: 0, profit: 0 };
                                    return (
                                        <React.Fragment key={mk}>
                                            <td className="p-3 text-right border-r border-slate-600" title={formatCurrencyFull(md.sales)}>{formatMillionWon(md.sales)}</td>
                                            <td className="p-3 text-right border-r border-slate-600 text-slate-300" title={formatCurrencyFull(md.cost)}>{formatMillionWon(md.cost)}</td>
                                            <td className="p-3 text-right border-r border-slate-600 text-yellow-300" title={formatCurrencyFull(md.profit)}>{formatMillionWon(md.profit)}</td>
                                        </React.Fragment>
                                    );
                                })}
                                <td className="p-3 text-right border-r border-slate-600 bg-slate-900" title={formatCurrencyFull(totals.totalSales)}>{formatMillionWon(totals.totalSales)}</td>
                                <td className="p-3 text-right border-r border-slate-600 bg-slate-900 text-slate-300" title={formatCurrencyFull(totals.totalCost)}>{formatMillionWon(totals.totalCost)}</td>
                                <td className="p-3 text-right border-r border-slate-600 bg-slate-900 text-yellow-400" title={formatCurrencyFull(totals.totalProfit)}>{formatMillionWon(totals.totalProfit)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}
