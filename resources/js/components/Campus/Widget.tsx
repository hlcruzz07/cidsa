import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { formatCount } from '@/lib/utils';
import dayjs from 'dayjs';
import { CheckCircle2, TrendingUp } from 'lucide-react';

type WidgetProps = {
    count: number;
    type:
        | 'totalUpdates'
        | 'totalNewPendings'
        | 'totalNewPrinted'
        | 'totalPendingReplacement';
};

const widgetConfig = {
    totalUpdates: {
        title: 'Total Student Updates',
        description: 'Number of student records updated.',
        color: {
            text: 'text-emerald-500',
            bg: 'bg-emerald-500',
        },
    },
    totalNewPendings: {
        title: 'New Pending IDs',
        description: 'Students waiting for their first ID to be printed.',
        color: {
            text: 'text-amber-500',
            bg: 'bg-amber-500',
        },
    },
    totalNewPrinted: {
        title: 'New Printed IDs',
        description: 'Students whose first ID has been printed.',
        color: {
            text: 'text-blue-500',
            bg: 'bg-blue-500',
        },
    },
    totalPendingReplacement: {
        title: 'Pending Replacements',
        description: 'Replacement ID requests awaiting printing.',
        color: {
            text: 'text-violet-500',
            bg: 'bg-violet-500',
        },
    },
} as const;

export default function Widget({ count, type }: WidgetProps) {
    const config = widgetConfig[type];

    return (
        <Card className="relative w-full overflow-hidden rounded-xl bg-background">
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

                <CardDescription>{config.description}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-2">
                <div
                    className={`flex items-center gap-5 text-4xl font-extrabold tabular-nums ${config.color.text}`}
                >
                    {formatCount(count)}
                    <TrendingUp size={55} />
                </div>

                <p className="text-xs text-muted-foreground">
                    As of {dayjs().format('MMM D, YYYY')}
                </p>
            </CardContent>
        </Card>
    );
}
