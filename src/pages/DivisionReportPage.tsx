import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDivisionReport } from '@/hooks/useDivisionReport';
import { FirestoreErrorFallback, LoadingSpinner } from '@/components/error';
import ReportFilterBar from '@/components/reports/ReportFilterBar';
import DivisionSummaryTable from '@/components/reports/DivisionSummaryTable';
import DivisionCharts from '@/components/reports/DivisionCharts';
import { formatMillionWon, formatCurrency as formatCurrencyFull } from '@/utils/formatUtils';

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

  const [viewMode, setViewMode] = useState<'sales' | 'profit'>('sales');

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
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('sales')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'sales'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              매출액 보기
            </button>
            <button
              onClick={() => setViewMode('profit')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'profit'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              매출이익 보기
            </button>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print-avoid-break">
              <div className={`bg-white p-6 rounded-xl shadow-sm border transition-all ${viewMode === 'sales' ? 'border-indigo-200 ring-1 ring-indigo-100' : 'border-slate-200'}`} title={formatCurrencyFull(summaries.reduce((acc, s) => acc + s.totalSales, 0))}>
                <p className="text-sm text-slate-500 mb-1">총 매출액 (백만원)</p>
                <p className="text-2xl font-bold text-slate-900">
                  {formatMillionWon(summaries.reduce((acc, s) => acc + s.totalSales, 0))}
                </p>
              </div>
              <div className={`bg-white p-6 rounded-xl shadow-sm border transition-all ${viewMode === 'profit' ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-slate-200'}`} title={formatCurrencyFull(summaries.reduce((acc, s) => acc + s.totalProfit, 0))}>
                <p className="text-sm text-slate-500 mb-1">총 매출이익 (백만원)</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatMillionWon(summaries.reduce((acc, s) => acc + s.totalProfit, 0))}
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
            <DivisionCharts summaries={summaries} periodInfoList={periodInfoList} viewMode={viewMode} />

            {/* Summary Table */}
            <DivisionSummaryTable summaries={summaries} periodInfoList={periodInfoList} />
          </>
        )}
      </main>
    </div>
  );
}
