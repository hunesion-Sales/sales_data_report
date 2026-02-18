import React, { useMemo } from 'react';
import { Table as TableIcon, Printer } from 'lucide-react';
import { ProcessedProduct, Totals, getMonthFullLabel } from '@/types';
import { formatMillionWon, formatCurrency as formatCurrencyFull } from '@/utils/formatUtils';

interface ProductReportTableProps {
    title: string;
    items: ProcessedProduct[];
    months: string[];
    totals: Totals;
    showFooter?: boolean;
}

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

export default function ProductReportTable({ title, items, months, totals, showFooter = true }: ProductReportTableProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print-avoid-break">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <TableIcon className="w-5 h-5 text-slate-500 no-print" />
                    {title}
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
                        {items.map((row) => (
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
                    {showFooter && (
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
                    )}
                </table>
            </div>
        </div>
    );
}
