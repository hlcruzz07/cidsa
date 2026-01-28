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

const widgetConfig = {
    totalUpdates: {
        title: 'Total Student Updates',
        description: 'Number of student records updated',
        color: {
            text: 'text-emerald-500',
            bg: 'bg-emerald-500',
        },
    },
    readyStudents: {
        title: 'Ready For Export',
        description: 'Number of students ready for export',
        color: {
            text: 'text-purple-500',
            bg: 'bg-purple-500',
        },
    },
    incompleteStudents: {
        title: 'Incomplete Students',
        description: 'Number of students with incomplete records',
        color: {
            text: 'text-red-500',
            bg: 'bg-red-500',
        },
    },
    exportedStudents: {
        title: 'Exported Students',
        description: 'Number of students exported from the system',
        color: {
            text: 'text-blue-500',
            bg: 'bg-blue-500',
        },
    },
} as const;

export default function Widget({ count, type }: WidgetProps) {
    const config = widgetConfig[type];

    return (
        <Card className="relative w-full overflow-hidden rounded-xl bg-background">
            {/* Top accent bar */}
            <div
                className={`absolute inset-x-0 top-0 h-1 ${config.color.bg}`}
            />

            <CardHeader className="space-y-1 pb-2">
                <div className="flex items-center gap-2">
                    <CheckCircle2 className={`h-5 w-5 ${config.color.text}`} />
                    <CardTitle className="text-lg font-semibold tracking-wide text-muted-foreground">
                        {config.title}
                    </CardTitle>
                </div>
                <CardDescription className="text-sm">
                    {config.description}
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-2">
                <div
                    className={`tabular-lining-nums flex items-center gap-5 text-4xl font-extrabold ${config.color.text}`}
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
