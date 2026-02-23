import { Keyboard, Calculator, Percent } from 'lucide-react';
import type { InputMode } from '../hooks/useTargetMatrix';

interface ModeToggleProps {
  mode: InputMode;
  onModeChange: (mode: InputMode) => void;
}

export default function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg">
        <button
          onClick={() => onModeChange('manual')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'manual'
            ? 'bg-white text-indigo-600 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          <Keyboard className="w-4 h-4" />
          직접 입력
        </button>
        <button
          onClick={() => onModeChange('percentage')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'percentage'
            ? 'bg-white text-indigo-600 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          <Calculator className="w-4 h-4" />
          퍼센트 배분
        </button>
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Percent className="w-4 h-4" />
        <span>{mode === 'manual' ? '각 분기별 목표를 직접 입력하면 합계가 자동 계산됩니다.' : '연간 목표와 비율을 입력하면 분기별 목표가 자동 배분됩니다.'}</span>
      </div>
    </div>
  );
}
