import React, { useState } from 'react';
import DualBarLineChart from './shared/DualBarLineChart';
import type { DualBarLineChartDataItem } from './shared/DualBarLineChart';
import { DASHBOARD_BAR_COLORS } from '@/constants/colors';

export interface DivisionChartDataItem {
  name: string;
  target: number;         // 목표
  actual: number;         // 실적
  backlog: number;        // 수주잔액
  achievementRate: number; // 달성율 (실적 기준 or 실적+수주잔액 기준)
  achievementRateWithBacklog: number; // 실적+수주잔액 기준 달성율
  divisionId: string;
}

interface DivisionOverviewChartProps {
  data: DivisionChartDataItem[];
  viewMode: 'sales' | 'profit';
}

/**
 * 부문별 매출이익 목표 및 실적 / 달성율 차트
 * - 바: 목표(회색) + 실적(남색) + 수주잔액(골드)
 * - 라인: 달성율(인디고) — 1개만
 * - 실적만 보기 / 실적+수주잔액 보기 토글
 */
function DivisionOverviewChart({ data, viewMode }: DivisionOverviewChartProps) {
  const [includeBacklog, setIncludeBacklog] = useState(false);
  const label = viewMode === 'sales' ? '매출' : '매출이익';

  const chartData: DualBarLineChartDataItem[] = data.map(d => ({
    name: d.name,
    prevYearActual: d.target,
    currentActual: d.actual,
    backlog: includeBacklog ? d.backlog : 0,
    achievementRate: includeBacklog ? d.achievementRateWithBacklog : d.achievementRate,
    growthRate: 0, // 부문별 차트는 성장율 미표시
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-slate-800">부문별 {label} 목표 및 실적 / 달성율</h3>
        <div className="flex bg-slate-100 rounded-lg p-0.5">
          <button
            onClick={() => setIncludeBacklog(false)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              !includeBacklog ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            실적만 보기
          </button>
          <button
            onClick={() => setIncludeBacklog(true)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              includeBacklog ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            실적+수주잔액
          </button>
        </div>
      </div>
      <DualBarLineChart
        data={chartData}
        height={380}
        lineCount={1}
        barOverrides={{
          bar1Key: 'prevYearActual',
          bar1Name: '목표',
          bar1Color: DASHBOARD_BAR_COLORS.prevYear,
          bar2Key: 'currentActual',
          bar2Name: '실적',
          bar2Color: DASHBOARD_BAR_COLORS.current,
          bar3Key: 'backlog',
          bar3Name: '수주잔액',
          bar3Color: DASHBOARD_BAR_COLORS.backlog,
        }}
      />
    </div>
  );
}

export default React.memo(DivisionOverviewChart);
