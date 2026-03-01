import React from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, LabelList
} from 'recharts';
import { ChartWrapper } from '@/components/charts';
import { formatMillionWonChart, formatMillionWonTooltip } from '@/utils/formatUtils';

interface MonthlyTrendChartProps {
  data: Array<{ name: string; sales: number; profit: number; rate: number; previousSales?: number; previousProfit?: number }>;
  viewMode: 'sales' | 'profit';
  showYoY?: boolean;
}

function MonthlyTrendChart({ data, viewMode, showYoY = false }: MonthlyTrendChartProps) {
  const hasPreviousData = showYoY && data.some(d => (d.previousSales ?? 0) > 0 || (d.previousProfit ?? 0) > 0);

  return (
    <ChartWrapper title="월별 매출/매출이익 및 달성율 추이 (누적)" height={350}>
      <ComposedChart data={data} margin={{ top: 20, right: 30, left: 30, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis yAxisId="left" tickFormatter={formatMillionWonChart} tick={{ fontSize: 11 }} label={{ value: '(백만원)', position: 'top', offset: 10, fontSize: 11, fill: '#64748b' }} />
        <YAxis yAxisId="right" orientation="right" tickFormatter={(val) => `${val.toFixed(0)}%`} tick={{ fontSize: 11 }} domain={[0, 'auto']} label={{ value: '(%)', position: 'top', offset: 10, fontSize: 11, fill: '#64748b' }} />
        <RechartsTooltip formatter={(value: any, name: any) => {
          if (name === '달성율') return [`${Number(value).toFixed(1)}%`, viewMode === 'sales' ? '매출목표 달성율' : '매출이익 달성율'];
          if (name === '전년 매출액' || name === '전년 매출이익') return [formatMillionWonTooltip(value), name];
          return formatMillionWonTooltip(value);
        }} />
        <Legend />
        {hasPreviousData && (
          <Bar yAxisId="left" dataKey="previousSales" name="전년 매출액" fill="#cbd5e1" barSize={30} radius={[4, 4, 0, 0]} opacity={0.5}>
            <LabelList dataKey="previousSales" position="top" formatter={(val: any) => formatMillionWonChart(val)} fontSize={10} fill="#94a3b8" offset={5} />
          </Bar>
        )}
        <Bar yAxisId="left" dataKey="sales" name="매출액" fill="#3b82f6" barSize={30} radius={[4, 4, 0, 0]}>
          <LabelList dataKey="sales" position="top" formatter={(val: any) => formatMillionWonChart(val)} fontSize={10} fill="#64748b" offset={5} />
        </Bar>
        {hasPreviousData && (
          <Bar yAxisId="left" dataKey="previousProfit" name="전년 매출이익" fill="#a7f3d0" barSize={30} radius={[4, 4, 0, 0]} opacity={0.5}>
            <LabelList dataKey="previousProfit" position="top" formatter={(val: any) => formatMillionWonChart(val)} fontSize={10} fill="#94a3b8" offset={5} />
          </Bar>
        )}
        <Bar yAxisId="left" dataKey="profit" name="매출이익" fill="#10b981" barSize={30} radius={[4, 4, 0, 0]}>
          <LabelList dataKey="profit" position="top" formatter={(val: any) => formatMillionWonChart(val)} fontSize={10} fill="#64748b" offset={5} />
        </Bar>
        <Line yAxisId="right" type="monotone" dataKey="rate" name="달성율" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
      </ComposedChart>
    </ChartWrapper>
  );
}

export default React.memo(MonthlyTrendChart);
