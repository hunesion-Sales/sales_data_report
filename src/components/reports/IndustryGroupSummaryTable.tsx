import React, { useState, Fragment, useMemo } from 'react';
import { ArrowDownUp, Factory } from 'lucide-react';
import type { IndustryGroupSummary, PeriodInfo } from '@/types';
import { formatMillionWon, formatCurrency } from '@/utils/formatUtils';

interface IndustryGroupSummaryTableProps {
  summaries: IndustryGroupSummary[];
  periodInfoList: PeriodInfo[];
}

function IndustryGroupSummaryTable({
  summaries,
  periodInfoList,
}: IndustryGroupSummaryTableProps) {
  const [sortKey, setSortKey] = useState<'profit' | 'sales'>('profit');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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
        데이터가 없습니다. 산업군별 데이터를 업로드해주세요.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Factory className="w-5 h-5 text-emerald-600" />
          산업군별 매출 현황
        </h3>
        <p className="text-xs text-slate-500 mt-1">(단위: 백만원)</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left font-medium sticky left-0 bg-slate-100 z-10 min-w-[180px]">
                산업군
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
            {sortedSummaries.map((summary) => (
              <tr
                key={summary.industryGroupName}
                className="hover:bg-slate-50/50 transition-colors"
              >
                <td className="px-4 py-3 sticky left-0 bg-white z-10">
                  <span className="font-medium text-slate-700">
                    {summary.industryGroupName}
                  </span>
                </td>
                {periodInfoList.map((p) => {
                  const pd = summary.periodBreakdown[p.key] || { sales: 0, cost: 0, profit: 0 };
                  return (
                    <Fragment key={p.key}>
                      <td className="px-2 py-3 text-right border-l border-slate-100" title={formatCurrency(pd.sales)}>
                        {formatMillionWon(pd.sales)}
                      </td>
                      <td className="px-2 py-3 text-right text-slate-400" title={formatCurrency(pd.cost)}>
                        {formatMillionWon(pd.cost)}
                      </td>
                      <td
                        className={`px-2 py-3 text-right font-medium ${pd.profit < 0 ? 'text-red-500' : 'text-emerald-600'}`}
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
                  className={`px-2 py-3 text-right font-bold bg-slate-50/50 ${summary.totalProfit < 0 ? 'text-red-600' : 'text-slate-800'}`}
                  title={formatCurrency(summary.totalProfit)}
                >
                  {formatMillionWon(summary.totalProfit)}
                </td>
              </tr>
            ))}
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

export default React.memo(IndustryGroupSummaryTable);
