import React from 'react';
import DualBarLineChart from './shared/DualBarLineChart';
import type { DualBarLineChartDataItem } from './shared/DualBarLineChart';

interface IndustryGroupChartProps {
  data: DualBarLineChartDataItem[];
  viewMode: 'sales' | 'profit';
}

/**
 * 주요 산업군별 누적 실적 순위 현황 차트
 * - X축: 산업군 (2026 실적 높은순 정렬)
 * - 바 3개: 전년실적 + 당년실적 + 수주잔액
 */
function IndustryGroupChart({ data, viewMode }: IndustryGroupChartProps) {
  const label = viewMode === 'sales' ? '매출액' : '매출이익';

  return (
    <DualBarLineChart
      data={data}
      title={`주요 산업군별 누적 ${label} 실적 순위 현황`}
      height={400}
      lineCount={0}
    />
  );
}

export default React.memo(IndustryGroupChart);
