import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import dayjs from 'dayjs';
import { GraduationCap } from 'lucide-react';

type WidgetProps = {
    count: number;
    type: 'tal' | 'ali' | 'bin' | 'ft';
};

const widgetConfig = {
    tal: {
        title: 'Talisay Students',
        description: 'Number of students of Talisay campus',
        color: {
            text: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            solid: 'bg-emerald-500',
        },
    },
    ali: {
        title: 'Alijis Students',
        description: 'Number of students of Alijis campus',
        color: {
            text: 'text-purple-500',
            bg: 'bg-purple-500/10',
            solid: 'bg-purple-500',
        },
    },
    bin: {
        title: 'Binalbagan Students',
        description: 'Number of students of Binalbagan campus',
        color: {
            text: 'text-red-500',
            bg: 'bg-red-500/10',
            solid: 'bg-red-500',
        },
    },
    ft: {
        title: 'Fortune Town Students',
        description: 'Number of students of Fortune Town campus',
        color: {
            text: 'text-blue-500',
            bg: 'bg-blue-500/10',
            solid: 'bg-blue-500',
        },
    },
} as const;

export default function DashboardWidget({ count, type }: WidgetProps) {
    const config = widgetConfig[type];

    return (
        <Card className="relative overflow-hidden rounded-2xl border bg-background">
            {/* subtle glow */}
            <div
                className={`pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full blur-3xl ${config.color.bg}`}
            />

            <CardHeader className="flex flex-row items-center gap-4 pb-4">
                {/* icon badge */}
                <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${config.color.solid}`}
                >
                    <GraduationCap className="h-6 w-6 text-white" />
                </div>

                <div className="space-y-1">
                    <CardTitle className="text-base font-semibold">
                        {config.title}
                    </CardTitle>
                    <CardDescription className="text-xs">
                        {config.description}
                    </CardDescription>
                </div>
            </CardHeader>

            <CardContent className="flex items-end justify-between">
                <div
                    className={`text-4xl font-black tracking-tight ${config.color.text}`}
                >
                    {count.toLocaleString()}
                </div>

                <span className="text-xs text-muted-foreground">
                    As of {dayjs().format('MMM D, YYYY')}
                </span>
            </CardContent>
        </Card>
    );
}
