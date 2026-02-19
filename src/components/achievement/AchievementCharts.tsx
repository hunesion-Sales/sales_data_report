
import { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { TargetAchievement } from '@/types';
import { ChartWrapper } from '@/components/charts';
import { formatMillionWonChart } from '@/utils/formatUtils';

interface AchievementChartsProps {
  achievements: TargetAchievement[];
  viewMode: 'sales' | 'profit';
}



export default function AchievementCharts({ achievements, viewMode }: AchievementChartsProps) {
  const isSalesMode = viewMode === 'sales';

  // 1. Dual Axis Chart Data: Target vs Actual (Bars) + Achievement Rate (Line)
  const chartData = useMemo(() => {
    return achievements.map((a, idx) => ({
      name: a.divisionName,
      actual: isSalesMode ? a.actualSales : a.actualProfit,
      target: isSalesMode ? a.target.salesTarget : (a.target.profitTarget || 0),
      rate: isSalesMode ? a.salesAchievementRate : (a.profitAchievementRate || 0),
    }));
  }, [achievements, isSalesMode]);



  const hasValidData = Array.isArray(achievements) && achievements.length > 0;
  const metricLabel = isSalesMode ? '매출' : '매출이익';

  if (!hasValidData) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <p className="text-sm text-slate-500 text-center py-8">달성 현황 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 1. Dual Axis Chart: Target vs Actual + Rate */}
      <ChartWrapper title={`부문별 ${metricLabel} 목표 vs 실적 및 달성율`} height={350}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 30, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" scale="band" padding={{ left: 20, right: 20 }} tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" tickFormatter={formatMillionWonChart} tick={{ fontSize: 11 }} label={{ value: '(백만원)', position: 'top', offset: 10, fontSize: 11, fill: '#64748b' }} />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(val) => `${val.toFixed(0)}%`}
              tick={{ fontSize: 11 }}
              domain={[0, 100]} // Typically achievement rate is %
              label={{ value: '(%)', position: 'top', offset: 10, fontSize: 11, fill: '#64748b' }}
            />
            <Tooltip
              formatter={(value: any, name: any) => {
                if (name === '달성율') return `${Number(value).toFixed(1)}%`;
                return formatMillionWonChart(value);
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar yAxisId="left" dataKey="target" name="목표" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={40} />
            <Bar yAxisId="left" dataKey="actual" name="실적" fill={isSalesMode ? "#2563eb" : "#059669"} radius={[4, 4, 0, 0]} barSize={40} />
            <Line yAxisId="right" type="monotone" dataKey="rate" name="달성율" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartWrapper>
    </div>
  );
}
