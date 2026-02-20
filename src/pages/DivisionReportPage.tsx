
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDivisionReport } from '@/hooks/useDivisionReport';
import { useAchievement } from '@/hooks/useAchievement';
import { FirestoreErrorFallback, LoadingSpinner } from '@/components/error';
import ReportFilterBar from '@/components/reports/ReportFilterBar';
import DivisionSummaryTable from '@/components/reports/DivisionSummaryTable';
import DivisionCharts from '@/components/reports/DivisionCharts';
import { formatMillionWon, formatCurrency as formatCurrencyFull } from '@/utils/formatUtils';
import ViewToggle from '@/components/ui/ViewToggle';
import { useViewMode } from '@/hooks/useViewMode';
import KPICardGrid from '@/components/common/KPICardGrid';

export default function DivisionReportPage() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { viewMode, setViewMode } = useViewMode('sales');

  const {
    divisions,
    summaries,
    periodInfoList,
    availableYears,
    filter,
    setFilter,
    isLoading,
    error,
    refresh,
  } = useDivisionReport(user?.divisionId, isAdmin);

  // Achievement Data for Dual Axis Chart (Yearly)
  const {
    achievements,
    setYear: setAchievementYear,
    setPeriod: setAchievementPeriod
  } = useAchievement(user?.divisionId, isAdmin);

  // Sync Achievement Year with Report Filter Year
  useEffect(() => {
    setAchievementYear(filter.year);
    setAchievementPeriod('Year'); // Always use Year for the high-level chart
  }, [filter.year, setAchievementYear, setAchievementPeriod]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm print-hide">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-indigo-600" />
              <h1 className="text-xl font-bold text-slate-900">부문별 보고서</h1>
            </div>
          </div>

          {/* View Mode Toggle */}
          <ViewToggle viewMode={viewMode} onChange={setViewMode} />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Filter Bar */}
        <ReportFilterBar
          filter={filter}
          onFilterChange={setFilter}
          divisions={divisions}
          availableYears={availableYears}
          isAdmin={isAdmin}
          onRefresh={refresh}
          isLoading={isLoading}
        />

        {/* Loading State */}
        {isLoading && (
          <LoadingSpinner size="lg" message="데이터를 불러오는 중..." />
        )}

        {/* Error State */}
        {error && !isLoading && (
          <FirestoreErrorFallback
            error={error}
            onRetry={refresh}
            title="데이터를 불러올 수 없습니다"
          />
        )}

        {/* Content */}
        {!isLoading && !error && (
          <>
            {/* Summary KPI Cards */}
            <KPICardGrid
              viewMode={viewMode}
              cards={(() => {
                const totalSales = summaries.reduce((acc, s) => acc + s.totalSales, 0);
                const totalProfit = summaries.reduce((acc, s) => acc + s.totalProfit, 0);
                return [
                  {
                    label: '총 매출액 (백만원)',
                    value: formatMillionWon(totalSales),
                    tooltip: formatCurrencyFull(totalSales),
                    color: 'indigo' as const,
                    highlightWhen: 'sales' as const,
                  },
                  {
                    label: '총 매출이익 (백만원)',
                    value: formatMillionWon(totalProfit),
                    tooltip: formatCurrencyFull(totalProfit),
                    color: 'emerald' as const,
                    highlightWhen: 'profit' as const,
                  },
                  {
                    label: '평균 매출이익률',
                    value: totalSales > 0 ? `${((totalProfit / totalSales) * 100).toFixed(1)}%` : '-',
                    color: 'violet' as const,
                  },
                ];
              })()}
            />

            {/* Charts */}
            <DivisionCharts
              summaries={summaries}
              periodInfoList={periodInfoList}
              viewMode={viewMode}
              achievements={achievements}
            />

            {/* Summary Table */}
            <DivisionSummaryTable summaries={summaries} periodInfoList={periodInfoList} />
          </>
        )}
      </main>
    </div>
  );
}
