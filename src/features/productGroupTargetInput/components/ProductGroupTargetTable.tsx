import React from 'react';
import type { Quarter } from '@/types';
import { formatMillionWon } from '@/utils/formatUtils';

interface TargetCell {
  salesTarget: number;
  profitTarget: number;
}

interface ProductGroupTargetTableProps {
  matrix: Record<string, Record<Quarter, TargetCell>>;
  productGroups: readonly string[];
  quarters: Quarter[];
  updateCell: (group: string, quarter: Quarter, field: 'salesTarget' | 'profitTarget', value: number) => void;
  getGroupAnnualTotal: (group: string) => { salesTotal: number; profitTotal: number };
  getGrandTotal: () => { salesTotal: number; profitTotal: number };
  viewMode: 'sales' | 'profit' | 'both';
}

const QUARTER_LABELS: Record<Quarter, string> = {
  Q1: '1분기',
  Q2: '2분기',
  Q3: '3분기',
  Q4: '4분기',
};

export default function ProductGroupTargetTable({
  matrix,
  productGroups,
  quarters,
  updateCell,
  getGroupAnnualTotal,
  getGrandTotal,
  viewMode,
}: ProductGroupTargetTableProps) {
  const grandTotal = getGrandTotal();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-100 text-slate-600">
          <tr>
            <th className="px-3 py-2 text-left font-medium sticky left-0 bg-slate-100 z-10 min-w-[160px]">
              제품군
            </th>
            {quarters.map((q) => (
              <th key={q} className="px-3 py-2 text-center font-medium" colSpan={viewMode === 'both' ? 2 : 1}>
                {QUARTER_LABELS[q]}
              </th>
            ))}
            <th className="px-3 py-2 text-center font-medium bg-slate-200" colSpan={viewMode === 'both' ? 2 : 1}>
              연간 합계
            </th>
          </tr>
          {viewMode === 'both' && (
            <tr className="bg-slate-50 text-xs text-slate-500">
              <th className="px-3 py-1 sticky left-0 bg-slate-50 z-10"></th>
              {quarters.map((q) => (
                <React.Fragment key={q}>
                  <th className="px-3 py-1 text-center">매출</th>
                  <th className="px-3 py-1 text-center">이익</th>
                </React.Fragment>
              ))}
              <th className="px-3 py-1 text-center bg-slate-100">매출</th>
              <th className="px-3 py-1 text-center bg-slate-100">이익</th>
            </tr>
          )}
        </thead>
        <tbody className="divide-y divide-slate-100">
          {productGroups.map((group) => {
            const annual = getGroupAnnualTotal(group);
            return (
              <tr key={group} className="hover:bg-slate-50/50">
                <td className="px-3 py-2 font-medium text-slate-700 sticky left-0 bg-white z-10">
                  {group}
                </td>
                {quarters.map((q) => {
                  const cell = matrix[group][q];
                  return viewMode === 'both' ? (
                    <React.Fragment key={q}>
                      <td className="px-1 py-1">
                        <input
                          type="number"
                          value={cell.salesTarget || ''}
                          onChange={(e) => updateCell(group, q, 'salesTarget', Number(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-right text-xs border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          type="number"
                          value={cell.profitTarget || ''}
                          onChange={(e) => updateCell(group, q, 'profitTarget', Number(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-right text-xs border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                          placeholder="0"
                        />
                      </td>
                    </React.Fragment>
                  ) : (
                    <td key={q} className="px-1 py-1">
                      <input
                        type="number"
                        value={viewMode === 'sales' ? (cell.salesTarget || '') : (cell.profitTarget || '')}
                        onChange={(e) => updateCell(group, q, viewMode === 'sales' ? 'salesTarget' : 'profitTarget', Number(e.target.value) || 0)}
                        className="w-full px-2 py-1 text-right text-xs border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        placeholder="0"
                      />
                    </td>
                  );
                })}
                {viewMode === 'both' ? (
                  <>
                    <td className="px-3 py-2 text-right font-medium text-slate-700 bg-slate-50">
                      {formatMillionWon(annual.salesTotal)}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-emerald-700 bg-slate-50">
                      {formatMillionWon(annual.profitTotal)}
                    </td>
                  </>
                ) : (
                  <td className="px-3 py-2 text-right font-medium text-slate-700 bg-slate-50">
                    {formatMillionWon(viewMode === 'sales' ? annual.salesTotal : annual.profitTotal)}
                  </td>
                )}
              </tr>
            );
          })}

          {/* 합계 행 */}
          <tr className="bg-slate-100 font-bold">
            <td className="px-3 py-2 text-slate-800 sticky left-0 bg-slate-100 z-10">합계</td>
            {quarters.map((q) => {
              let qSales = 0;
              let qProfit = 0;
              for (const group of productGroups) {
                qSales += matrix[group][q].salesTarget;
                qProfit += matrix[group][q].profitTarget;
              }
              return viewMode === 'both' ? (
                <React.Fragment key={q}>
                  <td className="px-3 py-2 text-right text-slate-800">{formatMillionWon(qSales)}</td>
                  <td className="px-3 py-2 text-right text-emerald-700">{formatMillionWon(qProfit)}</td>
                </React.Fragment>
              ) : (
                <td key={q} className="px-3 py-2 text-right text-slate-800">
                  {formatMillionWon(viewMode === 'sales' ? qSales : qProfit)}
                </td>
              );
            })}
            {viewMode === 'both' ? (
              <>
                <td className="px-3 py-2 text-right text-slate-800 bg-slate-200">{formatMillionWon(grandTotal.salesTotal)}</td>
                <td className="px-3 py-2 text-right text-emerald-700 bg-slate-200">{formatMillionWon(grandTotal.profitTotal)}</td>
              </>
            ) : (
              <td className="px-3 py-2 text-right text-slate-800 bg-slate-200">
                {formatMillionWon(viewMode === 'sales' ? grandTotal.salesTotal : grandTotal.profitTotal)}
              </td>
            )}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
