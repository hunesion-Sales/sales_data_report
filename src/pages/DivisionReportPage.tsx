import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDivisionReport } from '@/hooks/useDivisionReport';
import ReportFilterBar from '@/components/reports/ReportFilterBar';
import DivisionSummaryTable from '@/components/reports/DivisionSummaryTable';
import DivisionCharts from '@/components/reports/DivisionCharts';

export default function DivisionReportPage() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

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
              <BarChart3 className="w-6 h-6 text-indigo-600" />
              <h1 className="text-xl font-bold text-slate-900">부문별 보고서</h1>
            </div>
          </div>
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
            {/* Summary KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <p className="text-sm text-slate-500 mb-1">총 매출액</p>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrencyWithUnit(
                    summaries.reduce((acc, s) => acc + s.totalSales, 0)
                  )}
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <p className="text-sm text-slate-500 mb-1">총 매출이익</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCurrencyWithUnit(
                    summaries.reduce((acc, s) => acc + s.totalProfit, 0)
                  )}
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <p className="text-sm text-slate-500 mb-1">평균 이익률</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {(() => {
                    const totalSales = summaries.reduce((acc, s) => acc + s.totalSales, 0);
                    const totalProfit = summaries.reduce((acc, s) => acc + s.totalProfit, 0);
                    return totalSales > 0
                      ? `${((totalProfit / totalSales) * 100).toFixed(1)}%`
                      : '-';
                  })()}
                </p>
              </div>
            </div>

            {/* Charts */}
            <DivisionCharts summaries={summaries} periodInfoList={periodInfoList} />

            {/* Summary Table */}
            <DivisionSummaryTable summaries={summaries} periodInfoList={periodInfoList} />
          </>
        )}
      </main>
    </div>
  );
}

// Helper function
function formatCurrencyWithUnit(value: number): string {
  if (Math.abs(value) >= 100000000) {
    return `${(value / 100000000).toFixed(1)}억`;
  } else if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(0)}백만`;
  }
  return value.toLocaleString();
}
