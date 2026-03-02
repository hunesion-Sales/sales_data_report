import { CURRENT_YEAR } from '@/config/appConfig';
import type { PeriodType, Quarter, HalfYear, DashboardPeriodSelection } from '@/types';
import { PERIOD_TYPE_LABELS } from '@/utils/periodUtils';

interface PeriodSelectorProps {
  selection: DashboardPeriodSelection;
  onSelectionChange: (selection: DashboardPeriodSelection) => void;
  availableYears?: number[];
}

const PERIOD_TYPES: PeriodType[] = ['monthly', 'quarterly', 'semi-annual', 'annual'];

const QUARTERS: { value: Quarter; label: string }[] = [
  { value: 'Q1', label: '1분기' },
  { value: 'Q2', label: '2분기' },
  { value: 'Q3', label: '3분기' },
  { value: 'Q4', label: '4분기' },
];

const HALF_YEARS: { value: HalfYear; label: string }[] = [
  { value: 'H1', label: '상반기' },
  { value: 'H2', label: '하반기' },
];

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}월`,
}));

/**
 * 대시보드 기간 선택 컴포넌트
 * 연도 드롭다운 + 기간 유형 탭 + 세부 기간 선택
 */
export default function PeriodSelector({
  selection,
  onSelectionChange,
  availableYears,
}: PeriodSelectorProps) {
  const years = availableYears ?? [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

  const handlePeriodTypeChange = (periodType: PeriodType) => {
    const updated: DashboardPeriodSelection = { ...selection, periodType };
    // 기간 유형 변경 시 세부 선택 초기화
    delete updated.month;
    delete updated.quarter;
    delete updated.halfYear;
    onSelectionChange(updated);
  };

  const handleYearChange = (year: number) => {
    onSelectionChange({ ...selection, year });
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* 연도 선택 */}
      <select
        value={selection.year}
        onChange={(e) => handleYearChange(Number(e.target.value))}
        className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white
                   focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      >
        {years.map((y) => (
          <option key={y} value={y}>{y}년</option>
        ))}
      </select>

      {/* 기간 유형 탭 */}
      <div className="flex bg-slate-100 rounded-lg p-0.5">
        {PERIOD_TYPES.map((pt) => (
          <button
            key={pt}
            onClick={() => handlePeriodTypeChange(pt)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              selection.periodType === pt
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            {PERIOD_TYPE_LABELS[pt]}
          </button>
        ))}
      </div>

      {/* 세부 기간 선택 */}
      {selection.periodType === 'monthly' && (
        <div className="flex gap-1 flex-wrap">
          {MONTHS.map((m) => (
            <button
              key={m.value}
              onClick={() => onSelectionChange({ ...selection, month: m.value })}
              className={`px-2 py-1 text-xs rounded-md transition-all ${
                selection.month === m.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      {selection.periodType === 'quarterly' && (
        <div className="flex gap-1">
          {QUARTERS.map((q) => (
            <button
              key={q.value}
              onClick={() => onSelectionChange({ ...selection, quarter: q.value })}
              className={`px-3 py-1 text-xs rounded-md transition-all ${
                selection.quarter === q.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {q.label}
            </button>
          ))}
        </div>
      )}

      {selection.periodType === 'semi-annual' && (
        <div className="flex gap-1">
          {HALF_YEARS.map((h) => (
            <button
              key={h.value}
              onClick={() => onSelectionChange({ ...selection, halfYear: h.value })}
              className={`px-3 py-1 text-xs rounded-md transition-all ${
                selection.halfYear === h.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {h.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
