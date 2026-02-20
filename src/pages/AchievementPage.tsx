
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAchievement } from '@/hooks/useAchievement';
import { FirestoreErrorFallback, LoadingSpinner } from '@/components/error';
import AchievementTable from '@/components/achievement/AchievementTable';
import AchievementCharts from '@/components/achievement/AchievementCharts';
import type { AchievementPeriod } from '@/types';
import { getAchievementPeriodLabel } from '@/utils/periodUtils';
import ViewToggle from '@/components/ui/ViewToggle';
import { useViewMode } from '@/hooks/useViewMode';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 2 + i);

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
  const { viewMode, setViewMode } = useViewMode('profit');

  const {
    achievements,
    overallSalesAchievementRate,
    overallProfitAchievementRate,
    year,
    setYear,
    period,
    setPeriod,
    isLoading,
    error,
    totalSalesTarget,
    totalProfitTarget,
    totalActualSales,
    totalActualProfit,
    refresh,
  } = useAchievement(user?.divisionId, isAdmin);

  const getOverallStatusColor = () => {
    const rate = viewMode === 'sales' ? overallSalesAchievementRate : overallProfitAchievementRate;
    if (rate === null) return 'text-slate-400';
    if (rate >= 100) return 'text-emerald-600';
    if (rate >= 75) return 'text-blue-600';
    if (rate >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const getPeriodTitle = () => {
    const periodLabel = getAchievementPeriodLabel(period);
    const metricLabel = viewMode === 'sales' ? '매출' : '이익';
    if (period === 'Year') return `${year}년 연간 ${metricLabel} 목표`;
    return `${periodLabel} ${metricLabel} 목표`;
  }

  const currentTotalTarget = viewMode === 'sales' ? totalSalesTarget : totalProfitTarget;
  const currentAchievementRate = viewMode === 'sales' ? overallSalesAchievementRate : overallProfitAchievementRate;
  const currentActual = viewMode === 'sales' ? totalActualSales : totalActualProfit;

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

          {/* View Mode Toggle */}
          <ViewToggle viewMode={viewMode} onChange={setViewMode} />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
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

            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 overflow-x-auto max-w-[calc(100vw-150px)] sm:max-w-none no-scrollbar">
              {(['Q1', 'Q2', 'Q3', 'Q4', 'H1', 'H2', 'Year'] as AchievementPeriod[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${period === p
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  {getAchievementPeriodLabel(p)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <LoadingSpinner size="lg" message="데이터를 불러오는 중..." />
        )}

        {/* Error State */}
        {error && !isLoading && (
          <FirestoreErrorFallback
            error={error}
            onRetry={refresh}
            title="달성 현황을 불러올 수 없습니다"
          />
        )}

        {/* Content */}
        {!isLoading && !error && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* 1. 목표 */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-slate-500">{getPeriodTitle()}</h3>
                  <Target className="w-5 h-5 text-slate-400" />
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {currentTotalTarget > 0 ? formatCurrencyWithUnit(currentTotalTarget) : '-'}
                </div>
                <p className="text-xs text-slate-400 mt-1">{year}년 {getAchievementPeriodLabel(period)}</p>
              </div>

              {/* 2. 실적 (매출 or 이익) */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-slate-500">{viewMode === 'sales' ? '매출 실적' : '매출이익 실적'}</h3>
                  {viewMode === 'sales' ? <DollarSign className="w-5 h-5 text-blue-500" /> : <TrendingUp className="w-5 h-5 text-emerald-500" />}
                </div>
                <div className={`text-2xl font-bold ${viewMode === 'sales' ? 'text-slate-900' : 'text-emerald-600'}`}>
                  {formatCurrencyWithUnit(currentActual)}
                </div>
                <p className="text-xs text-slate-400 mt-1">{getAchievementPeriodLabel(period)} 누적</p>
              </div>

              {/* 3. 이익률 info (Only show if needed, or always show profit rate?) */}
              {/* User wants readable charts. KPI cards can be flexible. */}
              {/* Let's show Profit Rate always in 3rd card? Or switch based on view? */}
              {/* Dashboard logic reused? */}
              {/* Original code had Sales Actual and Profit Actual always. */}
              {/* I'll stick to original layout but update contents based on viewMode if I want to save space, OR keep showing both? */}
              {/* Original layout: Target, Sales, Profit, Rate. */}
              {/* Keeping it simple: Target (Dynamic), Sales Actual, Profit Actual, Rate (Dynamic) */}

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-slate-500">매출이익</h3>
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
                <div className={`text-2xl font-bold ${totalActualProfit < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {formatCurrencyWithUnit(totalActualProfit)}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  매출이익률 {totalActualSales > 0 ? ((totalActualProfit / totalActualSales) * 100).toFixed(1) : 0}%
                </p>
              </div>

              {/* 4. 달성율 */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-slate-500">
                    {viewMode === 'sales' ? '매출 달성율' : '매출이익 달성율'}
                  </h3>
                  <BarChart3 className="w-5 h-5 text-indigo-500" />
                </div>
                <div className={`text-2xl font-bold ${getOverallStatusColor()}`}>
                  {currentAchievementRate !== null ? `${currentAchievementRate.toFixed(1)}%` : '-'}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {viewMode === 'sales' ? '매출 목표 대비' : '매출이익 목표 대비'}
                </p>
              </div>
            </div>

            {/* Charts */}
            <AchievementCharts achievements={achievements} viewMode={viewMode} />

            {/* Table */}
            <AchievementTable achievements={achievements} viewMode={viewMode} />
          </>
        )
        }
      </main >
    </div >
  );
}
