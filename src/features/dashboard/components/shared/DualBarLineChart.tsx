import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LabelList, Legend,
} from 'recharts';
import { formatMillionWonChart } from '@/utils/formatUtils';
import { ChartWrapper } from '@/components/charts';
import { DASHBOARD_BAR_COLORS, DASHBOARD_LINE_COLORS } from '@/constants/colors';
import PerformanceTooltip from './PerformanceTooltip';

/** 차트에 표시할 데이터 항목 */
export interface DualBarLineChartDataItem {
  name: string;
  prevYearActual: number;  // 전년 실적 (바 1: 회색)
  currentActual: number;   // 당년 실적 (바 2: 남색)
  backlog: number;         // 수주잔액 (바 3: 골드)
  achievementRate: number; // 달성율 (라인 1: 인디고)
  growthRate: number;      // 성장율 (라인 2: 주황)
}

interface DualBarLineChartProps {
  data: DualBarLineChartDataItem[];
  title?: string;
  height?: number;
  /** 라인 차트 표시 개수: 0(없음), 1(달성율만), 2(달성율+성장율) */
  lineCount?: 0 | 1 | 2;
  /** 바 데이터키 재정의 (부문별 차트용) */
  barOverrides?: {
    bar1Key?: string;
    bar1Name?: string;
    bar1Color?: string;
    bar2Key?: string;
    bar2Name?: string;
    bar2Color?: string;
    bar3Key?: string;
    bar3Name?: string;
    bar3Color?: string;
  };
  loading?: boolean;
}

/**
 * 대시보드 공통 차트: 바 3개 + 라인 2개
 * 4개 차트 섹션(월별/제품군별/산업군별/부문별)에서 재사용
 * 색상 테마: colors.ts의 DASHBOARD_BAR_COLORS, DASHBOARD_LINE_COLORS 사용
 */
export default function DualBarLineChart({
  data,
  title,
  height = 400,
  lineCount = 2,
  barOverrides,
  loading = false,
}: DualBarLineChartProps) {
  const bar1Key = barOverrides?.bar1Key ?? 'prevYearActual';
  const bar1Name = barOverrides?.bar1Name ?? '전년 실적';
  const bar1Color = barOverrides?.bar1Color ?? DASHBOARD_BAR_COLORS.prevYear;

  const bar2Key = barOverrides?.bar2Key ?? 'currentActual';
  const bar2Name = barOverrides?.bar2Name ?? '당년 실적';
  const bar2Color = barOverrides?.bar2Color ?? DASHBOARD_BAR_COLORS.current;

  const bar3Key = barOverrides?.bar3Key ?? 'backlog';
  const bar3Name = barOverrides?.bar3Name ?? '수주잔액';
  const bar3Color = barOverrides?.bar3Color ?? DASHBOARD_BAR_COLORS.backlog;

  return (
    <ChartWrapper title={title} height={height} loading={loading} hasData={data.length > 0}>
      <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11 }}
          tickLine={false}
          interval={0}
          angle={data.length > 8 ? -30 : 0}
          textAnchor={data.length > 8 ? 'end' : 'middle'}
          height={data.length > 8 ? 60 : 30}
        />
        <YAxis
          yAxisId="left"
          tickFormatter={formatMillionWonChart}
          tick={{ fontSize: 11 }}
          label={{ value: '(백만원)', position: 'top', offset: 15, style: { fontSize: 10, fill: '#94a3b8' } }}
        />
        {/* 오른쪽 Y축 (라인이 있을 때만 표시) */}
        {lineCount > 0 && (
          <YAxis
            yAxisId="right"
            orientation="right"
            tickFormatter={(v) => `${v.toFixed(0)}%`}
            tick={{ fontSize: 11 }}
            domain={[0, 'auto']}
            label={{ value: '(%)', position: 'top', offset: 15, style: { fontSize: 10, fill: '#94a3b8' } }}
          />
        )}
        <Tooltip content={<PerformanceTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 11 }}
          iconType="rect"
          iconSize={10}
        />

        {/* 바 1: 전년 실적 */}
        <Bar yAxisId="left" dataKey={bar1Key} name={bar1Name} fill={bar1Color} barSize={20} radius={[2, 2, 0, 0]}>
          <LabelList dataKey={bar1Key} position="top" formatter={(v: any) => formatMillionWonChart(v)} fontSize={9} fill="#64748b" />
        </Bar>

        {/* 바 2: 당년 실적 */}
        <Bar yAxisId="left" dataKey={bar2Key} name={bar2Name} fill={bar2Color} barSize={20} radius={[2, 2, 0, 0]}>
          <LabelList dataKey={bar2Key} position="top" formatter={(v: any) => formatMillionWonChart(v)} fontSize={9} fill="#4338ca" />
        </Bar>

        {/* 바 3: 수주잔액 */}
        <Bar yAxisId="left" dataKey={bar3Key} name={bar3Name} fill={bar3Color} barSize={20} radius={[2, 2, 0, 0]}>
          <LabelList dataKey={bar3Key} position="top" formatter={(v: any) => formatMillionWonChart(v)} fontSize={9} fill="#b45309" />
        </Bar>

        {/* 라인 1: 달성율 (lineCount >= 1 일 때만) */}
        {lineCount >= 1 && (
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="achievementRate"
            name="달성율"
            stroke={DASHBOARD_LINE_COLORS.achievement}
            strokeWidth={2}
            dot={{ r: 3, fill: DASHBOARD_LINE_COLORS.achievement }}
            connectNulls
          />
        )}

        {/* 라인 2: 성장율 (lineCount=2 일 때만) */}
        {lineCount === 2 && (
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="growthRate"
            name="성장율"
            stroke={DASHBOARD_LINE_COLORS.growth}
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 3, fill: DASHBOARD_LINE_COLORS.growth }}
            connectNulls
          />
        )}
      </ComposedChart>
    </ChartWrapper>
  );
}
