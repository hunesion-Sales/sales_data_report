import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import type { DivisionSummary, PeriodInfo } from '@/types';
import { ChartWrapper } from '@/components/charts';
import { formatMillionWon, formatCurrency } from '@/utils/formatUtils';

interface DivisionChartsProps {
  summaries: DivisionSummary[];
  periodInfoList: PeriodInfo[];
  viewMode: 'sales' | 'profit';
}

const COLORS = [
  '#6366f1', // indigo
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#f97316', // orange
  '#ec4899', // pink
  '#84cc16', // lime
  '#14b8a6', // teal
];

export default function DivisionCharts({
  summaries,
  periodInfoList,
  viewMode,
}: DivisionChartsProps) {
  // 1. Stacked Bar Chart용 데이터: 기간별로 부문별 매출/이익 스택
  const stackedBarData = useMemo(() => {
    return periodInfoList.map((period) => {
      const entry: Record<string, string | number> = { name: period.label };
      for (const summary of summaries) {
        const pd = summary.periodBreakdown[period.key];
        const value = viewMode === 'sales' ? (pd?.sales || 0) : ((pd?.sales || 0) - (pd?.cost || 0));
        entry[summary.divisionName] = value;
      }
      return entry;
    });
  }, [summaries, periodInfoList, viewMode]);

  // 2. Pie Chart용 데이터: 부문별 총 매출/이익 비율
  const pieData = useMemo(() => {
    return summaries
      .filter((s) => s.totalSales > 0)
      .map((s) => ({
        name: s.divisionName,
        value: viewMode === 'sales' ? s.totalSales : s.totalProfit,
      }));
  }, [summaries, viewMode]);

  // 3. Ranking Bar Chart용 데이터: 부문별 총 매출/이익 순위
  const rankingData = useMemo(() => {
    return summaries
      .map((s) => ({
        name: s.divisionName,
        value: viewMode === 'sales' ? s.totalSales : s.totalProfit,
      }))
      .sort((a, b) => b.value - a.value);
  }, [summaries, viewMode]);

  if (summaries.length === 0) {
    return null;
  }

  const metricLabel = viewMode === 'sales' ? '매출액' : '매출이익';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print-avoid-break">
      {/* 1. Stacked Bar Chart: 기간별 부문별 추이 (Full Width) */}
      <ChartWrapper title={`기간별 부문 ${metricLabel} 추이 (단위: 백만원)`} height={350} className="lg:col-span-2">
        <BarChart data={stackedBarData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={formatMillionWon} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            labelStyle={{ fontWeight: 'bold' }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {summaries.map((summary, idx) => (
            <Bar
              key={summary.divisionId}
              dataKey={summary.divisionName}
              stackId="a"
              fill={COLORS[idx % COLORS.length]}
            />
          ))}
        </BarChart>
      </ChartWrapper>

      {/* 2. Pie Chart: 부문별 점유율 */}
      <ChartWrapper title={`부문별 ${metricLabel} 비율`} height={350}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
            labelLine={{ strokeWidth: 1 }}
          >
            {pieData.map((_, idx) => (
              <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
        </PieChart>
      </ChartWrapper>

      {/* 3. Ranking Bar Chart: 부문별 순위 */}
      <ChartWrapper title={`부문별 ${metricLabel} 순위 (단위: 백만원)`} height={350}>
        <BarChart
          data={rankingData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tickFormatter={formatMillionWon} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            cursor={{ fill: 'transparent' }}
          />
          <Bar
            dataKey="value"
            name={metricLabel}
            fill={viewMode === 'sales' ? '#6366f1' : '#10b981'}
            radius={[0, 4, 4, 0]}
            barSize={24}
          />
        </BarChart>
      </ChartWrapper>
    </div>
  );
}
