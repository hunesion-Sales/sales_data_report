import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Factory } from 'lucide-react';
import { useIndustryGroupReport } from '@/hooks/useIndustryGroupReport';
import { FirestoreErrorFallback, LoadingSpinner } from '@/components/error';
import IndustryGroupReportFilterBar from '@/components/reports/IndustryGroupReportFilterBar';
import IndustryGroupSummaryTable from '@/components/reports/IndustryGroupSummaryTable';
import IndustryGroupCharts from '@/components/reports/IndustryGroupCharts';
import { formatMillionWon, formatCurrency as formatCurrencyFull } from '@/utils/formatUtils';
import ViewToggle from '@/components/ui/ViewToggle';
import { useViewMode } from '@/hooks/useViewMode';
import KPICardGrid from '@/components/common/KPICardGrid';
import type { IndustryGroupDataItem } from '@/firebase/services/industryGroupDataService';

export default function IndustryGroupReportPage() {
  const navigate = useNavigate();
  const { viewMode, setViewMode } = useViewMode('sales');

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
