import { formatMillionWonTooltip } from '@/utils/formatUtils';

interface PerformanceTooltipData {
  prevYearActual?: number;  // 전년 실적
  growthRate?: number;       // 전년 대비 성장율
  currentActual?: number;    // 당년 실적
  backlog?: number;          // 수주잔액
  achievementRate?: number;  // 목표 대비 달성율
}

interface PerformanceTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  dataExtractor?: (payload: any[]) => PerformanceTooltipData;
}

/**
 * 대시보드 차트 공통 커스텀 툴팁
 * 5개 항목: 전년실적, 성장율, 당년실적, 수주잔액, 달성율
 */
export default function PerformanceTooltip({
  active,
  payload,
  label,
  dataExtractor,
}: PerformanceTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const data = dataExtractor
    ? dataExtractor(payload)
    : extractFromPayload(payload);

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm min-w-[200px]">
      <p className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-1">{label}</p>
      <div className="space-y-1">
        {data.prevYearActual !== undefined && (
          <TooltipRow
            label="전년 실적"
            value={`${formatMillionWonTooltip(data.prevYearActual)} 백만원`}
            color="text-slate-500"
          />
        )}
        {data.growthRate !== undefined && (
          <TooltipRow
            label="전년 대비 성장율"
            value={`${data.growthRate >= 0 ? '+' : ''}${data.growthRate.toFixed(1)}%`}
            color={data.growthRate >= 0 ? 'text-emerald-600' : 'text-rose-600'}
          />
        )}
        {data.currentActual !== undefined && (
          <TooltipRow
            label="당년 실적"
            value={`${formatMillionWonTooltip(data.currentActual)} 백만원`}
            color="text-indigo-600"
          />
        )}
        {data.backlog !== undefined && (
          <TooltipRow
            label="수주잔액"
            value={`${formatMillionWonTooltip(data.backlog)} 백만원`}
            color="text-amber-600"
          />
        )}
        {data.achievementRate !== undefined && (
          <TooltipRow
            label="목표 대비 달성율"
            value={`${data.achievementRate.toFixed(1)}%`}
            color="text-blue-600"
          />
        )}
      </div>
    </div>
  );
}

function TooltipRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  );
}

/**
 * Recharts payload에서 기본 데이터 추출
 */
function extractFromPayload(payload: any[]): PerformanceTooltipData {
  const entry = payload[0]?.payload;
  if (!entry) return {};

  return {
    prevYearActual: entry.prevYearActual,
    growthRate: entry.growthRate,
    currentActual: entry.currentActual,
    backlog: entry.backlog,
    achievementRate: entry.achievementRate,
  };
}
