import React, { useState, useEffect, useMemo } from 'react';
import { Save, Loader2 } from 'lucide-react';
import type { Division, QuarterlyTarget, QuarterlyTargetInput, Quarter } from '@/types';
import { getQuarterLabel } from '@/utils/periodUtils';

interface TargetInputTableProps {
  divisions: Division[];
  targets: QuarterlyTarget[];
  year: number;
  isSaving: boolean;
  onSave: (inputs: QuarterlyTargetInput[], createdBy: string) => Promise<void>;
  createdBy: string;
}

const QUARTERS: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];

type CellKey = string; // "{divisionId}-{quarter}"
type CellValue = { salesTarget: string; profitTarget: string };

function cellKey(divisionId: string, quarter: Quarter): CellKey {
  return `${divisionId}-${quarter}`;
}

export default function TargetInputTable({
  divisions,
  targets,
  year,
  isSaving,
  onSave,
  createdBy,
}: TargetInputTableProps) {
  const [matrix, setMatrix] = useState<Record<CellKey, CellValue>>({});

  // targets가 변경되면 matrix 초기화
  useEffect(() => {
    const initial: Record<CellKey, CellValue> = {};

    for (const div of divisions) {
      for (const q of QUARTERS) {
        initial[cellKey(div.id, q)] = { salesTarget: '', profitTarget: '' };
      }
    }

    for (const t of targets) {
      const key = cellKey(t.divisionId, t.quarter);
      initial[key] = {
        salesTarget: t.salesTarget > 0 ? String(t.salesTarget) : '',
        profitTarget: t.profitTarget && t.profitTarget > 0 ? String(t.profitTarget) : '',
      };
    }

    setMatrix(initial);
  }, [divisions, targets]);

  const handleChange = (key: CellKey, field: 'salesTarget' | 'profitTarget', value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    setMatrix(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: cleaned },
    }));
  };

  const hasChanges = useMemo(() => {
    const existingMap = new Map<string, QuarterlyTarget>();
    for (const t of targets) {
      existingMap.set(cellKey(t.divisionId, t.quarter), t);
    }

    for (const [key, cell] of Object.entries(matrix)) {
      const existing = existingMap.get(key);
      const salesVal = Number(cell.salesTarget) || 0;
      const profitVal = Number(cell.profitTarget) || 0;

      if (existing) {
        if (existing.salesTarget !== salesVal || (existing.profitTarget || 0) !== profitVal) {
          return true;
        }
      } else if (salesVal > 0 || profitVal > 0) {
        return true;
      }
    }
    return false;
  }, [matrix, targets]);

  const handleSave = async () => {
    const inputs: QuarterlyTargetInput[] = [];

    for (const div of divisions) {
      for (const q of QUARTERS) {
        const key = cellKey(div.id, q);
        const cell = matrix[key];
        const salesTarget = Number(cell?.salesTarget) || 0;
        const profitTarget = Number(cell?.profitTarget) || 0;

        if (salesTarget > 0) {
          inputs.push({
            year,
            quarter: q,
            divisionId: div.id,
            salesTarget,
            ...(profitTarget > 0 && { profitTarget }),
          });
        }
      }
    }

    await onSave(inputs, createdBy);
  };

  if (divisions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-500">
        등록된 영업부문이 없습니다.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <span className="text-sm text-slate-500">{year}년 분기별 매출 목표 (단위: 원)</span>
        <button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
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
                <th
                  key={q}
                  colSpan={2}
                  className="p-3 text-center border-b border-r border-slate-200 min-w-[200px]"
                >
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
                  <th className="p-2 border-b border-r border-slate-200 text-center">매출 목표</th>
                  <th className="p-2 border-b border-r border-slate-200 text-center">이익 목표</th>
                </React.Fragment>
              ))}
              <th className="p-2 border-b border-r border-slate-200 text-center bg-slate-50 font-bold text-slate-700">매출 합계</th>
              <th className="p-2 border-b border-slate-200 text-center bg-slate-50 font-bold text-slate-700">이익 합계</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {divisions.map(div => {
              // Calculate totals for this division
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
                    return (
                      <React.Fragment key={q}>
                        <td className="p-2 border-r border-slate-100">
                          <input
                            type="text"
                            value={cell.salesTarget ? Number(cell.salesTarget).toLocaleString() : ''}
                            onChange={(e) => handleChange(key, 'salesTarget', e.target.value)}
                            placeholder="0"
                            className="w-full px-2 py-1.5 text-right border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                          />
                        </td>
                        <td className="p-2 border-r border-slate-100">
                          <input
                            type="text"
                            value={cell.profitTarget ? Number(cell.profitTarget).toLocaleString() : ''}
                            onChange={(e) => handleChange(key, 'profitTarget', e.target.value)}
                            placeholder="0"
                            className="w-full px-2 py-1.5 text-right border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                          />
                        </td>
                      </React.Fragment>
                    );
                  })}
                  {/* Total Columns */}
                  <td className="p-2 text-right font-bold text-slate-800 border-r border-slate-100 bg-slate-50">
                    {totalSales > 0 ? totalSales.toLocaleString() : '-'}
                  </td>
                  <td className="p-2 text-right font-bold text-slate-800 bg-slate-50">
                    {totalProfit > 0 ? totalProfit.toLocaleString() : '-'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
