import React, { useMemo, useState } from 'react';
import { Table as TableIcon, Printer, ArrowUpDown, ArrowUp, ArrowDown, ChevronRight, ChevronDown, ChevronsRight, ChevronsDown } from 'lucide-react';
import { ProcessedProduct, Totals, getMonthFullLabel } from '@/types';
import { formatMillionWon, formatCurrency as formatCurrencyFull } from '@/utils/formatUtils';
import { formatYoYRate, calculateYoYRate, getYoYColorClass } from '@/utils/yoyUtils';
import { MONTH_COLORS } from '@/constants/colors';
import { getQuarterForMonth, getQuarterLabel } from '@/utils/periodUtils';
import type { Quarter } from '@/types';

interface QuarterGroup {
    quarter: Quarter;
    label: string;
    months: string[];
}

interface ProductReportTableProps {
    title: string;
    items: ProcessedProduct[];
    months: string[];
    totals: Totals;
    showFooter?: boolean;
    enableQuarterGrouping?: boolean;
    previousTotals?: Totals;
}

type SortField = 'none' | 'sales' | 'profit';
type SortDirection = 'desc' | 'asc';

function ProductReportTable({ title, items, months, totals, showFooter = true, enableQuarterGrouping = false, previousTotals }: ProductReportTableProps) {
    const [sortField, setSortField] = useState<SortField>('none');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [expandedQuarters, setExpandedQuarters] = useState<Set<string>>(new Set());

    // 분기별 그룹화
    const quarterGroups = useMemo<QuarterGroup[]>(() => {
        if (!enableQuarterGrouping) return [];
        const groups: Record<string, QuarterGroup> = {};
        months.forEach(mk => {
            const q = getQuarterForMonth(mk);
            if (!groups[q]) {
                groups[q] = { quarter: q, label: getQuarterLabel(q), months: [] };
            }
            groups[q].months.push(mk);
        });
        return Object.values(groups);
    }, [months, enableQuarterGrouping]);

    const toggleQuarter = (quarter: string) => {
        setExpandedQuarters(prev => {
            const next = new Set(prev);
            if (next.has(quarter)) next.delete(quarter);
            else next.add(quarter);
            return next;
        });
    };

    const expandAll = () => setExpandedQuarters(new Set(quarterGroups.map(g => g.quarter)));
    const collapseAll = () => setExpandedQuarters(new Set());

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

    // 분기 합계 계산 헬퍼
    const getQuarterSum = (row: ProcessedProduct, qMonths: string[]) => {
        let sales = 0, cost = 0, profit = 0;
        qMonths.forEach(mk => {
            const md = row.months[mk] ?? { sales: 0, cost: 0, profit: 0 };
            sales += md.sales;
            cost += md.cost;
            profit += md.profit;
        });
        return { sales, cost, profit };
    };

    const getQuarterTotalSum = (qMonths: string[]) => {
        let sales = 0, cost = 0, profit = 0;
        qMonths.forEach(mk => {
            const md = totals.byMonth[mk] ?? { sales: 0, cost: 0, profit: 0 };
            sales += md.sales;
            cost += md.cost;
            profit += md.profit;
        });
        return { sales, cost, profit };
    };

    // 표시할 월 목록 (분기 그룹핑이면 펼쳐진 분기의 월만)
    const visibleMonths = useMemo(() => {
        if (!enableQuarterGrouping) return months;
        const result: string[] = [];
        quarterGroups.forEach(g => {
            if (expandedQuarters.has(g.quarter)) {
                result.push(...g.months);
            }
        });
        return result;
    }, [months, enableQuarterGrouping, quarterGroups, expandedQuarters]);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print-avoid-break">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <TableIcon className="w-5 h-5 text-slate-500 no-print" />
                    {title}
                </h3>
                <div className="flex items-center gap-4">
                    {enableQuarterGrouping && quarterGroups.length > 0 && (
                        <div className="flex items-center gap-1 no-print">
                            <button
                                onClick={expandAll}
                                className="flex items-center gap-1 px-2 py-1 text-xs bg-white border border-slate-300 rounded hover:bg-slate-50 text-slate-600 transition-colors"
                                title="전체 월 펼치기"
                            >
                                <ChevronsDown className="w-3.5 h-3.5" />
                                전체 펼치기
                            </button>
                            <button
                                onClick={collapseAll}
                                className="flex items-center gap-1 px-2 py-1 text-xs bg-white border border-slate-300 rounded hover:bg-slate-50 text-slate-600 transition-colors"
                                title="분기별 요약"
                            >
                                <ChevronsRight className="w-3.5 h-3.5" />
                                분기별 요약
                            </button>
                        </div>
                    )}
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
                            {enableQuarterGrouping ? (
                                <>
                                    {quarterGroups.map(g => {
                                        const isExpanded = expandedQuarters.has(g.quarter);
                                        const colSpan = isExpanded ? g.months.length * 3 : 3;
                                        return (
                                            <th
                                                key={g.quarter}
                                                colSpan={colSpan}
                                                className="p-2 border-b border-r border-slate-200 text-center bg-slate-150 cursor-pointer hover:bg-slate-200 select-none transition-colors"
                                                onClick={() => toggleQuarter(g.quarter)}
                                            >
                                                <span className="inline-flex items-center gap-1">
                                                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                                    {g.label}
                                                </span>
                                            </th>
                                        );
                                    })}
                                </>
                            ) : (
                                <>
                                    {months.map((mk, idx) => {
                                        const color = MONTH_COLORS[idx % MONTH_COLORS.length];
                                        return (
                                            <th key={mk} colSpan={3} className={`p-2 border-b border-r border-slate-200 text-center ${color.bg}`}>
                                                {getMonthFullLabel(mk)}
                                            </th>
                                        );
                                    })}
                                </>
                            )}
                            <th colSpan={3} className="p-2 border-b border-slate-200 text-center bg-slate-200 sticky right-0 z-[5]">전체 합계</th>
                            {previousTotals && (
                                <th colSpan={2} className="p-2 border-b border-slate-200 text-center bg-amber-50">전년 비교</th>
                            )}
                        </tr>
                        <tr className="text-xs">
                            {enableQuarterGrouping ? (
                                <>
                                    {quarterGroups.map(g => {
                                        const isExpanded = expandedQuarters.has(g.quarter);
                                        if (isExpanded) {
                                            return g.months.map((mk, idx) => {
                                                const color = MONTH_COLORS[idx % MONTH_COLORS.length];
                                                return (
                                                    <React.Fragment key={mk}>
                                                        <th className={`p-2 border-b border-r border-slate-200 min-w-[100px] ${color.bgLight}`}>매출액</th>
                                                        <th className={`p-2 border-b border-r border-slate-200 min-w-[100px] ${color.bgLight}`}>매입액</th>
                                                        <th className={`p-2 border-b border-r border-slate-200 min-w-[100px] ${color.bgLight} ${color.text}`}>매출이익</th>
                                                    </React.Fragment>
                                                );
                                            });
                                        }
                                        return (
                                            <React.Fragment key={g.quarter}>
                                                <th className="p-2 border-b border-r border-slate-200 min-w-[100px] bg-slate-100">매출액</th>
                                                <th className="p-2 border-b border-r border-slate-200 min-w-[100px] bg-slate-100">매입액</th>
                                                <th className="p-2 border-b border-r border-slate-200 min-w-[100px] bg-slate-100">매출이익</th>
                                            </React.Fragment>
                                        );
                                    })}
                                </>
                            ) : (
                                <>
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
                                </>
                            )}
                            <th
                                className="p-2 border-b border-r border-slate-200 min-w-[100px] bg-slate-100 cursor-pointer hover:bg-slate-200 select-none transition-colors sticky right-[200px] z-[5]"
                                onClick={() => handleSort('sales')}
                                title="매출액 기준 정렬"
                            >
                                매출액{getSortIcon('sales')}
                            </th>
                            <th className="p-2 border-b border-r border-slate-200 min-w-[100px] bg-slate-100 sticky right-[100px] z-[5]">매입액</th>
                            <th
                                className="p-2 border-b border-slate-200 min-w-[100px] bg-slate-100 text-slate-900 cursor-pointer hover:bg-slate-200 select-none transition-colors sticky right-0 z-[5]"
                                onClick={() => handleSort('profit')}
                                title="매출이익 기준 정렬"
                            >
                                매출이익{getSortIcon('profit')}
                            </th>
                            {previousTotals && (
                                <>
                                    <th className="p-2 border-b border-r border-slate-200 min-w-[90px] bg-amber-50 text-amber-800">전년 총계</th>
                                    <th className="p-2 border-b border-slate-200 min-w-[80px] bg-amber-50 text-amber-800">증감률</th>
                                </>
                            )}
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
                                {enableQuarterGrouping ? (
                                    <>
                                        {quarterGroups.map(g => {
                                            const isExpanded = expandedQuarters.has(g.quarter);
                                            if (isExpanded) {
                                                return g.months.map((mk, idx) => {
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
                                                });
                                            }
                                            const qSum = getQuarterSum(row, g.months);
                                            return (
                                                <React.Fragment key={g.quarter}>
                                                    <td className="p-3 text-slate-600 border-r border-slate-100 bg-slate-50/50" title={formatCurrencyFull(qSum.sales)}>{formatMillionWon(qSum.sales)}</td>
                                                    <td className="p-3 text-slate-400 border-r border-slate-100 bg-slate-50/50" title={formatCurrencyFull(qSum.cost)}>{formatMillionWon(qSum.cost)}</td>
                                                    <td className={`p-3 font-medium border-r border-slate-100 bg-slate-50/50 ${qSum.profit < 0 ? 'text-red-500' : 'text-slate-700'}`} title={formatCurrencyFull(qSum.profit)}>
                                                        {formatMillionWon(qSum.profit)}
                                                    </td>
                                                </React.Fragment>
                                            );
                                        })}
                                    </>
                                ) : (
                                    <>
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
                                    </>
                                )}
                                <td className={`p-3 font-semibold border-r border-slate-100 bg-slate-50 sticky right-[200px] z-[5] ${sortField === 'sales' ? 'text-blue-700' : 'text-slate-800'}`} title={formatCurrencyFull(row.totalSales)}>{formatMillionWon(row.totalSales)}</td>
                                <td className="p-3 text-slate-500 border-r border-slate-100 bg-slate-50 sticky right-[100px] z-[5]" title={formatCurrencyFull(row.totalCost)}>{formatMillionWon(row.totalCost)}</td>
                                <td className={`p-3 font-bold border-r border-slate-100 bg-slate-50 sticky right-0 z-[5] ${row.totalProfit < 0 ? 'text-red-600' : sortField === 'profit' ? 'text-blue-700' : 'text-slate-800'}`} title={formatCurrencyFull(row.totalProfit)}>
                                    {formatMillionWon(row.totalProfit)}
                                </td>
                                {previousTotals && (() => {
                                    const prevSales = previousTotals.byMonth ? Object.values(previousTotals.byMonth).reduce((s, m) => s + m.sales, 0) : previousTotals.totalSales;
                                    const rate = calculateYoYRate(row.totalSales, prevSales / Math.max(items.length, 1));
                                    return (
                                        <>
                                            <td className="p-3 text-slate-500 border-r border-slate-100 bg-amber-50/30" title={formatCurrencyFull(previousTotals.totalSales)}>
                                                {formatMillionWon(previousTotals.totalSales)}
                                            </td>
                                            <td className={`p-3 font-medium border-r border-slate-100 bg-amber-50/30 ${getYoYColorClass(rate)}`}>
                                                {formatYoYRate(rate)}
                                            </td>
                                        </>
                                    );
                                })()}
                            </tr>
                        ))}
                    </tbody>
                    {showFooter && (
                        <tfoot className="bg-slate-800 text-white font-bold sticky bottom-0">
                            <tr>
                                <td className="p-3 text-center border-r border-slate-600 sticky left-0 bg-slate-800 z-10">합계</td>
                                {enableQuarterGrouping ? (
                                    <>
                                        {quarterGroups.map(g => {
                                            const isExpanded = expandedQuarters.has(g.quarter);
                                            if (isExpanded) {
                                                return g.months.map(mk => {
                                                    const md = totals.byMonth[mk] ?? { sales: 0, cost: 0, profit: 0 };
                                                    return (
                                                        <React.Fragment key={mk}>
                                                            <td className="p-3 text-right border-r border-slate-600" title={formatCurrencyFull(md.sales)}>{formatMillionWon(md.sales)}</td>
                                                            <td className="p-3 text-right border-r border-slate-600 text-slate-300" title={formatCurrencyFull(md.cost)}>{formatMillionWon(md.cost)}</td>
                                                            <td className="p-3 text-right border-r border-slate-600 text-yellow-300" title={formatCurrencyFull(md.profit)}>{formatMillionWon(md.profit)}</td>
                                                        </React.Fragment>
                                                    );
                                                });
                                            }
                                            const qSum = getQuarterTotalSum(g.months);
                                            return (
                                                <React.Fragment key={g.quarter}>
                                                    <td className="p-3 text-right border-r border-slate-600" title={formatCurrencyFull(qSum.sales)}>{formatMillionWon(qSum.sales)}</td>
                                                    <td className="p-3 text-right border-r border-slate-600 text-slate-300" title={formatCurrencyFull(qSum.cost)}>{formatMillionWon(qSum.cost)}</td>
                                                    <td className="p-3 text-right border-r border-slate-600 text-yellow-300" title={formatCurrencyFull(qSum.profit)}>{formatMillionWon(qSum.profit)}</td>
                                                </React.Fragment>
                                            );
                                        })}
                                    </>
                                ) : (
                                    <>
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
                                    </>
                                )}
                                <td className="p-3 text-right border-r border-slate-600 bg-slate-900 sticky right-[200px] z-[5]" title={formatCurrencyFull(totals.totalSales)}>{formatMillionWon(totals.totalSales)}</td>
                                <td className="p-3 text-right border-r border-slate-600 bg-slate-900 text-slate-300 sticky right-[100px] z-[5]" title={formatCurrencyFull(totals.totalCost)}>{formatMillionWon(totals.totalCost)}</td>
                                <td className="p-3 text-right border-r border-slate-600 bg-slate-900 text-yellow-400 sticky right-0 z-[5]" title={formatCurrencyFull(totals.totalProfit)}>{formatMillionWon(totals.totalProfit)}</td>
                                {previousTotals && (() => {
                                    const salesRate = calculateYoYRate(totals.totalSales, previousTotals.totalSales);
                                    return (
                                        <>
                                            <td className="p-3 text-right border-r border-slate-600 bg-slate-900 text-slate-300">{formatMillionWon(previousTotals.totalSales)}</td>
                                            <td className={`p-3 text-right border-r border-slate-600 bg-slate-900 ${salesRate !== null && salesRate >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {formatYoYRate(salesRate)}
                                            </td>
                                        </>
                                    );
                                })()}
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    );
}

export default React.memo(ProductReportTable);
