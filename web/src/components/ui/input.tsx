import { Copy } from 'lucide-react';
import * as React from 'react';

import { cn } from '~/utils/shadcn';
import { Button } from './button';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    withCopy?: boolean;
    onCopy?: () => void;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, withCopy, onCopy, ...props }, ref) => {
        return (
            <div className="relative">
                <input
                    type={type}
                    className={cn(
                        'flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300',
                        withCopy && 'pr-[42px]',
                        className,
                    )}
                    ref={ref}
                    {...props}
                />
                {withCopy && (
                    <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        className="absolute top-1/2 -translate-y-1/2 right-1.5 aspect-square p-2 h-7"
                        onClick={() => {
                            navigator.clipboard.writeText((props.value ?? '').toString());
                            onCopy?.();
                        }}
                    >
                        <Copy className="aspect-square size-3" />
                    </Button>
                )}
            </div>
        );
    },
);
Input.displayName = 'Input';

export { Input };
