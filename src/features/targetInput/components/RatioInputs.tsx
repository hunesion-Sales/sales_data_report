import { ChevronRight } from 'lucide-react';
import { QUARTERS } from '../hooks/useTargetMatrix';
import { getQuarterLabel } from '@/utils/periodUtils';

interface RatioInputsProps {
  ratios: number[];
  ratioTotal: number;
  onRatioChange: (index: number, value: string) => void;
}

export default function RatioInputs({ ratios, ratioTotal, onRatioChange }: RatioInputsProps) {
  return (
    <div className="pt-4 border-t border-slate-100 animate-slide-up">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <ChevronRight className="w-4 h-4 text-indigo-500" />
          분기별 배분 비율 (매출/매출이익 공통)
        </span>
        <span className={`text-xs font-medium ${ratioTotal === 100 ? 'text-green-600' : 'text-red-500'}`}>
          합계: {ratioTotal}%
        </span>
      </div>
      <div className="grid grid-cols-4 gap-4 max-w-2xl">
        {QUARTERS.map((q, idx) => (
          <div key={q}>
            <label className="block text-xs text-slate-500 mb-1 text-center">{getQuarterLabel(q)}</label>
            <div className="relative">
              <input
                type="text"
                value={ratios[idx]}
                onChange={(e) => onRatioChange(idx, e.target.value)}
                className="w-full px-2 py-1.5 text-center border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm font-medium text-slate-700"
              />
              <span className="absolute right-2 top-1.5 text-xs text-slate-400">%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
