import React from 'react';
import { DollarSign, TrendingUp, Target } from 'lucide-react';
import { formatMillionWon } from '@/utils/formatUtils';
import type { Totals } from '@/types';

interface DashboardKPICardsProps {
  totals: Totals;
  monthRangeText: string;
  overallSalesAchievementRate: number | null | undefined;
  overallProfitAchievementRate: number | null | undefined;
  onSalesClick: () => void;
  onProfitClick: () => void;
  onAchievementClick: () => void;
}

function DashboardKPICards({
  totals,
  monthRangeText,
  overallSalesAchievementRate,
  overallProfitAchievementRate,
  onSalesClick,
  onProfitClick,
  onAchievementClick,
}: DashboardKPICardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. 누적 매출액 */}
      <div
        className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-blue-500 border-x border-b cursor-pointer transition-all hover:shadow-md"
        onClick={onSalesClick}
      >
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-slate-500">누적 매출액 (백만원)</h3>
          <DollarSign className="w-5 h-5 text-blue-500" />
        </div>
        <div className="text-2xl font-bold text-slate-900">{formatMillionWon(totals.totalSales)}</div>
        <p className="text-xs text-slate-400 mt-1">{monthRangeText} 합계</p>
      </div>

      {/* 2. 매출 달성율 */}
      <div
        className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-indigo-500 border-x border-b cursor-pointer transition-all hover:shadow-md"
        onClick={onAchievementClick}
      >
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-slate-500">매출 달성율</h3>
          <Target className="w-5 h-5 text-indigo-500" />
        </div>
        <div className={`text-2xl font-bold ${overallSalesAchievementRate && overallSalesAchievementRate >= 100 ? 'text-indigo-600' : overallSalesAchievementRate && overallSalesAchievementRate >= 75 ? 'text-blue-600' : 'text-amber-600'}`}>
          {overallSalesAchievementRate ? overallSalesAchievementRate.toFixed(1) : '-'}%
        </div>
        <p className="text-xs text-slate-400 mt-1">연간 목표 대비</p>
      </div>

      {/* 3. 누적 매출이익 */}
      <div
        className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-emerald-500 border-x border-b cursor-pointer transition-all hover:shadow-md"
        onClick={onProfitClick}
      >
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-slate-500">누적 매출이익 (백만원)</h3>
          <TrendingUp className="w-5 h-5 text-emerald-500" />
        </div>
        <div className="text-2xl font-bold text-emerald-600">{formatMillionWon(totals.totalProfit)}</div>
        <p className="text-xs text-slate-400 mt-1">{monthRangeText} 합계</p>
      </div>

      {/* 4. 이익 달성율 */}
      <div
        className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-violet-500 border-x border-b cursor-pointer transition-all hover:shadow-md"
        onClick={onAchievementClick}
      >
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-slate-500">매출이익 달성율</h3>
          <Target className="w-5 h-5 text-violet-500" />
        </div>
        <div className={`text-2xl font-bold ${overallProfitAchievementRate && overallProfitAchievementRate >= 100 ? 'text-violet-600' : overallProfitAchievementRate && overallProfitAchievementRate >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
          {overallProfitAchievementRate ? overallProfitAchievementRate.toFixed(1) : '-'}%
        </div>
        <p className="text-xs text-slate-400 mt-1">연간 목표 대비</p>
      </div>
    </div>
  );
}

export default React.memo(DashboardKPICards);
