import React, { useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    LabelList,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import type { ProcessedProduct } from '@/types';
import { ChartWrapper } from '@/components/charts';
import { formatMillionWon, formatCurrency, formatMillionWonChart, formatMillionWonTooltip } from '@/utils/formatUtils';
import { CHART_COLORS } from '@/constants/colors';
interface ProductChartsProps {
    items: ProcessedProduct[];
    months: string[];
    viewMode: 'sales' | 'profit';
}

function ProductCharts({ items, months, viewMode }: ProductChartsProps) {
    // 필터링 제거: props로 전달된 items를 그대로 사용
    const validItems = items;

    // 1. Stacked Bar Chart용 데이터: 월별 제품 매출/이익 스택 (순서: 위쪽부터 큰 금액)
    // Recharts는 첫 번째 항목을 가장 아래에 렌더링하므로, 오름차순으로 정렬된 키를 반환해야 큰 값이 위에 위치합니다.
    const stackedBarData = useMemo(() => {
        return months.map(month => {
            const entry: Record<string, string | number> = { name: month };

            // 해당 월에 실적이 있는 제품들을 추출하고 값에 따라 오름차순 정렬 (렌더링 시 위로 올라감)
            const monthProducts = validItems
                .map(item => {
                    const md = item.months[month];
                    return {
                        product: item.product,
                        value: md ? (viewMode === 'sales' ? md.sales : md.profit) : 0
                    };
                })
                .filter(p => p.value > 0)
                .sort((a, b) => a.value - b.value);

            // 정렬된 순서대로 객체에 할당. (객체의 키 순서를 보장하기 위해 이렇게 함)
            monthProducts.forEach(p => {
                entry[p.product] = p.value;
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
    const getItemColor = (index: number) => CHART_COLORS[index % CHART_COLORS.length];
    const metricLabel = viewMode === 'sales' ? '매출액' : '매출이익';

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print-avoid-break">
            {/* 1. Stacked Bar Chart: 기간별 제품 추이 (Full Width) */}
            <ChartWrapper title={`기간별 제품 ${metricLabel} 추이 (단위: 백만원)`} height={350} className="lg:col-span-2">
                <BarChart data={stackedBarData} margin={{ top: 30, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis
                        tickFormatter={formatMillionWonChart}
                        tick={{ fontSize: 11 }}
                        label={{ value: '(백만원)', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#64748b' } }}
                    />
                    <Tooltip
                        content={({ active, payload, label }) => {
                            if (!active || !payload || payload.length === 0) return null;
                            // 툴팁에서는 위에서 아래로 보기 편하도록 내림차순 정렬
                            const sortedPayload = [...payload].sort((a, b) => Number(b.value) - Number(a.value));
                            const total = sortedPayload.reduce((sum, entry) => sum + Number(entry.value || 0), 0);
                            return (
                                <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm">
                                    <p className="font-bold text-slate-800 mb-2">{label}</p>
                                    {sortedPayload.map(entry => (
                                        <p key={entry.name} style={{ color: entry.color }} className="py-0.5">
                                            {entry.name}: {formatMillionWonTooltip(Number(entry.value))}
                                        </p>
                                    ))}
                                    <hr className="my-1.5 border-slate-200" />
                                    <p className="font-bold text-slate-800">
                                        총계: {formatMillionWonTooltip(total)}
                                    </p>
                                </div>
                            );
                        }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {validItems.map((item, idx) => (
                        <Bar
                            key={item.id}
                            dataKey={item.product}
                            stackId="a"
                            fill={getItemColor(idx)}
                        >
                            {idx === validItems.length - 1 && (
                                <LabelList
                                    content={({ x, y, width, index }: any) => {
                                        if (index === undefined || index === null) return null;
                                        const total = validItems.reduce((sum, p) => {
                                            return sum + (Number(stackedBarData[index]?.[p.product]) || 0);
                                        }, 0);
                                        if (total === 0) return null;
                                        const label = formatMillionWonChart(total);
                                        return (
                                            <text
                                                x={(x as number) + (width as number) / 2}
                                                y={(y as number) - 8}
                                                textAnchor="middle"
                                                fontSize={11}
                                                fill="#374151"
                                                fontWeight={600}
                                            >
                                                {label}
                                            </text>
                                        );
                                    }}
                                />
                            )}
                        </Bar>
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
                    >
                        <LabelList dataKey="value" position="right" formatter={(val: any) => formatMillionWonChart(val)} fontSize={10} fill="#64748b" />
                    </Bar>
                </BarChart>
            </ChartWrapper>
        </div>
    );
}

export default React.memo(ProductCharts);
