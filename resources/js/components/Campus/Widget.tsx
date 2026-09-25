import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { formatCount } from '@/lib/utils';
import dayjs from 'dayjs';
import { LucideIcon } from 'lucide-react';

type WidgetProps = {
    count: number;
    title: string;
    description: string;
    icon: LucideIcon;
    color: string; // e.g. "chart-1", "chart-2", ...
};

export default function Widget({
    count,
    title,
    description,
    icon: Icon,
    color,
}: WidgetProps) {
    return (
        <Card className="group relative w-full overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md">
            {/* Accent glow */}
            <div
                className={`pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full bg-${color} opacity-20 blur-2xl transition-opacity group-hover:opacity-30`}
            />

            <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
                <div className="space-y-1.5">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        {title}
                    </CardTitle>
                    <CardDescription className="text-xs leading-snug">
                        {description}
                    </CardDescription>
                </div>

                <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-${color}/10 text-${color}`}
                >
                    <Icon className="h-4.5 w-4.5" />
                </div>
            </CardHeader>

            <CardContent className="space-y-1">
                <div className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
                    {formatCount(count)}
                </div>

                <p className="text-xs text-muted-foreground">
                    As of {dayjs().format('MMM D, YYYY')}
                </p>
            </CardContent>
        </Card>
    );
}
