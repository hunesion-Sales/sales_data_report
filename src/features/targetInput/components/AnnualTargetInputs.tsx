import { ChevronRight } from 'lucide-react';
import type { Division } from '@/types';
import { QUARTERS, cellKey } from '../hooks/useTargetMatrix';
import type { CellKey, CellValue } from '../hooks/useTargetMatrix';

interface AnnualTargetInputsProps {
  divisions: Division[];
  matrix: Record<CellKey, CellValue>;
  onTotalChange: (divisionId: string, field: 'salesTarget' | 'profitTarget', value: string) => void;
}

export default function AnnualTargetInputs({ divisions, matrix, onTotalChange }: AnnualTargetInputsProps) {
  return (
    <div className="pt-4 border-t border-slate-100 animate-slide-up">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <ChevronRight className="w-4 h-4 text-indigo-500" />
          부문별 연간 목표 입력
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {divisions.map(div => {
          let currentSalesTotal = 0;
          let currentProfitTotal = 0;
          QUARTERS.forEach(q => {
            const cell = matrix[cellKey(div.id, q)];
            currentSalesTotal += Number(cell?.salesTarget) || 0;
            currentProfitTotal += Number(cell?.profitTarget) || 0;
          });

          return (
            <div key={div.id} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <div className="text-sm font-medium text-slate-700 mb-2">{div.name}</div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <label className="text-[10px] text-slate-500 absolute -top-1.5 left-2 bg-slate-50 px-1">매출</label>
                  <input
                    type="text"
                    value={currentSalesTotal > 0 ? currentSalesTotal.toLocaleString() : ''}
                    onChange={(e) => onTotalChange(div.id, 'salesTarget', e.target.value)}
                    placeholder="0"
                    className="w-full px-2 py-1.5 text-right border border-slate-200 rounded text-sm focus:ring-1 focus:ring-indigo-500 border-indigo-200 text-indigo-700 font-medium"
                  />
                </div>
                <div className="relative flex-1">
                  <label className="text-[10px] text-slate-500 absolute -top-1.5 left-2 bg-slate-50 px-1">매출이익</label>
                  <input
                    type="text"
                    value={currentProfitTotal > 0 ? currentProfitTotal.toLocaleString() : ''}
                    onChange={(e) => onTotalChange(div.id, 'profitTarget', e.target.value)}
                    placeholder="0"
                    className="w-full px-2 py-1.5 text-right border border-slate-200 rounded text-sm focus:ring-1 focus:ring-emerald-500 border-emerald-200 text-emerald-700 font-medium"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
