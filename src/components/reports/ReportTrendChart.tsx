import React, { useState } from 'react';
import DualBarLineChart from '@/features/dashboard/components/shared/DualBarLineChart';
import type { DualBarLineChartDataItem } from '@/features/dashboard/components/shared/DualBarLineChart';
import type { MonthlyTrendDataItem } from '@/features/dashboard/components/MonthlyTrendChart';

interface ReportTrendChartProps {
  data: MonthlyTrendDataItem[];
  viewMode: 'sales' | 'profit';
  items: { value: string; label: string }[];
  selectedItem: string;
  onItemChange: (value: string) => void;
  titlePrefix: string;
}

/**
 * 보고서용 트렌드 차트
 * - 누적/월별 토글
 * - 항목 선택 드롭다운
 * - 3개 막대: 전년실적/당년실적/수주잔액
 */
function ReportTrendChart({
  data,
  viewMode,
  items,
  selectedItem,
  onItemChange,
  titlePrefix,
}: ReportTrendChartProps) {
  const [isCumulative, setIsCumulative] = useState(true);

  const chartData: DualBarLineChartDataItem[] = isCumulative
    ? data.reduce<DualBarLineChartDataItem[]>((acc, item, idx) => {
        const prev = acc[idx - 1];
        acc.push({
          name: item.name,
          prevYearActual: (prev?.prevYearActual ?? 0) + item.prevYearActual,
          currentActual: (prev?.currentActual ?? 0) + item.currentActual,
          backlog: item.backlog,
          achievementRate: 0,
          growthRate: 0,
        });
        return acc;
      }, [])
    : data;

  const label = viewMode === 'sales' ? '매출액' : '매출이익';
  const selectedLabel = items.find(i => i.value === selectedItem)?.label ?? selectedItem;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-lg font-bold text-slate-800">
          {titlePrefix} 월별 {label} 및 예측 현황
          {selectedItem !== '전체' && (
            <span className="text-indigo-600 ml-1">- {selectedLabel}</span>
          )}
        </h3>
        <div className="flex items-center gap-3">
          {/* 항목 선택 */}
          <select
            value={selectedItem}
            onChange={(e) => onItemChange(e.target.value)}
            className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {items.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          {/* 누적/월별 토글 */}
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => setIsCumulative(true)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                isCumulative ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              누적 실적
            </button>
            <button
              onClick={() => setIsCumulative(false)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                !isCumulative ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              월별 실적
            </button>
          </div>
        </div>
      </div>
      <DualBarLineChart
        data={chartData}
        height={380}
        lineCount={0}
      />
    </div>
  );
}

export default React.memo(ReportTrendChart);
