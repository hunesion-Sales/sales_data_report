import { Calendar, Filter, RefreshCw } from 'lucide-react';
import type { Division, ReportFilter, PeriodType, Quarter, HalfYear } from '@/types';
import { PERIOD_TYPE_LABELS } from '@/utils/periodUtils';

interface ReportFilterBarProps {
  filter: ReportFilter;
  onFilterChange: (filter: ReportFilter) => void;
  divisions: Division[];
  availableYears: number[];
  isAdmin?: boolean;
  onRefresh?: () => void;
  isLoading?: boolean;
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

export default function ReportFilterBar({
  filter,
  onFilterChange,
  divisions,
  availableYears,
  isAdmin = false,
  onRefresh,
  isLoading = false,
}: ReportFilterBarProps) {
  const handlePeriodTypeChange = (periodType: PeriodType) => {
    const updated: ReportFilter = { ...filter, periodType };
    // 기간 유형 변경 시 세부 선택 초기화
    delete updated.months;
    delete updated.quarters;
    delete updated.halfYears;
    onFilterChange(updated);
  };

  const handleMonthToggle = (month: number) => {
    const current = filter.months ?? [];
    const isSelected = current.includes(month);
    const next = isSelected
      ? current.filter(m => m !== month)
      : [...current, month].sort((a, b) => a - b);
    onFilterChange({ ...filter, months: next.length > 0 ? next : undefined });
  };

  const handleQuarterToggle = (quarter: Quarter) => {
    const current = filter.quarters ?? [];
    const isSelected = current.includes(quarter);
    const next = isSelected
      ? current.filter(q => q !== quarter)
      : [...current, quarter].sort();
    onFilterChange({ ...filter, quarters: next.length > 0 ? next : undefined });
  };

  const handleHalfYearToggle = (halfYear: HalfYear) => {
    const current = filter.halfYears ?? [];
    const isSelected = current.includes(halfYear);
    const next = isSelected
      ? current.filter(h => h !== halfYear)
      : [...current, halfYear].sort();
    onFilterChange({ ...filter, halfYears: next.length > 0 ? next : undefined });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* 연도 선택 */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <select
            value={filter.year}
            onChange={(e) =>
              onFilterChange({ ...filter, year: Number(e.target.value) })
            }
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            {availableYears.length > 0 ? (
              availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}년
                </option>
              ))
            ) : (
              <option value={new Date().getFullYear()}>
                {new Date().getFullYear()}년
              </option>
            )}
          </select>
        </div>

        {/* 기간 유형 탭 */}
        <div className="flex items-center bg-slate-100 rounded-lg p-1">
          {PERIOD_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => handlePeriodTypeChange(type)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter.periodType === type
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {PERIOD_TYPE_LABELS[type]}
            </button>
          ))}
        </div>

        {/* 세부 기간 선택 (다중 선택) */}
        {filter.periodType === 'monthly' && (
          <div className="flex gap-1 flex-wrap">
            {MONTHS.map((m) => (
              <button
                key={m.value}
                onClick={() => handleMonthToggle(m.value)}
                className={`px-2 py-1 text-xs rounded-md transition-all ${
                  filter.months?.includes(m.value)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}

        {filter.periodType === 'quarterly' && (
          <div className="flex gap-1">
            {QUARTERS.map((q) => (
              <button
                key={q.value}
                onClick={() => handleQuarterToggle(q.value)}
                className={`px-3 py-1 text-xs rounded-md transition-all ${
                  filter.quarters?.includes(q.value)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>
        )}

        {filter.periodType === 'semi-annual' && (
          <div className="flex gap-1">
            {HALF_YEARS.map((h) => (
              <button
                key={h.value}
                onClick={() => handleHalfYearToggle(h.value)}
                className={`px-3 py-1 text-xs rounded-md transition-all ${
                  filter.halfYears?.includes(h.value)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {h.label}
              </button>
            ))}
          </div>
        )}

        {/* 부문 필터 (관리자만) */}
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filter.divisionId || 'all'}
              onChange={(e) =>
                onFilterChange({
                  ...filter,
                  divisionId: e.target.value === 'all' ? undefined : e.target.value,
                })
              }
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="all">전체 부문</option>
              {divisions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 새로고침 버튼 */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="ml-auto p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            title="새로고침"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>
    </div>
  );
}
