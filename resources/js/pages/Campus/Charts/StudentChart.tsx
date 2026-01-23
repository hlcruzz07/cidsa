'use client';

import * as React from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import Heading from '@/components/heading';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import apiService from '@/services/apiService';
import dayjs from 'dayjs';

type StudentUpdateData = {
    date: string;
    college: string;
    total: number;
};

type ChartRow = {
    date: string;
    [college: string]: number | string;
};

export function StudentsUpdateChart({ campus }: { campus: string }) {
    const [timeRange, setTimeRange] = React.useState('today');
    const [chartData, setChartData] = React.useState<ChartRow[]>([]);
    const [colleges, setColleges] = React.useState<string[]>([]);
    const [loading, setLoading] = React.useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await apiService.get('/api/student-chart', {
                params: { campus, timeRange },
            });

            const data: StudentUpdateData[] = response.data;

            // ✅ unique colleges
            const uniqueColleges = Array.from(
                new Set(data.map((d) => d.college)),
            );
            setColleges(uniqueColleges);

            // ✅ pivot data by date
            const grouped: Record<string, ChartRow> = {};

            data.forEach((d) => {
                const date = dayjs(d.date).format('YYYY-MM-DD');

                if (!grouped[date]) {
                    grouped[date] = { date };
                }

                grouped[date][d.college] = d.total;
            });

            const chartArray = Object.values(grouped).sort(
                (a, b) =>
                    dayjs(a.date as string).unix() -
                    dayjs(b.date as string).unix(),
            );

            setChartData(chartArray);
        } catch (error) {
            console.error('Failed to fetch chart data:', error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchData();
    }, [campus, timeRange]);

    // 🎨 consistent color mapping
    const collegeColors: Record<string, string> = {
        CAS: '#10b981',
        CBMA: '#ec4899',
        CCS: '#6b7280',
        COED: '#3b82f6',
        COE: '#f97316',
        CIT: '#ef4444',
        CCJ: '#8b5cf6',
        COF: '#0ea5e9',
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <Heading
                            title="Students Updated by College"
                            description={`Showing student updates for the last ${timeRange}`}
                        />
                    </div>

                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="7d">Last 7 days</SelectItem>
                            <SelectItem value="30d">Last 30 days</SelectItem>
                            <SelectItem value="90d">Last 3 months</SelectItem>
                            <SelectItem value="180d">Last 6 months</SelectItem>
                            <SelectItem value="365d">Last 12 months</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>

            <CardContent className="text-sm">
                {loading ? (
                    <Skeleton className="h-96 w-full" />
                ) : chartData.length === 0 ? (
                    <p className="flex h-96 items-center justify-center rounded-md border border-dashed text-lg font-medium text-muted-foreground italic">
                        No data available for the selected range.
                    </p>
                ) : (
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={chartData} barGap={6}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                            />

                            <XAxis
                                dataKey="date"
                                tickFormatter={(value) =>
                                    dayjs(value).format('MMM D')
                                }
                                minTickGap={20}
                            />

                            <YAxis allowDecimals={false} />

                            <Tooltip
                                labelFormatter={(label) =>
                                    dayjs(label).format('MMM D, YYYY')
                                }
                            />

                            <Legend />

                            {colleges.map((college) => (
                                <Bar
                                    key={college}
                                    dataKey={college}
                                    fill={collegeColors[college] ?? '#64748b'}
                                    radius={[4, 4, 0, 0]}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}
