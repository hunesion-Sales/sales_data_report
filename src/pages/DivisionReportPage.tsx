
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDivisionReport } from '@/hooks/useDivisionReport';
import { useAchievement } from '@/hooks/useAchievement';
import { usePreviousYearDivisionData } from '@/hooks/usePreviousYearDivisionData';
import { useBacklogData } from '@/features/dashboard/hooks/useBacklogData';
import { useReportTrendData } from '@/hooks/useReportTrendData';
import { FirestoreErrorFallback, LoadingSpinner } from '@/components/error';
import ReportFilterBar from '@/components/reports/ReportFilterBar';
import ReportTrendChart from '@/components/reports/ReportTrendChart';
import DivisionSummaryTable from '@/components/reports/DivisionSummaryTable';
import DivisionCharts from '@/components/reports/DivisionCharts';
import { formatMillionWon, formatCurrency as formatCurrencyFull } from '@/utils/formatUtils';
import ViewToggle from '@/components/ui/ViewToggle';
import { useViewMode } from '@/hooks/useViewMode';
import KPICardGrid from '@/components/common/KPICardGrid';

export default function DivisionReportPage() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { viewMode, setViewMode } = useViewMode('profit');

  const {
    divisions,
    divisionItems,
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
    setAchievementPeriod('Year');
  }, [filter.year, setAchievementYear, setAchievementPeriod]);

  // 트렌드 차트용 데이터
  const { data: prevDivisionData } = usePreviousYearDivisionData(filter.year);
  const { divisions: backlogDivisions } = useBacklogData(filter.year);
  const [trendSelectedDivision, setTrendSelectedDivision] = useState('전체');

  // 부문 항목 드롭다운 옵션
  const trendItems = useMemo(() => {
    const names = divisionItems.map(d => d.divisionName);
    const unique = [...new Set(names)];
    return [
      { value: '전체', label: '전체' },
      ...unique.map(name => ({ value: name, label: name })),
    ];
  }, [divisionItems]);

  // 트렌드 데이터 소스
  const trendSource = useMemo(() => {
    const currentItems = divisionItems.map(d => ({
      name: d.divisionName,
      months: d.months,
    }));

    const previousItems = prevDivisionData.map(d => ({
      name: d.divisionName,
      months: d.months,
    }));

    // 수주잔액: backlogDivisions은 BacklogDivisionData[]
    const backlogByItem: Record<string, Record<string, { sales: number; cost: number }>> = {};
    for (const bd of backlogDivisions) {
      backlogByItem[bd.division] = bd.months;
    }

    return { currentItems, previousItems, backlogByItem };
  }, [divisionItems, prevDivisionData, backlogDivisions]);

  const trendData = useReportTrendData(trendSource, trendSelectedDivision, filter.year, viewMode);

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

            {/* 트렌드 차트 */}
            <ReportTrendChart
              data={trendData}
              viewMode={viewMode}
              items={trendItems}
              selectedItem={trendSelectedDivision}
              onItemChange={setTrendSelectedDivision}
              titlePrefix="부문별"
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
