import React, { useState } from 'react';
import DualBarLineChart from './shared/DualBarLineChart';
import type { DualBarLineChartDataItem } from './shared/DualBarLineChart';

export interface MonthlyTrendDataItem {
  name: string;
  prevYearActual: number;
  currentActual: number;
  backlog: number;
  achievementRate: number;
  growthRate: number;
}

interface MonthlyTrendChartProps {
  data: MonthlyTrendDataItem[];
  viewMode: 'sales' | 'profit';
}

/**
 * 월별 실적 및 예측 현황 차트
 * - 누적/월별 토글
 * - 바 3개: 전년실적(회색) + 당년실적(남색) + 수주잔액(골드)
 */
function MonthlyTrendChart({ data, viewMode }: MonthlyTrendChartProps) {
  const [isCumulative, setIsCumulative] = useState(true);

  const chartData: DualBarLineChartDataItem[] = isCumulative
    ? data.reduce<DualBarLineChartDataItem[]>((acc, item, idx) => {
        const prev = acc[idx - 1];
        acc.push({
          name: item.name,
          prevYearActual: (prev?.prevYearActual ?? 0) + item.prevYearActual,
          currentActual: (prev?.currentActual ?? 0) + item.currentActual,
          backlog: item.backlog,
          achievementRate: item.achievementRate,
          growthRate: item.growthRate,
        });
        return acc;
      }, [])
    : data;

  const label = viewMode === 'sales' ? '매출액' : '매출이익';

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-slate-800">월별 {label} 및 예측 현황</h3>
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
      <DualBarLineChart
        data={chartData}
        height={380}
        lineCount={0}
      />
    </div>
  );
}

export default React.memo(MonthlyTrendChart);
