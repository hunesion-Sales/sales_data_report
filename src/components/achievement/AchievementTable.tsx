import type { TargetAchievement, AchievementStatus } from '@/types';
import { formatMillionWon, formatCurrency } from '@/utils/formatUtils';

interface AchievementTableProps {
  achievements: TargetAchievement[];
}

const STATUS_CONFIG: Record<AchievementStatus, { label: string; bgColor: string; textColor: string; barColor: string }> = {
  exceeded: { label: '초과달성', bgColor: 'bg-emerald-100', textColor: 'text-emerald-700', barColor: 'bg-emerald-500' },
  'on-track': { label: '순항', bgColor: 'bg-blue-100', textColor: 'text-blue-700', barColor: 'bg-blue-500' },
  behind: { label: '미달', bgColor: 'bg-amber-100', textColor: 'text-amber-700', barColor: 'bg-amber-500' },
  critical: { label: '위험', bgColor: 'bg-red-100', textColor: 'text-red-700', barColor: 'bg-red-500' },
};

export default function AchievementTable({ achievements }: AchievementTableProps) {
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
        <h3 className="text-sm font-semibold text-slate-700">부문별 달성 현황</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="p-3 text-left font-medium">영업부문</th>
              <th className="p-3 text-right font-medium">매출 목표 (백만원)</th>
              <th className="p-3 text-right font-medium">매출 실적 (백만원)</th>
              <th className="p-3 text-center font-medium min-w-[200px]">달성율</th>
              <th className="p-3 text-center font-medium">상태</th>
              <th className="p-3 text-right font-medium">매출 이익 (백만원)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {achievements.map(a => {
              const config = STATUS_CONFIG[a.status];
              const barWidth = Math.min(a.salesAchievementRate, 100);

              return (
                <tr key={a.target.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-3 font-medium text-slate-700">{a.divisionName}</td>
                  <td className="p-3 text-right text-slate-600" title={formatCurrency(a.target.salesTarget)}>
                    {formatMillionWon(a.target.salesTarget)}
                  </td>
                  <td className="p-3 text-right text-slate-800 font-medium" title={formatCurrency(a.actualSales)}>
                    {formatMillionWon(a.actualSales)}
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
                        {a.salesAchievementRate.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${config.bgColor} ${config.textColor}`}>
                      {config.label}
                    </span>
                  </td>
                  <td
                    className={`p-3 text-right font-medium ${a.actualProfit < 0 ? 'text-red-600' : 'text-slate-700'}`}
                    title={formatCurrency(a.actualProfit)}
                  >
                    {formatMillionWon(a.actualProfit)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
