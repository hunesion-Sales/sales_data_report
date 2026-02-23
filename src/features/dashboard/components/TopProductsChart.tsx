import React from 'react';
import {
  ComposedChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend,
} from 'recharts';
import { ChartWrapper } from '@/components/charts';
import { formatMillionWonChart, formatMillionWonTooltip } from '@/utils/formatUtils';
import type { ProcessedProduct } from '@/types';

interface TopProductsChartProps {
  data: ProcessedProduct[];
  onProductClick: (data: any) => void;
}

export default function TopProductsChart({ data, onProductClick }: TopProductsChartProps) {
  return (
    <ChartWrapper title="제품별 현황 (클릭 시 상세정보 확인)" height={350}>
      <ComposedChart data={data} margin={{ top: 20, right: 30, left: 30, bottom: 5 }} onClick={onProductClick}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="product" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={formatMillionWonChart} tick={{ fontSize: 11 }} label={{ value: '(백만원)', position: 'top', offset: 10, fontSize: 11, fill: '#64748b' }} />
        <RechartsTooltip formatter={(value: any) => formatMillionWonTooltip(value)} cursor={{ fill: 'transparent' }} />
        <Legend />
        <Bar dataKey="totalSales" name="매출액" fill="#3b82f6" barSize={20} radius={[4, 4, 0, 0]} />
        <Bar dataKey="totalProfit" name="매출이익" fill="#10b981" barSize={20} radius={[4, 4, 0, 0]} />
      </ComposedChart>
    </ChartWrapper>
  );
}
