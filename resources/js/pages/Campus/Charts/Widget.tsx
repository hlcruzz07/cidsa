import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import dayjs from 'dayjs';
import { CheckCircle2, TrendingUp } from 'lucide-react';

type WidgetProps = {
    count: number;
    type:
        | 'totalUpdates'
        | 'readyStudents'
        | 'incompleteStudents'
        | 'exportedStudents';
};

export default function Widget({ count, type }: WidgetProps) {
    const widgetType = {
        totalUpdates: {
            title: 'Total Student Updates',
            description: 'Number of student records updated',
            count: count,
            color: 'emerald',
        },
        readyStudents: {
            title: 'Ready For Export',
            description: 'Number of students ready for export',
            count: count,
            color: 'purple',
        },
        incompleteStudents: {
            title: 'Incomplete Students',
            description: 'Number of students with incomplete records',
            count: count,
            color: 'red',
        },
        exportedStudents: {
            title: 'Exported Students',
            description: 'Number of students exported from the system',
            count: count,
            color: 'blue',
        },
    };
    return (
        <Card className="relative w-full overflow-hidden rounded-xl bg-background">
            <div
                className={`absolute inset-x-0 top-0 h-1 bg-${widgetType[type].color}-500`}
            />
            <CardHeader className="space-y-1 pb-2">
                <div className="flex items-center gap-2">
                    <CheckCircle2
                        className={`h-5 w-5 text-${widgetType[type].color}-500`}
                    />
                    <CardTitle className="text-lg font-semibold tracking-wide text-muted-foreground">
                        {widgetType[type].title}
                    </CardTitle>
                </div>
                <CardDescription className="text-sm">
                    {widgetType[type].description}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                <div
                    className={`tabular-lining-nums text-${widgetType[type].color}-500 flex items-center gap-5 text-4xl font-extrabold`}
                >
                    {count.toLocaleString()}
                    <TrendingUp size={55} />
                </div>
                <p className="text-xs text-muted-foreground">
                    As of {dayjs().format('MMM D, YYYY')}
                </p>
            </CardContent>
        </Card>
    );
}
