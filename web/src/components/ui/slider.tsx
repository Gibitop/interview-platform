import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '~/utils/shadcn';

type SliderProps = React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
    size?: 'sm' | 'md';
};

const Slider = React.forwardRef<React.ElementRef<typeof SliderPrimitive.Root>, SliderProps>(
    ({ className, size = 'md', ...props }, ref) => (
        <SliderPrimitive.Root
            ref={ref}
            className={cn('relative flex w-full touch-none select-none items-center', className)}
            {...props}
        >
            <SliderPrimitive.Track
                className={cn(
                    'relative w-full grow overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800',
                    size === 'sm' && 'h-1.5',
                    size === 'md' && 'h-2',
                )}
            >
                <SliderPrimitive.Range className="absolute h-full bg-neutral-900 dark:bg-neutral-50" />
            </SliderPrimitive.Track>
            <SliderPrimitive.Thumb
                className={cn(
                    'block rounded-full border-2 border-neutral-900 bg-white ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-50 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:focus-visible:ring-neutral-300',
                    size === 'sm' && 'w-3.5 h-3.5',
                    size === 'md' && 'w-5 h-5',
                )}
            />
        </SliderPrimitive.Root>
    ),
);
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
