
import {
    ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { formatMillionWonChart } from '@/utils/formatUtils';
import { ChartWrapper } from '@/components/charts';

interface DualAxisChartProps {
    data: any[];
    xAxisKey: string;
    barKey: string;
    lineKey: string;
    barName: string;
    lineName: string;
    barColor?: string;
    lineColor?: string;
    title?: string;
    height?: number;
    onClick?: (data: any) => void;
}

export default function DualAxisChart({
    data,
    xAxisKey,
    barKey,
    lineKey,
    barName,
    lineName,
    barColor = '#6366f1',
    lineColor = '#f59e0b',
    title,
    height = 320,
    onClick
}: DualAxisChartProps) {
    return (
        <ChartWrapper title={title} height={height}>
            <ResponsiveContainer width="100%" height="100%" minWidth={100}>
                <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} onClick={onClick}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey={xAxisKey} scale="point" padding={{ left: 30, right: 30 }} tick={{ fontSize: 12 }} />
                    <YAxis
                        yAxisId="left"
                        tickFormatter={formatMillionWonChart}
                        tick={{ fontSize: 11 }}
                    />
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        tickFormatter={(value) => `${value.toFixed(0)}%`}
                        tick={{ fontSize: 11 }}
                        domain={[0, 'auto']}
                    />
                    <Tooltip
                        formatter={(value: any, name: any) => {
                            if (typeof value !== 'number') return value;
                            if (name === lineName) return `${value.toFixed(1)}%`;
                            return formatMillionWonChart(value);
                        }}
                    />
                    <Legend />
                    <Bar
                        yAxisId="left"
                        dataKey={barKey}
                        name={barName}
                        fill={barColor}
                        barSize={30}
                        radius={[4, 4, 0, 0]}
                    />
                    <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey={lineKey}
                        name={lineName}
                        stroke={lineColor}
                        strokeWidth={3}
                        dot={{ r: 4 }}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </ChartWrapper>
    );
}
