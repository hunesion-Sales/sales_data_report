
import { useState, Fragment, useMemo } from 'react';
import { ChevronDown, ChevronRight, Building2, ArrowDownUp } from 'lucide-react';
import type { DivisionSummary, PeriodInfo } from '@/types';
import { formatMillionWon, formatCurrency } from '@/utils/formatUtils';

interface DivisionSummaryTableProps {
  summaries: DivisionSummary[];
  periodInfoList: PeriodInfo[];
}

export default function DivisionSummaryTable({
  summaries,
  periodInfoList,
}: DivisionSummaryTableProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<'profit' | 'sales'>('profit');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const toggleExpand = (divisionId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(divisionId)) {
        next.delete(divisionId);
      } else {
        next.add(divisionId);
      }
      return next;
    });
  };

  const handleSort = (key: 'sales' | 'profit') => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const sortedSummaries = useMemo(() => {
    return [...summaries].sort((a, b) => {
      const valA = sortKey === 'sales' ? a.totalSales : a.totalProfit;
      const valB = sortKey === 'sales' ? b.totalSales : b.totalProfit;
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
  }, [summaries, sortKey, sortOrder]);


  // 전체 합계 계산
  const totals = summaries.reduce(
    (acc, s) => ({
      sales: acc.sales + s.totalSales,
      cost: acc.cost + s.totalCost,
      profit: acc.profit + s.totalProfit,
    }),
    { sales: 0, cost: 0, profit: 0 }
  );

  const periodTotals: Record<string, { sales: number; cost: number; profit: number }> = {};
  for (const period of periodInfoList) {
    periodTotals[period.key] = { sales: 0, cost: 0, profit: 0 };
    for (const summary of summaries) {
      const pd = summary.periodBreakdown[period.key];
      if (pd) {
        periodTotals[period.key].sales += pd.sales;
        periodTotals[period.key].cost += pd.cost;
        periodTotals[period.key].profit += pd.profit;
      }
    }
  }

  if (summaries.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-500">
        데이터가 없습니다. 제품 마스터에서 부문을 배정해주세요.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-600" />
          부문별 매출 현황
        </h3>
        <p className="text-xs text-slate-500 mt-1">(단위: 백만원)</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left font-medium sticky left-0 bg-slate-100 z-10 min-w-[180px]">
                부문
              </th>
              {periodInfoList.map((p) => (
                <th key={p.key} colSpan={3} className="px-2 py-3 text-center font-medium border-l border-slate-200">
                  {p.label}
                </th>
              ))}
              <th colSpan={3} className="px-2 py-3 text-center font-medium border-l border-slate-300 bg-slate-200">
                합계
              </th>
            </tr>
            <tr className="text-xs text-slate-500">
              <th className="px-4 py-2 text-left sticky left-0 bg-slate-100 z-10"></th>
              {periodInfoList.map((p) => (
                <Fragment key={p.key}>
                  <th className="px-2 py-2 text-right border-l border-slate-200">매출</th>
                  <th className="px-2 py-2 text-right">매입</th>
                  <th className="px-2 py-2 text-right">매출이익</th>
                </Fragment>
              ))}
              <th
                className="px-2 py-2 text-right border-l border-slate-300 bg-slate-200 cursor-pointer hover:bg-slate-300 transition-colors"
                onClick={() => handleSort('sales')}
              >
                <div className="flex items-center justify-end gap-1">
                  매출
                  {sortKey === 'sales' && <ArrowDownUp className="w-3 h-3" />}
                </div>
              </th>
              <th className="px-2 py-2 text-right bg-slate-200">매입</th>
              <th
                className="px-2 py-2 text-right bg-slate-200 cursor-pointer hover:bg-slate-300 transition-colors"
                onClick={() => handleSort('profit')}
              >
                <div className="flex items-center justify-end gap-1">
                  매출이익
                  {sortKey === 'profit' && <ArrowDownUp className="w-3 h-3" />}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedSummaries.map((summary) => {
              const isExpanded = expandedIds.has(summary.divisionId);
              const hasProducts = summary.products.length > 0;

              return (
                <Fragment key={summary.divisionId}>
                  {/* 부문 행 */}
                  <tr
                    key={summary.divisionId}
                    className={`hover:bg-slate-50/50 transition-colors ${summary.divisionId === 'unassigned' ? 'bg-amber-50/30' : ''
                      }`}
                  >
                    <td className="px-4 py-3 sticky left-0 bg-white z-10">
                      <button
                        onClick={() => hasProducts && toggleExpand(summary.divisionId)}
                        className={`flex items-center gap-2 font-medium text-slate-700 ${hasProducts ? 'cursor-pointer hover:text-indigo-600' : ''
                          }`}
                        disabled={!hasProducts}
                      >
                        {hasProducts ? (
                          isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )
                        ) : (
                          <span className="w-4" />
                        )}
                        {summary.divisionName}
                        <span className="text-xs text-slate-400 font-normal">
                          ({summary.products.length})
                        </span>
                      </button>
                    </td>
                    {periodInfoList.map((p) => {
                      const pd = summary.periodBreakdown[p.key] || { sales: 0, cost: 0, profit: 0 };
                      return (
                        <Fragment key={p.key}>
                          <td key={`${p.key}-sales`} className="px-2 py-3 text-right border-l border-slate-100" title={formatCurrency(pd.sales)}>
                            {formatMillionWon(pd.sales)}
                          </td>
                          <td key={`${p.key}-cost`} className="px-2 py-3 text-right text-slate-400" title={formatCurrency(pd.cost)}>
                            {formatMillionWon(pd.cost)}
                          </td>
                          <td
                            key={`${p.key}-profit`}
                            className={`px-2 py-3 text-right font-medium ${pd.profit < 0 ? 'text-red-500' : 'text-indigo-600'
                              }`}
                            title={formatCurrency(pd.profit)}
                          >
                            {formatMillionWon(pd.profit)}
                          </td>
                        </Fragment>
                      );
                    })}
                    <td className="px-2 py-3 text-right font-semibold border-l border-slate-200 bg-slate-50/50" title={formatCurrency(summary.totalSales)}>
                      {formatMillionWon(summary.totalSales)}
                    </td>
                    <td className="px-2 py-3 text-right text-slate-500 bg-slate-50/50" title={formatCurrency(summary.totalCost)}>
                      {formatMillionWon(summary.totalCost)}
                    </td>
                    <td
                      className={`px-2 py-3 text-right font-bold bg-slate-50/50 ${summary.totalProfit < 0 ? 'text-red-600' : 'text-slate-800'
                        }`}
                      title={formatCurrency(summary.totalProfit)}
                    >
                      {formatMillionWon(summary.totalProfit)}
                    </td>
                  </tr>

                  {/* 제품 상세 행 (확장 시) */}
                  {isExpanded &&
                    summary.products.map((product) => (
                      <tr key={`${summary.divisionId}-${product.id}`} className="bg-slate-50/30">
                        <td className="px-4 py-2 pl-10 text-slate-500 sticky left-0 bg-slate-50/30 z-10">
                          {product.product}
                        </td>
                        {periodInfoList.map((p) => {
                          // 제품의 해당 기간 데이터 집계
                          let sales = 0;
                          let cost = 0;
                          let profit = 0;
                          for (const m of p.months) {
                            const md = product.months[m];
                            if (md) {
                              sales += md.sales;
                              cost += md.cost;
                              profit += md.profit;
                            }
                          }
                          return (
                            <Fragment key={p.key}>
                              <td key={`${p.key}-sales`} className="px-2 py-2 text-right text-slate-500 text-xs border-l border-slate-100" title={formatCurrency(sales)}>
                                {formatMillionWon(sales)}
                              </td>
                              <td key={`${p.key}-cost`} className="px-2 py-2 text-right text-slate-400 text-xs" title={formatCurrency(cost)}>
                                {formatMillionWon(cost)}
                              </td>
                              <td
                                key={`${p.key}-profit`}
                                className={`px-2 py-2 text-right text-xs ${profit < 0 ? 'text-red-400' : 'text-slate-500'
                                  }`}
                                title={formatCurrency(profit)}
                              >
                                {formatMillionWon(profit)}
                              </td>
                            </Fragment>
                          );
                        })}
                        <td className="px-2 py-2 text-right text-slate-600 text-xs border-l border-slate-200" title={formatCurrency(product.totalSales)}>
                          {formatMillionWon(product.totalSales)}
                        </td>
                        <td className="px-2 py-2 text-right text-slate-400 text-xs" title={formatCurrency(product.totalCost)}>
                          {formatMillionWon(product.totalCost)}
                        </td>
                        <td
                          className={`px-2 py-2 text-right text-xs ${product.totalProfit < 0 ? 'text-red-500' : 'text-slate-600'
                            }`}
                          title={formatCurrency(product.totalProfit)}
                        >
                          {formatMillionWon(product.totalProfit)}
                        </td>
                      </tr>
                    ))}
                </Fragment>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-800 text-white font-bold">
            <tr>
              <td className="px-4 py-3 sticky left-0 bg-slate-800 z-10">전체 합계</td>
              {periodInfoList.map((p) => {
                const pt = periodTotals[p.key] || { sales: 0, cost: 0, profit: 0 };
                return (
                  <Fragment key={p.key}>
                    <td className="px-2 py-3 text-right border-l border-slate-600" title={formatCurrency(pt.sales)}>
                      {formatMillionWon(pt.sales)}
                    </td>
                    <td className="px-2 py-3 text-right text-slate-300" title={formatCurrency(pt.cost)}>
                      {formatMillionWon(pt.cost)}
                    </td>
                    <td className="px-2 py-3 text-right text-yellow-300" title={formatCurrency(pt.profit)}>
                      {formatMillionWon(pt.profit)}
                    </td>
                  </Fragment>
                );
              })}
              <td className="px-2 py-3 text-right border-l border-slate-600 bg-slate-900" title={formatCurrency(totals.sales)}>
                {formatMillionWon(totals.sales)}
              </td>
              <td className="px-2 py-3 text-right text-slate-300 bg-slate-900" title={formatCurrency(totals.cost)}>
                {formatMillionWon(totals.cost)}
              </td>
              <td className="px-2 py-3 text-right text-yellow-400 bg-slate-900" title={formatCurrency(totals.profit)}>
                {formatMillionWon(totals.profit)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
