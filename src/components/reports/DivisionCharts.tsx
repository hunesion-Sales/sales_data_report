import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import type { DivisionSummary, PeriodInfo } from '@/types';

interface DivisionChartsProps {
  summaries: DivisionSummary[];
  periodInfoList: PeriodInfo[];
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

const formatCurrencyShort = (value: number): string => {
  if (Math.abs(value) >= 100000000) {
    return `${(value / 100000000).toFixed(1)}억`;
  } else if (Math.abs(value) >= 10000000) {
    return `${(value / 10000000).toFixed(0)}천만`;
  } else if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(0)}백만`;
  }
  return value.toLocaleString();
};

const formatCurrency = (value: number): string => {
  return value.toLocaleString() + '원';
};

export default function DivisionCharts({
  summaries,
  periodInfoList,
}: DivisionChartsProps) {
  // Stacked Bar Chart용 데이터: 기간별로 부문별 매출 스택
  const stackedBarData = useMemo(() => {
    return periodInfoList.map((period) => {
      const entry: Record<string, string | number> = { name: period.label };
      for (const summary of summaries) {
        const pd = summary.periodBreakdown[period.key];
        entry[summary.divisionName] = pd?.sales || 0;
      }
      return entry;
    });
  }, [summaries, periodInfoList]);

  // Pie Chart용 데이터: 부문별 총 매출 비율
  const pieData = useMemo(() => {
    return summaries
      .filter((s) => s.totalSales > 0)
      .map((s) => ({
        name: s.divisionName,
        value: s.totalSales,
      }));
  }, [summaries]);

  // 이익률 비교 Bar Chart용 데이터
  const profitRateData = useMemo(() => {
    return summaries
      .filter((s) => s.totalSales > 0)
      .map((s) => ({
        name: s.divisionName,
        sales: s.totalSales,
        profit: s.totalProfit,
        profitRate: ((s.totalProfit / s.totalSales) * 100).toFixed(1),
      }))
      .sort((a, b) => b.sales - a.sales);
  }, [summaries]);

  if (summaries.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Stacked Bar Chart: 기간별 부문 매출 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">기간별 부문 매출</h3>
        <div className="h-80 min-h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stackedBarData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={formatCurrencyShort} tick={{ fontSize: 11 }} />
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
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie Chart: 부문별 매출 비율 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">부문별 매출 비율</h3>
        <div className="h-80 min-h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
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
          </ResponsiveContainer>
        </div>
      </div>

      {/* 부문별 매출 & 이익 비교 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 lg:col-span-2">
        <h3 className="text-lg font-bold text-slate-800 mb-4">부문별 매출 및 이익 비교</h3>
        <div className="h-72 min-h-[290px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={profitRateData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={formatCurrencyShort} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={90} />
              <Tooltip
                formatter={(value, name) => [
                  formatCurrency(Number(value)),
                  name === 'sales' ? '매출액' : '매출이익',
                ]}
              />
              <Legend
                formatter={(value) => (value === 'sales' ? '매출액' : '매출이익')}
                wrapperStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="sales" name="sales" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={16} />
              <Bar dataKey="profit" name="profit" fill="#10b981" radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
