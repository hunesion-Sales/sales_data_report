import React from 'react';
import { Save, Loader2 } from 'lucide-react';
import type { Division } from '@/types';
import { getQuarterLabel } from '@/utils/periodUtils';
import { QUARTERS, cellKey } from '../hooks/useTargetMatrix';
import type { CellKey, CellValue, InputMode } from '../hooks/useTargetMatrix';

interface TargetDataTableProps {
  divisions: Division[];
  matrix: Record<CellKey, CellValue>;
  mode: InputMode;
  year: number;
  isSaving: boolean;
  hasChanges: boolean;
  ratioTotal: number;
  footerTotals: {
    sales: { Q1: number; Q2: number; Q3: number; Q4: number; Total: number };
    profit: { Q1: number; Q2: number; Q3: number; Q4: number; Total: number };
  };
  onChange: (key: CellKey, field: 'salesTarget' | 'profitTarget', value: string) => void;
  onSave: () => void;
}

export default function TargetDataTable({
  divisions,
  matrix,
  mode,
  year,
  isSaving,
  hasChanges,
  ratioTotal,
  footerTotals,
  onChange,
  onSave,
}: TargetDataTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <span className="text-sm text-slate-500">
          {year}년 분기별 매출 목표 (단위: 백만원)
          {matrix && Object.values(matrix).some(v => v.salesTarget || v.profitTarget) &&
            <span className="ml-2 text-xs text-orange-500 font-medium">
              * {mode === 'manual' ? '저장 버튼을 눌러야 반영됩니다.' : '자동 배분된 값은 저장 시 확정됩니다.'}
            </span>
          }
        </span>
        <button
          onClick={onSave}
          disabled={isSaving || !hasChanges || (mode === 'percentage' && ratioTotal !== 100)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          전체 저장
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-slate-100 text-slate-700 font-semibold">
            <tr>
              <th className="p-3 text-left border-b border-r border-slate-200 min-w-[150px] bg-slate-200 sticky left-0 z-10">
                영업부문
              </th>
              {QUARTERS.map(q => (
                <th key={q} colSpan={2} className="p-3 text-center border-b border-r border-slate-200 min-w-[200px]">
                  {getQuarterLabel(q)}
                </th>
              ))}
              <th colSpan={2} className="p-3 text-center border-b border-slate-200 min-w-[200px] bg-slate-50 text-slate-800">
                연간 합계
              </th>
            </tr>
            <tr className="text-xs text-slate-500">
              <th className="p-2 text-left border-b border-r border-slate-200 bg-slate-200 sticky left-0 z-10" />
              {QUARTERS.map(q => (
                <React.Fragment key={q}>
                  <th className="p-2 border-b border-r border-slate-200 text-center text-indigo-600">매출</th>
                  <th className="p-2 border-b border-r border-slate-200 text-center text-emerald-600">매출이익</th>
                </React.Fragment>
              ))}
              <th className="p-2 border-b border-r border-slate-200 text-center bg-slate-50 font-bold text-indigo-700">매출 합계</th>
              <th className="p-2 border-b border-slate-200 text-center bg-slate-50 font-bold text-emerald-700">매출이익 합계</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {divisions.map(div => {
              let totalSales = 0;
              let totalProfit = 0;
              QUARTERS.forEach(q => {
                const key = cellKey(div.id, q);
                const cell = matrix[key];
                if (cell) {
                  totalSales += Number(cell.salesTarget) || 0;
                  totalProfit += Number(cell.profitTarget) || 0;
                }
              });

              return (
                <tr key={div.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-3 font-medium text-slate-700 border-r border-slate-100 sticky left-0 bg-white">
                    {div.name}
                  </td>
                  {QUARTERS.map(q => {
                    const key = cellKey(div.id, q);
                    const cell = matrix[key] || { salesTarget: '', profitTarget: '' };
                    const isReadOnly = mode === 'percentage';

                    return (
                      <React.Fragment key={q}>
                        <td className={`p-2 border-r border-slate-100 ${isReadOnly ? 'bg-slate-50' : ''}`}>
                          <input
                            type="text"
                            value={cell.salesTarget ? Number(cell.salesTarget).toLocaleString() : ''}
                            onChange={(e) => onChange(key, 'salesTarget', e.target.value)}
                            readOnly={isReadOnly}
                            placeholder="0"
                            className={`w-full px-2 py-1.5 text-right border border-slate-200 rounded outline-none text-sm ${isReadOnly
                              ? 'bg-transparent text-slate-500 cursor-not-allowed border-transparent'
                              : 'focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500'
                              }`}
                          />
                        </td>
                        <td className={`p-2 border-r border-slate-100 ${isReadOnly ? 'bg-slate-50' : ''}`}>
                          <input
                            type="text"
                            value={cell.profitTarget ? Number(cell.profitTarget).toLocaleString() : ''}
                            onChange={(e) => onChange(key, 'profitTarget', e.target.value)}
                            readOnly={isReadOnly}
                            placeholder="0"
                            className={`w-full px-2 py-1.5 text-right border border-slate-200 rounded outline-none text-sm ${isReadOnly
                              ? 'bg-transparent text-slate-500 cursor-not-allowed border-transparent'
                              : 'focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500'
                              }`}
                          />
                        </td>
                      </React.Fragment>
                    );
                  })}
                  <td className="p-2 text-right border-r border-slate-100 bg-slate-50">
                    <span className="font-bold text-slate-800 pr-2 block">
                      {totalSales > 0 ? totalSales.toLocaleString() : '-'}
                    </span>
                  </td>
                  <td className="p-2 text-right bg-slate-50">
                    <span className="font-bold text-slate-800 pr-2 block">
                      {totalProfit > 0 ? totalProfit.toLocaleString() : '-'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-100 font-bold sticky bottom-0 text-slate-800 shadow-[0_-1px_0_rgba(0,0,0,0.1)]">
            <tr>
              <td className="p-3 border-t border-r border-slate-300 sticky left-0 bg-slate-100 z-10 text-center">전체 합계</td>
              {QUARTERS.map(q => (
                <React.Fragment key={q}>
                  <td className="p-2 border-t border-r border-slate-300 text-right text-indigo-700">
                    {footerTotals.sales[q] > 0 ? footerTotals.sales[q].toLocaleString() : '-'}
                  </td>
                  <td className="p-2 border-t border-r border-slate-300 text-right text-emerald-700">
                    {footerTotals.profit[q] > 0 ? footerTotals.profit[q].toLocaleString() : '-'}
                  </td>
                </React.Fragment>
              ))}
              <td className="p-2 border-t border-r border-slate-300 text-right text-indigo-800 bg-indigo-50">
                {footerTotals.sales.Total > 0 ? footerTotals.sales.Total.toLocaleString() : '-'}
              </td>
              <td className="p-2 border-t border-slate-300 text-right text-emerald-800 bg-emerald-50">
                {footerTotals.profit.Total > 0 ? footerTotals.profit.Total.toLocaleString() : '-'}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
