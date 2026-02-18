import { useMemo } from 'react';
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
import type { ProcessedProduct } from '@/types';
import { ChartWrapper } from '@/components/charts';
import { formatMillionWon, formatCurrency } from '@/utils/formatUtils';
interface ProductChartsProps {
    items: ProcessedProduct[];
    months: string[];
    viewMode: 'sales' | 'profit';
}

const COLORS = [
    '#6366f1', // indigo
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#06b6d4', // cyan
    '#f97316', // orange
    '#ec4899', // pink
    '#84cc16', // lime
    '#14b8a6', // teal
    '#3b82f6', // blue
    '#f43f5e', // rose
];

export default function ProductCharts({ items, months, viewMode }: ProductChartsProps) {
    // 필터링: Cloud 소계 제외 (개별 Cloud 항목들이 있으므로)
    const validItems = useMemo(() => {
        return items.filter(item => item.id !== 'cloud_total');
    }, [items]);

    // 1. Stacked Bar Chart용 데이터: 월별 제품 매출/이익 스택
    const stackedBarData = useMemo(() => {
        return months.map(month => {
            const entry: Record<string, string | number> = { name: month };
            validItems.forEach(item => {
                const md = item.months[month];
                if (md) {
                    entry[item.product] = viewMode === 'sales' ? md.sales : md.profit;
                }
            });
            return entry;
        });
    }, [months, validItems, viewMode]);

    // 2. Pie Chart용 데이터: 제품별 총 매출/이익 비율
    const pieData = useMemo(() => {
        return validItems
            .map(item => ({
                name: item.product,
                value: viewMode === 'sales' ? item.totalSales : item.totalProfit,
            }))
            .filter(item => item.value > 0)
            .sort((a, b) => b.value - a.value);
    }, [validItems, viewMode]);

    // 3. Ranking Bar Chart용 데이터: 제품별 순위
    const rankingData = useMemo(() => {
        return validItems
            .map(item => ({
                name: item.product,
                value: viewMode === 'sales' ? item.totalSales : item.totalProfit,
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 15); // 상위 15개만 표시 (제품이 많을 수 있으므로)
    }, [validItems, viewMode]);

    if (validItems.length === 0) {
        return null;
    }

    // 색상 할당 로직 (항목이 많으므로 순환)
    const getItemColor = (index: number) => COLORS[index % COLORS.length];
    const metricLabel = viewMode === 'sales' ? '매출액' : '매출이익';

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print-avoid-break">
            {/* 1. Stacked Bar Chart: 기간별 제품 추이 (Full Width) */}
            <ChartWrapper title={`기간별 제품 ${metricLabel} 추이 (단위: 백만원)`} height={350} className="lg:col-span-2">
                <BarChart data={stackedBarData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={formatMillionWon} tick={{ fontSize: 11 }} />
                    <Tooltip
                        formatter={(value) => formatCurrency(Number(value))}
                        labelStyle={{ fontWeight: 'bold' }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {validItems.map((item, idx) => (
                        <Bar
                            key={item.id}
                            dataKey={item.product}
                            stackId="a"
                            fill={getItemColor(idx)}
                        />
                    ))}
                </BarChart>
            </ChartWrapper>

            {/* 2. Pie Chart: 제품별 비율 */}
            <ChartWrapper title={`제품별 ${metricLabel} 점유율 (단위: 백만원)`} height={350}>
                <PieChart>
                    <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        labelLine={{ strokeWidth: 1 }}
                    >
                        {pieData.map((_, idx) => (
                            <Cell key={`cell-${idx}`} fill={getItemColor(idx)} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
            </ChartWrapper>

            {/* 3. Ranking Bar Chart: 제품별 순위 */}
            <ChartWrapper title={`제품별 ${metricLabel} 순위 (상위 15개, 단위: 백만원)`} height={350}>
                <BarChart
                    data={rankingData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tickFormatter={formatMillionWon} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={120} />
                    <Tooltip
                        formatter={(value) => formatCurrency(Number(value))}
                        cursor={{ fill: 'transparent' }}
                    />
                    <Bar
                        dataKey="value"
                        name={metricLabel}
                        fill={viewMode === 'sales' ? '#6366f1' : '#10b981'}
                        radius={[0, 4, 4, 0]}
                        barSize={20}
                    />
                </BarChart>
            </ChartWrapper>
        </div>
    );
}
