import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Factory } from 'lucide-react';
import { useIndustryGroupReport } from '@/hooks/useIndustryGroupReport';
import { usePreviousYearIndustryGroupData } from '@/hooks/usePreviousYearIndustryGroupData';
import { useBacklogData } from '@/features/dashboard/hooks/useBacklogData';
import { useReportTrendData } from '@/hooks/useReportTrendData';
import { FirestoreErrorFallback, LoadingSpinner } from '@/components/error';
import IndustryGroupReportFilterBar from '@/components/reports/IndustryGroupReportFilterBar';
import ReportTrendChart from '@/components/reports/ReportTrendChart';
import IndustryGroupSummaryTable from '@/components/reports/IndustryGroupSummaryTable';
import IndustryGroupCharts from '@/components/reports/IndustryGroupCharts';
import { formatMillionWon, formatCurrency as formatCurrencyFull } from '@/utils/formatUtils';
import ViewToggle from '@/components/ui/ViewToggle';
import { useViewMode } from '@/hooks/useViewMode';
import KPICardGrid from '@/components/common/KPICardGrid';

export default function IndustryGroupReportPage() {
  const navigate = useNavigate();
  const { viewMode, setViewMode } = useViewMode('profit');

  const {
    summaries,
    periodInfoList,
    availableYears,
    filter,
    setFilter,
    isLoading,
    error,
    refresh,
    industryGroups,
    dataItems,
  } = useIndustryGroupReport();

  // 트렌드 차트용 데이터
  const { data: prevIndustryData } = usePreviousYearIndustryGroupData(filter.year, industryGroups);
  const industryGroupConfig = useMemo(
    () => industryGroups.map(g => ({ name: g.name, keywords: g.keywords })),
    [industryGroups]
  );
  const { industryGroupsData: backlogIndustryGroups } = useBacklogData(filter.year, industryGroupConfig);
  const [trendSelectedGroup, setTrendSelectedGroup] = useState('전체');

  // 산업군 항목 드롭다운 옵션
  const trendItems = useMemo(() => {
    const names = dataItems.map(d => d.industryGroupName);
    const unique = [...new Set(names)];
    return [
      { value: '전체', label: '전체' },
      ...unique.map(name => ({ value: name, label: name })),
    ];
  }, [dataItems]);

  // 트렌드 데이터 소스
  const trendSource = useMemo(() => {
    const currentItems = dataItems.map(d => ({
      name: d.industryGroupName,
      months: d.months,
    }));

    const previousItems = prevIndustryData.map(d => ({
      name: d.industryGroupName,
      months: d.months,
    }));

    // 수주잔액
    const backlogByItem: Record<string, Record<string, { sales: number; cost: number }>> = {};
    for (const big of backlogIndustryGroups) {
      backlogByItem[big.industryGroupName] = big.months;
    }

    return { currentItems, previousItems, backlogByItem };
  }, [dataItems, prevIndustryData, backlogIndustryGroups]);

  const trendData = useReportTrendData(trendSource, trendSelectedGroup, filter.year, viewMode);

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
              <Factory className="w-6 h-6 text-emerald-600" />
              <h1 className="text-xl font-bold text-slate-900">산업군별 보고서</h1>
            </div>
          </div>

          <ViewToggle viewMode={viewMode} onChange={setViewMode} />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Filter Bar */}
        <IndustryGroupReportFilterBar
          filter={filter}
          onFilterChange={setFilter}
          industryGroups={industryGroups}
          availableYears={availableYears}
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
                    color: 'emerald' as const,
                    highlightWhen: 'sales' as const,
                  },
                  {
                    label: '총 매출이익 (백만원)',
                    value: formatMillionWon(totalProfit),
                    tooltip: formatCurrencyFull(totalProfit),
                    color: 'indigo' as const,
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
              selectedItem={trendSelectedGroup}
              onItemChange={setTrendSelectedGroup}
              titlePrefix="산업군별"
            />

            {/* Charts */}
            <IndustryGroupCharts
              summaries={summaries}
              periodInfoList={periodInfoList}
              viewMode={viewMode}
              dataItems={dataItems}
            />

            {/* Summary Table */}
            <IndustryGroupSummaryTable summaries={summaries} periodInfoList={periodInfoList} />
          </>
        )}
      </main>
    </div>
  );
}
