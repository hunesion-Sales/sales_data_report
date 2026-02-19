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
import { formatMillionWon, formatCurrency, formatMillionWonChart, formatMillionWonTooltip } from '@/utils/formatUtils';
interface ProductChartsProps {
    items: ProcessedProduct[];
    months: string[];
    viewMode: 'sales' | 'profit';
}

const COLORS = [
    '#3b82f6', // blue-500 (Primary)
    '#6366f1', // indigo-500 (Secondary)
    '#10b981', // emerald-500 (Success/Profit)
    '#f59e0b', // amber-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#06b6d4', // cyan-500
    '#1d4ed8', // blue-700
    '#4338ca', // indigo-700
    '#059669', // emerald-600
    '#d97706', // amber-600
    '#7c3aed', // violet-600
];

export default function ProductCharts({ items, months, viewMode }: ProductChartsProps) {
    // 필터링 제거: props로 전달된 items를 그대로 사용
    const validItems = items;

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
            ; // 전체 표시
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
                    <YAxis tickFormatter={formatMillionWonChart} tick={{ fontSize: 11 }} />
                    <Tooltip
                        formatter={(value) => formatMillionWonTooltip(Number(value))}
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
            <ChartWrapper title={`제품별 ${metricLabel} 점유율 (단위: 백만원)`} height={420}>
                <PieChart>
                    <Pie
                        data={pieData}
                        cx="50%"
                        cy="45%"
                        innerRadius={55}
                        outerRadius={95}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent, cx, cy, midAngle = 0, outerRadius: oR }) => {
                            if ((percent ?? 0) < 0.03) return null; // 3% 미만은 라벨 숨김
                            const RADIAN = Math.PI / 180;
                            const radius = (oR as number) + 25;
                            const x = (cx as number) + radius * Math.cos(-midAngle * RADIAN);
                            const y = (cy as number) + radius * Math.sin(-midAngle * RADIAN);
                            return (
                                <text
                                    x={x}
                                    y={y}
                                    fill="#374151"
                                    textAnchor={x > (cx as number) ? 'start' : 'end'}
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
                            <Cell key={`cell-${idx}`} fill={getItemColor(idx)} />
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
                                                <span style={{ width: 10, height: 10, backgroundColor: getItemColor(idx), display: 'inline-block', borderRadius: 2 }} />
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

            {/* 3. Ranking Bar Chart: 제품별 순위 */}
            <ChartWrapper title={`제품별 ${metricLabel} 순위 (단위: 백만원)`} height={350}>
                <BarChart
                    data={rankingData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tickFormatter={formatMillionWonChart} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={120} />
                    <Tooltip
                        formatter={(value) => formatMillionWonTooltip(Number(value))}
                        cursor={{ fill: 'transparent' }}
                    />
                    <Bar
                        dataKey="value"
                        name={metricLabel}
                        fill={viewMode === 'sales' ? '#2563eb' : '#06b6d4'}
                        radius={[0, 4, 4, 0]}
                        barSize={20}
                    />
                </BarChart>
            </ChartWrapper>
        </div>
    );
}
