import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { formatCount } from '@/lib/utils';
import dayjs from 'dayjs';
import { Clock, LucideIcon, Printer, RefreshCcw, Users } from 'lucide-react';

type WidgetProps = {
    count: number;
    type:
        | 'totalUpdates'
        | 'totalNewPendings'
        | 'totalNewPrinted'
        | 'totalPendingReplacement';
};

const widgetConfig: Record<
    WidgetProps['type'],
    {
        title: string;
        description: string;
        icon: LucideIcon;
        text: string;
        bg: string;
        bgSoft: string;
    }
> = {
    totalUpdates: {
        title: 'Total',
        description: 'Number of student submissions.',
        icon: Users,
        text: 'text-chart-1',
        bg: 'bg-chart-1',
        bgSoft: 'bg-chart-1/10',
    },
    totalNewPendings: {
        title: 'Pendings',
        description: 'Students waiting for their first ID to be printed.',
        icon: Clock,
        text: 'text-chart-2',
        bg: 'bg-chart-2',
        bgSoft: 'bg-chart-2/10',
    },
    totalNewPrinted: {
        title: 'Printed',
        description: 'Students whose first ID has been printed.',
        icon: Printer,
        text: 'text-chart-3',
        bg: 'bg-chart-3',
        bgSoft: 'bg-chart-3/10',
    },
    totalPendingReplacement: {
        title: 'Pending Replacements',
        description: 'Replacement ID requests awaiting printing.',
        icon: RefreshCcw,
        text: 'text-chart-4',
        bg: 'bg-chart-4',
        bgSoft: 'bg-chart-4/10',
    },
};

export default function Widget({ count, type }: WidgetProps) {
    const config = widgetConfig[type];
    const Icon = config.icon;

    return (
        <Card className="group relative w-full overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md">
            {/* Accent glow */}
            <div
                className={`pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-30 ${config.bg}`}
            />

            <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
                <div className="space-y-1.5">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        {config.title}
                    </CardTitle>
                    <CardDescription className="text-xs leading-snug">
                        {config.description}
                    </CardDescription>
                </div>

                <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.bgSoft} ${config.text}`}
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
