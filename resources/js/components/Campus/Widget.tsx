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

const COLOR_VARIANTS: Record<
    string,
    { glow: string; bg: string; text: string }
> = {
    'chart-1': {
        glow: 'bg-chart-1',
        bg: 'bg-chart-1/10',
        text: 'text-chart-1',
    },
    'chart-2': {
        glow: 'bg-chart-2',
        bg: 'bg-chart-2/10',
        text: 'text-chart-2',
    },
    'chart-3': {
        glow: 'bg-chart-3',
        bg: 'bg-chart-3/10',
        text: 'text-chart-3',
    },
    'chart-4': {
        glow: 'bg-chart-4',
        bg: 'bg-chart-4/10',
        text: 'text-chart-4',
    },
    'chart-5': {
        glow: 'bg-chart-5',
        bg: 'bg-chart-5/10',
        text: 'text-chart-5',
    },
};

type WidgetProps = {
    count: number;
    title: string;
    description: string;
    icon: LucideIcon;
    color: string;
};

export default function Widget({
    count,
    title,
    description,
    icon: Icon,
    color,
}: WidgetProps) {
    const styles = COLOR_VARIANTS[color] ?? COLOR_VARIANTS['chart-1'];

    return (
        <Card className="group relative w-full overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md">
            {/* Accent glow */}
            <div
                className={`pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full ${styles.glow} opacity-20 blur-2xl transition-opacity group-hover:opacity-30`}
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
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${styles.bg} ${styles.text}`}
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
