import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from 'recharts';
import type { TargetAchievement } from '@/types';
import { ChartWrapper } from '@/components/charts';
import { formatMillionWonChart } from '@/utils/formatUtils';

interface AchievementChartsProps {
  achievements: TargetAchievement[];
  viewMode: 'sales' | 'profit';
}

const COLORS = [
  '#2563eb', // blue-600
  '#0ea5e9', // sky-500
  '#6366f1', // indigo-500
  '#06b6d4', // cyan-500
  '#3b82f6', // blue-500
  '#0284c7', // sky-600
  '#4f46e5', // indigo-600
  '#0891b2', // cyan-600
  '#60a5fa', // blue-400
  '#818cf8', // indigo-400
];



export default function AchievementCharts({ achievements, viewMode }: AchievementChartsProps) {
  const isSalesMode = viewMode === 'sales';

  // 그룹화된 바 차트 데이터
  const barData = useMemo(() => {
    return achievements.map((a, idx) => ({
      name: a.divisionName.length > 8 ? a.divisionName.substring(0, 8) + '...' : a.divisionName,
      actual: isSalesMode ? a.actualSales : a.actualProfit,
      target: isSalesMode ? a.target.salesTarget : (a.target.profitTarget || 0),
      achievementRate: isSalesMode ? a.salesAchievementRate : (a.profitAchievementRate || 0),
      fill: COLORS[idx % COLORS.length],
    }));
  }, [achievements, isSalesMode]);

  // 방사형 바 차트 데이터
  const radialData = useMemo(() => {
    return achievements.map((a, idx) => ({
      name: a.divisionName,
      achievementRate: Math.min(isSalesMode ? a.salesAchievementRate : (a.profitAchievementRate || 0), 200), // 최대 200%로 제한
      fill: COLORS[idx % COLORS.length],
    }));
  }, [achievements, isSalesMode]);

  const hasValidData = Array.isArray(achievements) && achievements.length > 0;
  const metricLabel = isSalesMode ? '매출' : '이익';

  if (!hasValidData) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 text-center py-8">달성 현황 데이터가 없습니다.</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 text-center py-8">달성 현황 데이터가 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Grouped Bar Chart: 목표 vs 실적 */}
      <ChartWrapper title={`부문별 ${metricLabel} 목표 vs 실적 (단위: 백만원)`} height={350}>
        <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={formatMillionWonChart} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value) => formatMillionWonChart(Number(value))} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="target" name="목표" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={24} />
          <Bar
            dataKey="actual"
            name="실적"
            fill={isSalesMode ? "#2563eb" : "#06b6d4"}
            radius={[4, 4, 0, 0]}
            barSize={24}
          />
        </BarChart>
      </ChartWrapper>

      {/* Radial Bar Chart: 부문별 달성율 */}
      <ChartWrapper title={`부문별 ${metricLabel} 달성율`} height={350}>
        <RadialBarChart
          innerRadius="20%"
          outerRadius="90%"
          data={radialData}
          startAngle={180}
          endAngle={0}
        >
          <PolarAngleAxis type="number" domain={[0, 200]} angleAxisId={0} tick={false} />
          <RadialBar
            background
            dataKey="achievementRate"
            angleAxisId={0}
            label={{ position: 'insideStart', fill: '#fff', fontSize: 11, fontWeight: 600 }}
          />
          <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, '달성율']} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
          />
        </RadialBarChart>
      </ChartWrapper>
    </div>
  );
}
