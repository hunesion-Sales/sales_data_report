import { useMemo, useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from 'recharts';
import type { TargetAchievement } from '@/types';

interface AchievementChartsProps {
  achievements: TargetAchievement[];
}

const COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#ec4899', '#84cc16', '#14b8a6',
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

export default function AchievementCharts({ achievements }: AchievementChartsProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // 컴포넌트가 DOM에 마운트된 후 차트 렌더링
    const timer = setTimeout(() => setIsMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // 그룹화된 바 차트 데이터
  const barData = useMemo(() => {
    return achievements.map((a, idx) => ({
      name: a.divisionName.length > 8 ? a.divisionName.substring(0, 8) + '...' : a.divisionName,
      actualSales: a.actualSales / 100000000,
      targetSales: a.target.salesTarget / 100000000,
      achievementRate: a.salesAchievementRate,
      fill: COLORS[idx % COLORS.length],
    }));
  }, [achievements]);

  // 방사형 바 차트 데이터
  const radialData = useMemo(() => {
    return achievements.map((a, idx) => ({
      name: a.divisionName,
      achievementRate: Math.min(a.salesAchievementRate, 200), // 최대 200%로 제한
      fill: COLORS[idx % COLORS.length],
    }));
  }, [achievements]);

  // 데이터 검증
  const hasValidData = Array.isArray(achievements) && achievements.length > 0;
  const shouldRenderCharts = isMounted && hasValidData;

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
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">부문별 목표 vs 실적</h3>
        <div className="h-80 min-h-[320px]" style={{ height: 320 }}>
          {!shouldRenderCharts ? (
            <div className="flex items-center justify-center h-full text-slate-500">차트 로딩 중...</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={formatCurrencyShort} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="targetSales" name="목표" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="actualSales" name="실적" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Radial Bar Chart: 부문별 달성율 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">부문별 달성율</h3>
        <div className="h-80 min-h-[320px]" style={{ height: 320 }}>
          {!shouldRenderCharts ? (
            <div className="flex items-center justify-center h-full text-slate-500">차트 로딩 중...</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
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
                <Tooltip formatter={(value) => [`${value}%`, '달성율']} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
