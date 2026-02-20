
import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import type { DivisionSummary, PeriodInfo, TargetAchievement } from '@/types';
import { ChartWrapper } from '@/components/charts';
import { formatMillionWonChart, formatMillionWonTooltip } from '@/utils/formatUtils'; // Removed unused imports
import DualAxisChart from '@/components/charts/DualAxisChart';
import { Modal } from '@/components/ui/Modal';
import { getMonthShortLabel } from '@/types'; // Import from types or wherever it is defined
import { DIVISION_COLORS } from '@/constants/colors';

interface DivisionChartsProps {
  summaries: DivisionSummary[];
  periodInfoList: PeriodInfo[];
  viewMode: 'sales' | 'profit';
  achievements: TargetAchievement[]; // New prop
}

export default function DivisionCharts({
  summaries,
  periodInfoList, // Used for monthly keys if needed?
  viewMode,
  achievements,
}: DivisionChartsProps) {
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. Dual Axis Chart Data (Top N by selected metric)
  const chartData = useMemo(() => {
    // Map achievements to chart format
    // Filter out divisions with 0 targets/actuals if needed?
    return achievements
      .map(a => ({
        name: a.divisionName,
        amount: viewMode === 'sales' ? a.actualSales : a.actualProfit,
        rate: viewMode === 'sales' ? a.salesAchievementRate : (a.profitAchievementRate || 0),
        divisionId: a.target.divisionId // ID for fallback
      }))
      .sort((a, b) => b.amount - a.amount) // Sort by amount (Top N)
      ; // 전체 표시
  }, [achievements, viewMode]);

  // 2. Pie Chart Data (Improved)
  const pieData = useMemo(() => {
    return summaries
      .filter((s) => s.totalSales > 0)
      .map((s) => ({
        name: s.divisionName,
        value: viewMode === 'sales' ? s.totalSales : s.totalProfit,
      }))
      .sort((a, b) => b.value - a.value); // Sort for better pie slice ordering
  }, [summaries, viewMode]);

  // 3. Modal Trend Data
  const modalTrendData = useMemo(() => {
    if (!selectedDivision) return [];
    // Helper to get month keys. 
    // We can extract all unique month keys from the division's products.
    // periodInfoList might depend on filter, but summaries contain `products` with `months`.
    // Let's assume all products share the same month keys.
    const divisionSummary = summaries.find(s => s.divisionName === selectedDivision);
    if (!divisionSummary || divisionSummary.products.length === 0) return [];

    // Get all month keys from first product
    const firstProduct = divisionSummary.products[0];
    const monthKeys = Object.keys(firstProduct.months).sort();

    return monthKeys.map(mk => {
      let monthlySum = 0;
      divisionSummary.products.forEach(p => {
        const md = p.months[mk];
        if (md) {
          monthlySum += viewMode === 'sales' ? md.sales : md.profit;
        }
      });
      return {
        name: getMonthShortLabel(mk),
        value: monthlySum,
      };
    });
  }, [selectedDivision, summaries, viewMode]);

  const handleBarClick = (data: any) => {
    if (data && data.activeLabel) {
      setSelectedDivision(data.activeLabel);
      setIsModalOpen(true);
    }
  };

  if (summaries.length === 0) {
    return null;
  }

  const metricLabel = viewMode === 'sales' ? '매출액' : '매출이익';

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print-avoid-break">
        {/* 1. Dual Axis Chart: Division Performance (Top N) */}
        <div onClick={(e: any) => {
          // Recharts wrapper click hack if needed, or rely on activeLabel
        }}>
          <DualAxisChart
            title={`부문별 ${metricLabel} 및 달성율`}
            data={chartData}
            xAxisKey="name"
            barKey="amount"
            lineKey="rate"
            barName={metricLabel}
            lineName="달성율"
            barColor={viewMode === 'sales' ? '#3b82f6' : '#10b981'}
            lineColor="#f59e0b"
            height={350}
          />
          {/* Note: DualAxisChart inside doesn't expose onClick. I should have added it.
            For now, user can click label? 
            Wait, I need to open modal on click.
            I'll add onClick prop to DualAxisChart in a moment or wrap it.
            Recharts ComposedChart supports onClick.
            I'll update DualAxisChart to accept onClick prop?
            Or I can overwrite DualAxisChart.tsx quickly.
            I'll just wrap it here? No, ComposedChart needs the handler.
            I will update DualAxisChart.tsx to accept onClick.
         */}
        </div>

        {/* 2. Pie Chart: Market Share */}
        <ChartWrapper title={`부문별 ${metricLabel} 비중`} height={420}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="45%"
              innerRadius={55}
              outerRadius={95}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent, cx: cxVal, cy: cyVal, midAngle = 0, outerRadius: oR }) => {
                if ((percent ?? 0) < 0.03) return null;
                const RADIAN = Math.PI / 180;
                const radius = (oR as number) + 25;
                const x = (cxVal as number) + radius * Math.cos(-midAngle * RADIAN);
                const y = (cyVal as number) + radius * Math.sin(-midAngle * RADIAN);
                return (
                  <text
                    x={x}
                    y={y}
                    fill="#374151"
                    textAnchor={x > (cxVal as number) ? 'start' : 'end'}
                    dominantBaseline="central"
                    fontSize={12}
                    fontWeight={500}
                  >
                    {`${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  </text>
                );
              }}
              labelLine={({ percent, points }) => {
                if ((percent ?? 0) < 0.03) return <></>;
                if (!points || points.length < 2) return <></>;
                return (
                  <path
                    d={`M${points[0].x},${points[0].y}L${points[1].x},${points[1].y}`}
                    stroke="#94a3b8"
                    strokeWidth={1}
                    fill="none"
                  />
                );
              }}
            >
              {pieData.map((_, idx) => (
                <Cell key={`cell-${idx}`} fill={DIVISION_COLORS[idx % DIVISION_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any, name: any) => [formatMillionWonTooltip(Number(value)), name]}
              contentStyle={{ fontSize: 12 }}
            />
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              content={() => {
                const total = pieData.reduce((sum, d) => sum + d.value, 0);
                return (
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px 16px', fontSize: 11, paddingTop: 8 }}>
                    {pieData.map((d, idx) => {
                      const pct = total > 0 ? ((d.value / total) * 100).toFixed(0) : '0';
                      return (
                        <span key={d.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 10, height: 10, backgroundColor: DIVISION_COLORS[idx % DIVISION_COLORS.length], display: 'inline-block', borderRadius: 2 }} />
                          {d.name} ({pct}%)
                        </span>
                      );
                    })}
                  </div>
                );
              }}
            />
          </PieChart>
        </ChartWrapper>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`${selectedDivision || '부문'} 월별 ${metricLabel} 추이`}
        size="2xl"
      >
        <div style={{ height: 300 }}>
          <ChartWrapper height={300}>
            <BarChart data={modalTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={formatMillionWonChart} width={45} />
              <Tooltip formatter={(value: any) => formatMillionWonTooltip(value)} />
              <Bar
                dataKey="value"
                name={metricLabel}
                fill={viewMode === 'sales' ? '#3b82f6' : '#10b981'}
                radius={[4, 4, 0, 0]}
                barSize={40}
              />
            </BarChart>
          </ChartWrapper>
        </div>
      </Modal>
    </>
  );
}
