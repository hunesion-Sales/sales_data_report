import { Calendar, Filter, RefreshCw } from 'lucide-react';
import type { IndustryGroup, IndustryGroupReportFilter, PeriodType } from '@/types';
import { PERIOD_TYPE_LABELS } from '@/utils/periodUtils';

interface IndustryGroupReportFilterBarProps {
  filter: IndustryGroupReportFilter;
  onFilterChange: (filter: IndustryGroupReportFilter) => void;
  industryGroups: IndustryGroup[];
  availableYears: number[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

const PERIOD_TYPES: PeriodType[] = ['monthly', 'quarterly', 'semi-annual', 'annual'];

export default function IndustryGroupReportFilterBar({
  filter,
  onFilterChange,
  industryGroups,
  availableYears,
  onRefresh,
  isLoading = false,
}: IndustryGroupReportFilterBarProps) {
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
              onClick={() => onFilterChange({ ...filter, periodType: type })}
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

        {/* 산업군 필터 */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filter.industryGroupName || 'all'}
            onChange={(e) =>
              onFilterChange({
                ...filter,
                industryGroupName: e.target.value === 'all' ? undefined : e.target.value,
              })
            }
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="all">전체 산업군</option>
            {industryGroups.map((g) => (
              <option key={g.id} value={g.name}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

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
