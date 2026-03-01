
import {
    ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell
} from 'recharts';
import { formatMillionWonChart, formatMillionWonTooltip } from '@/utils/formatUtils';
import { ChartWrapper } from '@/components/charts';

interface DualAxisChartProps {
    data: any[];
    xAxisKey: string;
    barKey: string;
    lineKey: string;
    barName: string;
    lineName: string;
    barColor?: string | string[] | readonly string[]; // Allow an array of colors
    lineColor?: string;
    title?: string;
    height?: number;
    onClick?: (data: any) => void;
    children?: React.ReactNode;
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
    onClick,
    children
}: DualAxisChartProps) {
    return (
        <ChartWrapper title={title} height={height}>
            <ResponsiveContainer width="100%" height="100%" minWidth={100}>
                <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 40 }} onClick={onClick}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                        dataKey={xAxisKey}
                        tick={false}
                        tickLine={false}
                    />
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
                            return formatMillionWonTooltip(value);
                        }}
                    />
                    <Bar
                        yAxisId="left"
                        dataKey={barKey}
                        name={barName}
                        fill={Array.isArray(barColor) || (barColor as readonly string[])?.length ? barColor[0] : (barColor as string)} // Default fill if colors not array
                        barSize={30}
                        radius={[4, 4, 0, 0]}
                    >
                        {
                            (Array.isArray(barColor) || (barColor as readonly string[])?.length) && data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={(barColor as readonly string[])[index % (barColor as readonly string[]).length]} />
                            ))
                        }
                        <LabelList dataKey={barKey} position="top" formatter={(val: any) => formatMillionWonChart(val)} fontSize={10} fill="#64748b" offset={10} />
                    </Bar>
                    <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey={lineKey}
                        name={lineName}
                        stroke={lineColor}
                        strokeWidth={3}
                        dot={{ r: 4 }}
                    />
                    {children}
                </ComposedChart>
            </ResponsiveContainer>
        </ChartWrapper>
    );
}
