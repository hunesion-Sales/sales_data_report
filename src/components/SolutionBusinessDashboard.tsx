import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ProductData, ProcessedProduct, Totals } from '@/types';
import { getMonthShortLabel } from '@/types';
import { useReport } from '@/hooks/useReport';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ComposedChart, Line
} from 'recharts';
import {
  Table as TableIcon, TrendingUp, DollarSign, Calendar,
  Cloud, CloudOff, Loader2, Target
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAchievement } from '@/hooks/useAchievement';
import { getCurrentQuarter, getQuarterLabel } from '@/utils/periodUtils';
import { ChartWrapper } from '@/components/charts';
import { formatMillionWon, formatCurrency as formatCurrencyFull } from '@/utils/formatUtils';

// --- 초기 데이터 (동적 월 구조) ---
// --- 초기 데이터 (DB 로딩 전 빈 상태) ---
const DEFAULT_MONTHS: string[] = [];
const DEFAULT_MONTH_LABELS: Record<string, string> = {};
const INITIAL_DATA: ProductData[] = [];

export default function SolutionBusinessDashboard() {
  const navigate = useNavigate();
  const { user, firebaseUser, authReady, isAdmin } = useAuth();
  const { overallAchievementRate } = useAchievement(user?.divisionId, isAdmin);

  const {
    data, months,
    isLoading, isSaving, error: firestoreError,
  } = useReport(INITIAL_DATA, DEFAULT_MONTHS, DEFAULT_MONTH_LABELS, {
    firebaseUser,
    authReady,
  });

  // 제품의 특정 월 데이터를 안전하게 가져오기
  const getMonthData = (item: ProductData, monthKey: string) => {
    return item.months[monthKey] ?? { sales: 0, cost: 0 };
  };

  // --- 데이터 가공 및 통계 계산 ---
  const processedData = useMemo<ProcessedProduct[]>(() => {
    // 빈 월 데이터 생성 헬퍼
    const emptyMonths = (): Record<string, { sales: number; cost: number }> => {
      const m: Record<string, { sales: number; cost: number }> = {};
      months.forEach(key => { m[key] = { sales: 0, cost: 0 }; });
      return m;
    };

    const aggregatedGroups: Record<string, ProductData> = {
      '유지보수': { id: 'maintenance_total', product: '유지보수', months: emptyMonths() },
      '기타': { id: 'etc_total', product: '기타', months: emptyMonths() },
    };
    const regularItems: ProductData[] = [];

    data.forEach(item => {
      if (item.product.endsWith('_MA')) {
        months.forEach(mk => {
          const md = getMonthData(item, mk);
          aggregatedGroups['유지보수'].months[mk].sales += md.sales;
          aggregatedGroups['유지보수'].months[mk].cost += md.cost;
        });
      } else if (item.product === 'H/W' || item.product === '기타') {
        months.forEach(mk => {
          const md = getMonthData(item, mk);
          aggregatedGroups['기타'].months[mk].sales += md.sales;
          aggregatedGroups['기타'].months[mk].cost += md.cost;
        });
      } else {
        regularItems.push(item);
      }
    });

    const aggregatedList = [...regularItems, aggregatedGroups['유지보수'], aggregatedGroups['기타']];

    return aggregatedList.map(item => {
      const processedMonths: Record<string, { sales: number; cost: number; profit: number }> = {};
      let totalSales = 0;
      let totalCost = 0;

      months.forEach(mk => {
        const md = getMonthData(item, mk);
        const profit = md.sales - md.cost;
        processedMonths[mk] = { sales: md.sales, cost: md.cost, profit };
        totalSales += md.sales;
        totalCost += md.cost;
      });

      return {
        id: item.id,
        product: item.product,
        months: processedMonths,
        totalSales,
        totalCost,
        totalProfit: totalSales - totalCost,
      };
    }).sort((a, b) => b.totalSales - a.totalSales);
  }, [data, months]);

  const totals = useMemo<Totals>(() => {
    const byMonth: Record<string, { sales: number; cost: number; profit: number }> = {};
    months.forEach(mk => { byMonth[mk] = { sales: 0, cost: 0, profit: 0 }; });

    let totalSales = 0;
    let totalCost = 0;

    processedData.forEach(item => {
      months.forEach(mk => {
        const md = item.months[mk] ?? { sales: 0, cost: 0, profit: 0 };
        byMonth[mk].sales += md.sales;
        byMonth[mk].cost += md.cost;
        byMonth[mk].profit += md.profit;
      });
      totalSales += item.totalSales;
      totalCost += item.totalCost;
    });

    return { byMonth, totalSales, totalCost, totalProfit: totalSales - totalCost };
  }, [processedData, months]);

  const topProducts = useMemo(() => {
    return [...processedData]
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 7);
  }, [processedData]);

  const monthlyTrend = useMemo(() => {
    return months.map(mk => ({
      name: getMonthShortLabel(mk),
      sales: totals.byMonth[mk]?.sales ?? 0,
      profit: totals.byMonth[mk]?.profit ?? 0,
    }));
  }, [months, totals]);

  // 월 범위 텍스트 (예: "1월~2월")
  const monthRangeText = useMemo(() => {
    if (months.length === 0) return '';
    if (months.length === 1) return getMonthShortLabel(months[0]);
    return `${getMonthShortLabel(months[0])}~${getMonthShortLabel(months[months.length - 1])}`;
  }, [months]);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-6 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">매출 현황 <span className="text-slate-500 font-normal text-base">({monthRangeText})</span></h1>
          <p className="text-sm text-slate-500 mt-1">실시간 프로젝트 매출 및 손익 관리</p>
        </div>

        {/* Firestore Data Status */}
        <div className="flex items-center gap-3">
          {isSaving ? (
            <span className="flex items-center gap-1 text-xs text-amber-600">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              저장 중...
            </span>
          ) : firestoreError ? (
            <span className="flex items-center gap-1 text-xs text-red-500" title={firestoreError}>
              <CloudOff className="w-3.5 h-3.5" />
              오프라인
            </span>
          ) : !isLoading ? (
            <span className="flex items-center gap-1 text-xs text-accent-600">
              <Cloud className="w-3.5 h-3.5" />
              동기화됨
            </span>
          ) : null}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 누적 총 매출액 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200" title={formatCurrencyFull(totals.totalSales)}>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-slate-500">누적 총 매출액 (백만원)</h3>
            <DollarSign className="w-5 h-5 text-primary-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{formatMillionWon(totals.totalSales)}</div>
          <p className="text-xs text-slate-400 mt-1">{monthRangeText} 합계</p>
        </div>
        {/* 누적 매출이익 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200" title={formatCurrencyFull(totals.totalProfit)}>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-slate-500">누적 매출이익 (백만원)</h3>
            <TrendingUp className="w-5 h-5 text-accent-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{formatMillionWon(totals.totalProfit)}</div>
          <p className="text-xs text-accent-600 mt-1">
            이익률 {totals.totalSales > 0 ? ((totals.totalProfit / totals.totalSales) * 100).toFixed(1) : 0}%
          </p>
        </div>
        {/* 월별 KPI (최근 2개월) */}
        {months.slice(-2).map(mk => {
          const md = totals.byMonth[mk];
          return (
            <div key={mk} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200" title={`매출: ${formatCurrencyFull(md?.sales)} / 이익: ${formatCurrencyFull(md?.profit)}`}>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-slate-500">{getMonthShortLabel(mk)} 매출 (백만원)</h3>
                <Calendar className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{formatMillionWon(md?.sales ?? 0)}</div>
              <p className="text-xs text-slate-400 mt-1">이익 {formatMillionWon(md?.profit ?? 0)}</p>
            </div>
          );
        })}
      </div>

      {/* 분기 달성율 KPI */}
      {overallAchievementRate !== null && (
        <div
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:border-indigo-300 transition-colors"
          onClick={() => navigate('/achievement')}
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-slate-500">{getQuarterLabel(getCurrentQuarter())} 달성율</h3>
            <Target className="w-5 h-5 text-primary-500" />
          </div>
          <div className={`text-2xl font-bold ${overallAchievementRate >= 100 ? 'text-accent-600' :
            overallAchievementRate >= 75 ? 'text-primary-600' :
              overallAchievementRate >= 50 ? 'text-amber-600' : 'text-red-600'
            }`}>
            {overallAchievementRate.toFixed(1)}%
          </div>
          <p className="text-xs text-slate-400 mt-1">클릭하여 상세 보기</p>
        </div>
      )}

      {/* Charts Section - 인쇄 시 숨김 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
        <div className="lg:col-span-2" style={{ minHeight: '400px' }}>
          <ChartWrapper
            title="주요 제품별 매출 및 이익 현황(Top 7) (단위: 백만원)"
            height={320}
          >
            <ComposedChart data={topProducts} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="product" scale="point" padding={{ left: 30, right: 30 }} tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tickFormatter={formatMillionWon} tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={formatMillionWon} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => formatCurrencyFull(Number(value))} />
              <Legend />
              <Bar yAxisId="left" dataKey="totalSales" name="매출액" fill="#a855f7" barSize={30} radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="totalProfit" name="매출이익" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
            </ComposedChart>
          </ChartWrapper>
        </div>

        <div style={{ minHeight: '400px' }}>
          <ChartWrapper title="월별 매출 추이 (단위: 백만원)" height={320}>
            <BarChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={formatMillionWon} tick={{ fontSize: 11 }} width={45} />
              <Tooltip formatter={(value) => formatCurrencyFull(Number(value))} />
              <Bar dataKey="sales" name="매출" fill="#a855f7" radius={[6, 6, 0, 0]} barSize={40} />
            </BarChart>
          </ChartWrapper>
        </div>
      </div>

      {/* 인쇄용 헤더 - 화면에서는 숨김 */}
      <div className="hidden print:block mb-4">
        <h1 className="text-xl font-bold text-center">Hunesion Solution 사업본부 매출 현황</h1>
        <p className="text-sm text-center text-slate-600 mt-1">
          {monthRangeText} 실적 보고서 | 출력일: {new Date().toLocaleDateString('ko-KR')}
        </p>
      </div>


    </div>
  );
}
