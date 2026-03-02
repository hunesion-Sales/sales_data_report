import React from 'react';
import { DollarSign, TrendingUp, Target, ClipboardList, BarChart3 } from 'lucide-react';
import { formatMillionWon } from '@/utils/formatUtils';

export interface DashboardKPIData {
  /** 1행: 실시간 매출 현황 */
  actual: number;              // 실적 (매출 or 이익)
  achievementRate: number | null; // 연간 달성율 (%)
  backlogTotal: number;        // 수주잔액
  expectedPerformance: number; // 예상 실적 (실적 + 수주잔액)
  predictedRate: number | null;   // 달성율(예측) (%)
  /** 2행: 전년 대비 현황 */
  prevYearActual: number;      // 전년 실적 (동 기간)
  periodGrowthRate: number | null; // 기간 대비 성장율 (%)
  prevYearAnnual: number;      // 전년 연간 실적
  annualGrowthRate: number | null; // 연간 대비 성장율(예측) (%)
}

interface DashboardKPICardsProps {
  data: DashboardKPIData;
  periodLabel: string;
  viewMode: 'sales' | 'profit';
  year?: number;
}

function formatRate(rate: number | null): string {
  if (rate === null || rate === undefined || !isFinite(rate)) return '-';
  return `${rate.toFixed(1)}%`;
}

function getRateColor(rate: number | null): string {
  if (rate === null || rate === undefined || !isFinite(rate)) return 'text-slate-400';
  if (rate >= 100) return 'text-blue-600';
  if (rate >= 75) return 'text-blue-500';
  return 'text-rose-500';
}

function getGrowthColor(rate: number | null): string {
  if (rate === null || rate === undefined || !isFinite(rate)) return 'text-slate-400';
  if (rate > 0) return 'text-emerald-600';
  if (rate < 0) return 'text-rose-600';
  return 'text-slate-500';
}

function formatGrowth(rate: number | null): string {
  if (rate === null || rate === undefined || !isFinite(rate)) return '-';
  const sign = rate > 0 ? '+' : '';
  return `${sign}${rate.toFixed(1)}%`;
}

function DashboardKPICards({ data, periodLabel, viewMode, year }: DashboardKPICardsProps) {
  const prevYear = year ? year - 1 : new Date().getFullYear() - 1;
  // periodLabel "2026년 1월~3월" → 전년도 "2025년 1월~3월"
  const prevPeriodLabel = year ? periodLabel.replace(String(year), String(prevYear)) : periodLabel;
  const label = viewMode === 'sales' ? '매출' : '매출이익';

  return (
    <div className="space-y-4">
      {/* 1행: 실시간 매출 현황 (5카드) */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">실시간 {label} 현황</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* 1. 실적 */}
          <div className="bg-white p-4 rounded-xl shadow-sm border-t-4 border-blue-500 border-x border-b">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-slate-500">실적 (백만원)</span>
              <DollarSign className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-xl font-bold text-slate-900">{formatMillionWon(data.actual)}</div>
            <p className="text-xs text-slate-400 mt-0.5">{periodLabel} 합계</p>
          </div>

          {/* 2. 연간 달성율 */}
          <div className="bg-white p-4 rounded-xl shadow-sm border-t-4 border-blue-400 border-x border-b">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-slate-500">연간 달성율</span>
              <Target className="w-4 h-4 text-blue-400" />
            </div>
            <div className={`text-xl font-bold ${getRateColor(data.achievementRate)}`}>
              {formatRate(data.achievementRate)}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">목표 대비</p>
          </div>

          {/* 3. 수주잔액 */}
          <div className="bg-white p-4 rounded-xl shadow-sm border-t-4 border-sky-400 border-x border-b">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-slate-500">수주잔액 (백만원)</span>
              <ClipboardList className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-xl font-bold text-sky-600">{formatMillionWon(data.backlogTotal)}</div>
            <p className="text-xs text-slate-400 mt-0.5">잔여 기간</p>
          </div>

          {/* 4. 연간 예상 실적 */}
          <div className="bg-white p-4 rounded-xl shadow-sm border-t-4 border-blue-600 border-x border-b">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-slate-500">예상 실적 (백만원)</span>
              <BarChart3 className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xl font-bold text-blue-700">{formatMillionWon(data.expectedPerformance)}</div>
            <p className="text-xs text-slate-400 mt-0.5">실적 + 수주잔액</p>
          </div>

          {/* 5. 달성율(예측) */}
          <div className="bg-white p-4 rounded-xl shadow-sm border-t-4 border-indigo-400 border-x border-b">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-slate-500">달성율 (예측)</span>
              <Target className="w-4 h-4 text-indigo-400" />
            </div>
            <div className={`text-xl font-bold ${getRateColor(data.predictedRate)}`}>
              {formatRate(data.predictedRate)}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">예상 실적 기준</p>
          </div>
        </div>
      </div>

      {/* 2행: 전년 대비 현황 (4카드) */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">전년 대비 현황</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 6. 전년 실적 */}
          <div className="bg-white p-4 rounded-xl shadow-sm border-t-4 border-slate-400 border-x border-b">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-slate-500">전년 실적 (백만원)</span>
              <DollarSign className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-xl font-bold text-slate-600">{formatMillionWon(data.prevYearActual)}</div>
            <p className="text-xs text-slate-400 mt-0.5">{prevPeriodLabel} 기준</p>
          </div>

          {/* 7. 기간 대비 성장율 */}
          <div className="bg-white p-4 rounded-xl shadow-sm border-t-4 border-cyan-500 border-x border-b">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-slate-500">기간 대비 성장율</span>
              <TrendingUp className="w-4 h-4 text-cyan-500" />
            </div>
            <div className={`text-xl font-bold ${getGrowthColor(data.periodGrowthRate)}`}>
              {formatGrowth(data.periodGrowthRate)}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">전년 동기간 대비</p>
          </div>

          {/* 8. 전년 연간 실적 */}
          <div className="bg-white p-4 rounded-xl shadow-sm border-t-4 border-slate-400 border-x border-b">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-slate-500">전년 연간 실적 (백만원)</span>
              <DollarSign className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-xl font-bold text-slate-600">{formatMillionWon(data.prevYearAnnual)}</div>
            <p className="text-xs text-slate-400 mt-0.5">{prevYear}년 실적</p>
          </div>

          {/* 9. 연간 대비 성장율(예측) */}
          <div className="bg-white p-4 rounded-xl shadow-sm border-t-4 border-teal-500 border-x border-b">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-slate-500">성장율 (예측)</span>
              <TrendingUp className="w-4 h-4 text-teal-500" />
            </div>
            <div className={`text-xl font-bold ${getGrowthColor(data.annualGrowthRate)}`}>
              {formatGrowth(data.annualGrowthRate)}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">전년 연간 대비</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(DashboardKPICards);
