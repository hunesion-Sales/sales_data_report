import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, LabelList
} from 'recharts';
import { ChartWrapper } from '@/components/charts';
import { Modal } from '@/components/ui/Modal';
import { formatMillionWonChart, formatMillionWonTooltip } from '@/utils/formatUtils';
import { getMonthShortLabel } from '@/types';
import type { ProcessedProduct } from '@/types';

interface DivisionChartItem {
  name: string;
  sales: number;
  profit: number;
  rate: number;
  divisionId: string;
}

interface DivisionDataItem {
  divisionId: string;
  divisionName: string;
  months: Record<string, { sales?: number; cost?: number }>;
}

interface DashboardDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalType: 'product' | 'division';
  selectedProduct: string | null;
  selectedDivision: string | null;
  viewMode: 'sales' | 'profit';
  months: string[];
  processedData: ProcessedProduct[];
  divisionChartData: DivisionChartItem[];
  divisionItems: DivisionDataItem[];
}

export default function DashboardDetailModal({
  isOpen,
  onClose,
  modalType,
  selectedProduct,
  selectedDivision,
  viewMode,
  months,
  processedData,
  divisionChartData,
  divisionItems,
}: DashboardDetailModalProps) {
  const getModalChartData = () => {
    if (modalType === 'product' && selectedProduct) {
      const item = processedData.find(p => p.product === selectedProduct);
      if (!item) return [];

      return months.map(mk => ({
        name: getMonthShortLabel(mk),
        value: viewMode === 'sales' ? item.months[mk].sales : item.months[mk].profit
      }));
    } else if (modalType === 'division' && selectedDivision) {
      const targetDiv = divisionChartData.find(d => d.divisionId === selectedDivision || d.name === selectedDivision);
      if (!targetDiv) return [];

      const divItem = divisionItems.find(item => {
        if (item.divisionId === selectedDivision) return true;
        const normalizedItemName = item.divisionName.replace(/\s+/g, '');
        const normalizedTargetName = targetDiv.name.replace(/\s+/g, '');
        return normalizedItemName === normalizedTargetName;
      });

      if (!divItem) return [];

      return months.map(mk => {
        const md = divItem.months[mk];
        const sales = md ? (md.sales || 0) : 0;
        const cost = md ? (md.cost || 0) : 0;
        const profit = sales - cost;
        return {
          name: getMonthShortLabel(mk),
          value: viewMode === 'sales' ? sales : profit
        };
      });
    }
    return [];
  };

  const title = `${modalType === 'product' ? (selectedProduct || '제품') : (divisionChartData.find(d => d.divisionId === selectedDivision)?.name || selectedDivision || '부문')} 월별 ${viewMode === 'sales' ? '매출' : '매출이익'} 추이`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="2xl"
    >
      <div style={{ height: 300 }}>
        <ChartWrapper height={300}>
          <BarChart data={getModalChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={formatMillionWonChart} width={60} label={{ value: '(백만원)', position: 'top', offset: 10, fontSize: 11, fill: '#64748b' }} />
            <RechartsTooltip formatter={(value: any) => formatMillionWonTooltip(value)} />
            <Bar
              dataKey="value"
              name={viewMode === 'sales' ? '매출액' : '매출이익'}
              fill={viewMode === 'sales' ? '#3b82f6' : '#10b981'}
              radius={[4, 4, 0, 0]}
              barSize={40}
            >
              <LabelList dataKey="value" position="top" formatter={(val: any) => formatMillionWonChart(val)} fontSize={10} fill="#64748b" />
            </Bar>
          </BarChart>
        </ChartWrapper>
      </div>
    </Modal>
  );
}
