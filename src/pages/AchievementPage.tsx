import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, Loader2, AlertCircle, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAchievement } from '@/hooks/useAchievement';
import AchievementTable from '@/components/achievement/AchievementTable';
import AchievementCharts from '@/components/achievement/AchievementCharts';
import type { Quarter } from '@/types';
import { getQuarterLabel } from '@/utils/periodUtils';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 2 + i);
const QUARTERS: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];

const formatCurrencyWithUnit = (value: number): string => {
  if (Math.abs(value) >= 100000000) {
    return `${(value / 100000000).toFixed(1)}억`;
  } else if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(0)}백만`;
  }
  return value.toLocaleString();
};

export default function AchievementPage() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const {
    achievements,
    overallAchievementRate,
    year,
    setYear,
    quarter,
    setQuarter,
    isLoading,
    error,
    totalTarget,
    totalActualSales,
    totalActualProfit,
  } = useAchievement(user?.divisionId, isAdmin);

  const getOverallStatusColor = () => {
    if (overallAchievementRate === null) return 'text-slate-400';
    if (overallAchievementRate >= 100) return 'text-emerald-600';
    if (overallAchievementRate >= 75) return 'text-blue-600';
    if (overallAchievementRate >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Target className="w-6 h-6 text-indigo-600" />
              <h1 className="text-xl font-bold text-slate-900">목표 달성 현황</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-500">연도</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            >
              {YEARS.map(y => (
                <option key={y} value={y}>{y}년</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            {QUARTERS.map(q => (
              <button
                key={q}
                onClick={() => setQuarter(q)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  quarter === q
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {getQuarterLabel(q)}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
            <p className="text-slate-500">데이터를 불러오는 중...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Content */}
        {!isLoading && !error && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-slate-500">분기 목표</h3>
                  <Target className="w-5 h-5 text-slate-400" />
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {totalTarget > 0 ? formatCurrencyWithUnit(totalTarget) : '-'}
                </div>
                <p className="text-xs text-slate-400 mt-1">{year}년 {getQuarterLabel(quarter)}</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-slate-500">매출 실적</h3>
                  <DollarSign className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {formatCurrencyWithUnit(totalActualSales)}
                </div>
                <p className="text-xs text-slate-400 mt-1">분기 누적</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-slate-500">전체 달성율</h3>
                  <BarChart3 className="w-5 h-5 text-indigo-500" />
                </div>
                <div className={`text-2xl font-bold ${getOverallStatusColor()}`}>
                  {overallAchievementRate !== null ? `${overallAchievementRate.toFixed(1)}%` : '-'}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {overallAchievementRate !== null && overallAchievementRate >= 100 ? '목표 초과 달성' : '목표 대비'}
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-slate-500">매출 이익</h3>
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
                <div className={`text-2xl font-bold ${totalActualProfit < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {formatCurrencyWithUnit(totalActualProfit)}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  이익률 {totalActualSales > 0 ? ((totalActualProfit / totalActualSales) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>

            {/* Charts */}
            <AchievementCharts achievements={achievements} />

            {/* Table */}
            <AchievementTable achievements={achievements} />
          </>
        )}
      </main>
    </div>
  );
}
