
import React, { useState, useMemo } from 'react';
import { ArrowDownUp } from 'lucide-react';
import type { TargetAchievement, AchievementStatus } from '@/types';
import { formatMillionWon, formatCurrency } from '@/utils/formatUtils';

interface AchievementTableProps {
  achievements: TargetAchievement[];
  viewMode: 'sales' | 'profit';
}

const STATUS_CONFIG: Record<AchievementStatus, { label: string; bgColor: string; textColor: string; barColor: string }> = {
  exceeded: { label: '초과달성', bgColor: 'bg-emerald-100', textColor: 'text-emerald-700', barColor: 'bg-emerald-500' },
  'on-track': { label: '순항', bgColor: 'bg-blue-100', textColor: 'text-blue-700', barColor: 'bg-blue-500' },
  behind: { label: '미달', bgColor: 'bg-amber-100', textColor: 'text-amber-700', barColor: 'bg-amber-500' },
  critical: { label: '위험', bgColor: 'bg-red-100', textColor: 'text-red-700', barColor: 'bg-red-500' },
};

function AchievementTable({ achievements, viewMode }: AchievementTableProps) {
  const [sortKey, setSortKey] = useState<'actual' | 'target' | 'rate'>('actual');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const isSales = viewMode === 'sales';

  const handleSort = (key: 'actual' | 'target' | 'rate') => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const sortedAchievements = useMemo(() => {
    return [...achievements].sort((a, b) => {
      let valA = 0;
      let valB = 0;

      if (sortKey === 'actual') {
        valA = isSales ? a.actualSales : a.actualProfit;
        valB = isSales ? b.actualSales : b.actualProfit;
      } else if (sortKey === 'target') {
        valA = isSales ? a.target.salesTarget : (a.target.profitTarget || 0);
        valB = isSales ? b.target.salesTarget : (b.target.profitTarget || 0);
      } else { // rate
        valA = isSales ? a.salesAchievementRate : (a.profitAchievementRate || 0);
        valB = isSales ? b.salesAchievementRate : (b.profitAchievementRate || 0);
      }

      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
  }, [achievements, isSales, sortKey, sortOrder]);

  if (achievements.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-500">
        설정된 목표가 없습니다.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50">
        <h3 className="text-sm font-semibold text-slate-700">부문별 {isSales ? '매출' : '매출이익'} 달성 현황</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="p-3 text-left font-medium">영업부문</th>
              <th
                className="p-3 text-right font-medium cursor-pointer hover:bg-slate-200 transition-colors"
                onClick={() => handleSort('target')}
              >
                <div className="flex items-center justify-end gap-1">
                  {isSales ? '매출' : '매출이익'} 목표 (백만원)
                  {sortKey === 'target' && <ArrowDownUp className="w-3 h-3" />}
                </div>
              </th>
              <th
                className="p-3 text-right font-medium cursor-pointer hover:bg-slate-200 transition-colors"
                onClick={() => handleSort('actual')}
              >
                <div className="flex items-center justify-end gap-1">
                  {isSales ? '매출' : '매출이익'} 실적 (백만원)
                  {sortKey === 'actual' && <ArrowDownUp className="w-3 h-3" />}
                </div>
              </th>
              <th
                className="p-3 text-center font-medium min-w-[200px] cursor-pointer hover:bg-slate-200 transition-colors"
                onClick={() => handleSort('rate')}
              >
                <div className="flex items-center justify-center gap-1">
                  {isSales ? '매출' : '매출이익'} 달성율
                  {sortKey === 'rate' && <ArrowDownUp className="w-3 h-3" />}
                </div>
              </th>
              <th className="p-3 text-center font-medium">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedAchievements.map(a => {
              const achievementRate = isSales ? a.salesAchievementRate : (a.profitAchievementRate || 0);
              const status = achievementRate >= 100 ? 'exceeded' :
                achievementRate >= 75 ? 'on-track' :
                  achievementRate >= 50 ? 'behind' : 'critical';

              const config = STATUS_CONFIG[status as AchievementStatus];
              const barWidth = Math.min(achievementRate, 100);

              const targetVal = isSales ? a.target.salesTarget : (a.target.profitTarget || 0);
              const actualVal = isSales ? a.actualSales : a.actualProfit;

              return (
                <tr key={a.target.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-3 font-medium text-slate-700">{a.divisionName}</td>

                  <td className="p-3 text-right text-slate-600" title={formatCurrency(targetVal)}>
                    {formatMillionWon(targetVal)}
                  </td>
                  <td className={`p-3 text-right font-medium ${actualVal < 0 ? 'text-red-600' : 'text-slate-800'}`} title={formatCurrency(actualVal)}>
                    {formatMillionWon(actualVal)}
                  </td>

                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${config.barColor}`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <span className={`text-sm font-semibold min-w-[52px] text-right ${config.textColor}`}>
                        {achievementRate.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${config.bgColor} ${config.textColor}`}>
                      {config.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-slate-800">
            <tr>
              <td className="p-3">전체 합계</td>
              {(() => {
                const totalTarget = achievements.reduce((acc, a) => acc + (isSales ? a.target.salesTarget : (a.target.profitTarget || 0)), 0);
                const totalActual = achievements.reduce((acc, a) => acc + (isSales ? a.actualSales : a.actualProfit), 0);
                const totalRate = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;

                const status = totalRate >= 100 ? 'exceeded' : totalRate >= 75 ? 'on-track' : totalRate >= 50 ? 'behind' : 'critical';
                const config = STATUS_CONFIG[status];
                const barWidth = Math.min(totalRate, 100);

                return (
                  <>
                    <td className="p-3 text-right" title={formatCurrency(totalTarget)}>
                      {formatMillionWon(totalTarget)}
                    </td>
                    <td className={`p-3 text-right ${totalActual < 0 ? 'text-red-700' : ''}`} title={formatCurrency(totalActual)}>
                      {formatMillionWon(totalActual)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${config.barColor}`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                        <span className={`text-sm font-bold min-w-[52px] text-right ${config.textColor}`}>
                          {totalRate.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${config.bgColor} ${config.textColor}`}>
                        {config.label}
                      </span>
                    </td>
                  </>
                );
              })()}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default React.memo(AchievementTable);
