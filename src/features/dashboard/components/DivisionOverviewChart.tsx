import React from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend,
} from 'recharts';
import { ChartWrapper } from '@/components/charts';
import { formatMillionWonChart, formatMillionWonTooltip } from '@/utils/formatUtils';

interface DivisionChartItem {
  name: string;
  sales: number;
  profit: number;
  rate: number;
  divisionId: string;
}

interface DivisionOverviewChartProps {
  data: DivisionChartItem[];
  viewMode: 'sales' | 'profit';
  onDivisionClick: (data: any) => void;
}

export default function DivisionOverviewChart({ data, viewMode, onDivisionClick }: DivisionOverviewChartProps) {
  return (
    <ChartWrapper title="부문별 매출/매출이익 및 달성율" height={350}>
      <ComposedChart data={data} margin={{ top: 20, right: 30, left: 30, bottom: 5 }} onClick={onDivisionClick}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis yAxisId="left" tickFormatter={formatMillionWonChart} tick={{ fontSize: 11 }} label={{ value: '(백만원)', position: 'top', offset: 10, fontSize: 11, fill: '#64748b' }} />
        <YAxis yAxisId="right" orientation="right" tickFormatter={(val) => `${val.toFixed(0)}%`} tick={{ fontSize: 11 }} domain={[0, 'auto']} label={{ value: '(%)', position: 'top', offset: 10, fontSize: 11, fill: '#64748b' }} />
        <RechartsTooltip formatter={(value: any, name: any) => {
          if (name === '달성율') return [`${Number(value).toFixed(1)}%`, viewMode === 'sales' ? '매출목표 달성율' : '매출이익 달성율'];
          return formatMillionWonTooltip(value);
        }} />
        <Legend />
        <Bar yAxisId="left" dataKey="sales" name="매출액" fill="#6366f1" barSize={30} radius={[4, 4, 0, 0]} />
        <Bar yAxisId="left" dataKey="profit" name="매출이익" fill="#059669" barSize={30} radius={[4, 4, 0, 0]} />
        <Line yAxisId="right" type="monotone" dataKey="rate" name="달성율" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4 }} />
      </ComposedChart>
    </ChartWrapper>
  );
}
