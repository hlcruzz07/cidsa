import type { Appearance } from '@/hooks/use-appearance';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useState, type HTMLAttributes } from 'react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

type Props = HTMLAttributes<HTMLDivElement>;

export default function ThemeButton({ className, ...props }: Props) {
    const { appearance, updateAppearance } = useAppearance();
    const [popoverOpen, setPopoverOpen] = useState(false);

    const tabs: { value: Appearance; icon: LucideIcon; label: string }[] = [
        { value: 'light', icon: Sun, label: 'Light' },
        { value: 'dark', icon: Moon, label: 'Dark' },
        { value: 'system', icon: Monitor, label: 'System' },
    ];

    return (
        <div {...props} className={cn('fixed top-3 right-3 z-100', className)}>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger>
                    <Button
                        variant={appearance === 'light' ? 'default' : 'outline'}
                        size="icon"
                    >
                        {appearance === 'light' ? (
                            <Sun className="h-4 w-4" />
                        ) : appearance === 'dark' ? (
                            <Moon className="h-4 w-4" />
                        ) : (
                            <Monitor className="h-4 w-4" />
                        )}
                    </Button>
                </PopoverTrigger>

                <PopoverContent align="end" className="w-auto p-2">
                    <div>
                        {tabs.map(({ value, icon: Icon, label }) => (
                            <button
                                key={value}
                                onClick={() => {
                                    updateAppearance(value);
                                    setPopoverOpen(false);
                                }}
                                className={cn(
                                    'flex w-full items-center rounded-md px-3.5 py-1.5 transition-colors',
                                    appearance === value
                                        ? 'bg-primary text-primary-foreground shadow-xs'
                                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                                )}
                            >
                                <Icon className="-ml-1 h-4 w-4" />
                                <span className="ml-1.5 text-sm">{label}</span>
                            </button>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
