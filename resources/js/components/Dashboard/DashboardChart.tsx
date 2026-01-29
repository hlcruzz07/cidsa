'use client';

import * as React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from '@/components/ui/chart';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import apiService from '@/services/apiService';
import dayjs from 'dayjs';
import { Skeleton } from '../ui/skeleton';

const chartConfig = {
    tal: {
        label: 'Talisay',
        color: 'hsl(var(--emerald-500))',
    },
    ali: {
        label: 'Alijis',
        color: 'hsl(var(--purple-500))',
    },
    ft: {
        label: 'Fortune Town',
        color: 'hsl(var(--blue-500))',
    },
    bin: {
        label: 'Binalbagan',
        color: 'hsl(var(--red-500))',
    },
} satisfies ChartConfig;
type ChartRow = {
    date: string;
    tal: number;
    ali: number;
    bin: number;
    ft: number;
};
export function DashboardChart() {
    const [timeRange, setTimeRange] = React.useState('90d');
    const [chartData, setChartData] = React.useState<ChartRow[]>([]);
    const [loading, setLoading] = React.useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await apiService.get<ChartRow[]>(
                '/api/dashboard-chart',
                {
                    params: { timeRange },
                },
            );

            setChartData(
                response.data.sort(
                    (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
                ),
            );
        } catch (error) {
            console.error('Failed to fetch chart data:', error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchData();
    }, [timeRange]);
    return (
        <Card className="pt-0">
            <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
                <div className="grid flex-1 gap-1">
                    <CardTitle>Student Update Activity</CardTitle>
                    <CardDescription>
                        Showing student information updates per campus for the
                        selected period
                    </CardDescription>
                </div>
                <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger
                        className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
                        aria-label="Select a value"
                    >
                        <SelectValue placeholder="Last 3 months" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                        <SelectItem value="90d" className="rounded-lg">
                            Last 3 months
                        </SelectItem>
                        <SelectItem value="30d" className="rounded-lg">
                            Last 30 days
                        </SelectItem>
                        <SelectItem value="7d" className="rounded-lg">
                            Last 7 days
                        </SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                {loading ? (
                    <Skeleton className="h-96 w-full" />
                ) : chartData.length === 0 ? (
                    <p className="flex h-96 items-center justify-center rounded-md border border-dashed text-lg font-medium text-muted-foreground italic">
                        No data available.
                    </p>
                ) : (
                    <>
                        <ChartContainer
                            config={chartConfig}
                            className="aspect-auto h-[250px] w-full"
                        >
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient
                                        id="fillTal"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="5%"
                                            stopColor="#10b981"
                                            stopOpacity={0.8}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="#10b981"
                                            stopOpacity={0.1}
                                        />
                                    </linearGradient>

                                    <linearGradient
                                        id="fillAli"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="5%"
                                            stopColor="#a855f7"
                                            stopOpacity={0.8}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="#a855f7"
                                            stopOpacity={0.1}
                                        />
                                    </linearGradient>

                                    <linearGradient
                                        id="fillFt"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="5%"
                                            stopColor="#3b82f6"
                                            stopOpacity={0.8}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="#3b82f6"
                                            stopOpacity={0.1}
                                        />
                                    </linearGradient>

                                    <linearGradient
                                        id="fillBin"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="5%"
                                            stopColor="#ef4444"
                                            stopOpacity={0.8}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="#ef4444"
                                            stopOpacity={0.1}
                                        />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    minTickGap={32}
                                    tickFormatter={(value) => {
                                        const date = new Date(value);
                                        return date.toLocaleDateString(
                                            'en-US',
                                            {
                                                month: 'short',
                                                day: 'numeric',
                                            },
                                        );
                                    }}
                                />
                                <ChartTooltip
                                    cursor={false}
                                    content={
                                        <ChartTooltipContent
                                            labelFormatter={(value) => {
                                                return new Date(
                                                    value,
                                                ).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                });
                                            }}
                                            indicator="dot"
                                        />
                                    }
                                />
                                <Area
                                    dataKey="tal"
                                    type="natural"
                                    fill="url(#fillTal)"
                                    stroke="#10b981"
                                    stackId="a"
                                />

                                <Area
                                    dataKey="ali"
                                    type="natural"
                                    fill="url(#fillAli)"
                                    stroke="#a855f7"
                                    stackId="a"
                                />

                                <Area
                                    dataKey="ft"
                                    type="natural"
                                    fill="url(#fillFt)"
                                    stroke="#3b82f6"
                                    stackId="a"
                                />

                                <Area
                                    dataKey="bin"
                                    type="natural"
                                    fill="url(#fillBin)"
                                    stroke="#ef4444"
                                    stackId="a"
                                />

                                <ChartLegend content={<ChartLegendContent />} />
                            </AreaChart>
                        </ChartContainer>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
