import React, { useMemo, useState } from 'react';
import { Table as TableIcon, Printer, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { ProcessedProduct, Totals, getMonthFullLabel } from '@/types';
import { formatMillionWon, formatCurrency as formatCurrencyFull } from '@/utils/formatUtils';
import { MONTH_COLORS } from '@/constants/colors';

interface ProductReportTableProps {
    title: string;
    items: ProcessedProduct[];
    months: string[];
    totals: Totals;
    showFooter?: boolean;
}

type SortField = 'none' | 'sales' | 'profit';
type SortDirection = 'desc' | 'asc';

export default function ProductReportTable({ title, items, months, totals, showFooter = true }: ProductReportTableProps) {
    const [sortField, setSortField] = useState<SortField>('none');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            if (sortDirection === 'desc') {
                setSortDirection('asc');
            } else {
                setSortField('none');
                setSortDirection('desc');
            }
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const sortedItems = useMemo(() => {
        if (sortField === 'none') return items;
        return [...items].sort((a, b) => {
            const valA = sortField === 'profit' ? a.totalProfit : a.totalSales;
            const valB = sortField === 'profit' ? b.totalProfit : b.totalSales;
            return sortDirection === 'desc' ? valB - valA : valA - valB;
        });
    }, [items, sortField, sortDirection]);

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 inline opacity-40" />;
        if (sortDirection === 'desc') return <ArrowDown className="w-3 h-3 ml-1 inline text-blue-600" />;
        return <ArrowUp className="w-3 h-3 ml-1 inline text-blue-600" />;
    };

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
                                        <th className={`p-2 border-b border-r border-slate-200 min-w-[100px] ${color.bgLight} ${color.text}`}>매출이익</th>
                                    </React.Fragment>
                                );
                            })}
                            <th
                                className="p-2 border-b border-r border-slate-200 min-w-[100px] bg-slate-100 cursor-pointer hover:bg-slate-200 select-none transition-colors"
                                onClick={() => handleSort('sales')}
                                title="매출액 기준 정렬"
                            >
                                매출액{getSortIcon('sales')}
                            </th>
                            <th className="p-2 border-b border-r border-slate-200 min-w-[100px] bg-slate-100">매입액</th>
                            <th
                                className="p-2 border-b border-slate-200 min-w-[100px] bg-slate-100 text-slate-900 cursor-pointer hover:bg-slate-200 select-none transition-colors"
                                onClick={() => handleSort('profit')}
                                title="매출이익 기준 정렬"
                            >
                                매출이익{getSortIcon('profit')}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {sortedItems.map((row) => (
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
                                <td className={`p-3 font-semibold border-r border-slate-100 bg-slate-50/30 ${sortField === 'sales' ? 'text-blue-700' : 'text-slate-800'}`} title={formatCurrencyFull(row.totalSales)}>{formatMillionWon(row.totalSales)}</td>
                                <td className="p-3 text-slate-500 border-r border-slate-100 bg-slate-50/30" title={formatCurrencyFull(row.totalCost)}>{formatMillionWon(row.totalCost)}</td>
                                <td className={`p-3 font-bold border-r border-slate-100 bg-slate-50/30 ${row.totalProfit < 0 ? 'text-red-600' : sortField === 'profit' ? 'text-blue-700' : 'text-slate-800'}`} title={formatCurrencyFull(row.totalProfit)}>
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
