import React from 'react';
import {
  ComposedChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, LabelList
} from 'recharts';
import { ChartWrapper } from '@/components/charts';
import { formatMillionWonChart, formatMillionWonTooltip } from '@/utils/formatUtils';
import type { ProcessedProduct } from '@/types';

interface TopProductsChartProps {
  data: ProcessedProduct[];
  onProductClick: (data: any) => void;
}

function TopProductsChart({ data, onProductClick }: TopProductsChartProps) {
  return (
    <ChartWrapper title="제품별 현황 (클릭 시 상세정보 확인)" height={350}>
      <ComposedChart data={data} margin={{ top: 20, right: 30, left: 30, bottom: 5 }} onClick={onProductClick}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="product" tick={{ fontSize: 12 }} interval={0} />
        <YAxis tickFormatter={formatMillionWonChart} tick={{ fontSize: 11 }} label={{ value: '(백만원)', position: 'top', offset: 10, fontSize: 11, fill: '#64748b' }} />
        <RechartsTooltip formatter={(value: any) => formatMillionWonTooltip(value)} cursor={{ fill: 'transparent' }} />
        <Legend wrapperStyle={{ fontSize: 13 }} iconType="rect" iconSize={12} />
        <Bar dataKey="totalSales" name="매출액" fill="#3b82f6" barSize={20} radius={[4, 4, 0, 0]}>
          <LabelList dataKey="totalSales" position="top" formatter={(val: any) => formatMillionWonChart(val)} fontSize={10} fill="#64748b" />
        </Bar>
        <Bar dataKey="totalProfit" name="매출이익" fill="#10b981" barSize={20} radius={[4, 4, 0, 0]}>
          <LabelList dataKey="totalProfit" position="top" formatter={(val: any) => formatMillionWonChart(val)} fontSize={10} fill="#64748b" />
        </Bar>
      </ComposedChart>
    </ChartWrapper>
  );
}

export default React.memo(TopProductsChart);
