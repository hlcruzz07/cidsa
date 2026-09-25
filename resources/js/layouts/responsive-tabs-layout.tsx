// components/responsive-tabs.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

type ResponsiveTabItem = {
    value: string;
    trigger: ReactNode;
    content: ReactNode;
    disabled?: boolean;
};

type ResponsiveTabsProps = {
    items: ResponsiveTabItem[];
    defaultValue: string;
    className?: string;
};

export default function ResponsiveTabs({
    items,
    defaultValue,
    className,
}: ResponsiveTabsProps) {
    const isMobile = useIsMobile();
    return (
        <Tabs
            defaultValue={defaultValue}
            orientation={isMobile ? 'horizontal' : 'vertical'}
            className={cn(isMobile ? 'gap-4' : 'flex gap-4', className)}
        >
            <TabsList
                className={
                    isMobile
                        ? 'w-full flex-nowrap justify-start overflow-x-auto'
                        : 'h-fit w-max flex-col items-stretch justify-start gap-1 bg-transparent p-0'
                }
            >
                {items.map((item) => (
                    <TabsTrigger
                        key={item.value}
                        value={item.value}
                        disabled={item.disabled}
                        className={
                            isMobile
                                ? 'shrink-0 gap-2 data-[state=active]:bg-primary!'
                                : 'w-full justify-between gap-2 data-[state=active]:bg-primary!'
                        }
                    >
                        {item.trigger}
                    </TabsTrigger>
                ))}
            </TabsList>

            {items.map((item) => (
                <TabsContent
                    key={item.value}
                    value={item.value}
                    className={isMobile ? 'space-y-5' : 'flex-1 space-y-5'}
                >
                    {item.content}
                </TabsContent>
            ))}
        </Tabs>
    );
}
