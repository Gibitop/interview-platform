import { ControllerProps, FieldPath, FieldValues } from 'react-hook-form';
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '../ui/form';
import { cn } from '~/utils/shadcn';

export type TSimpleFormFieldProps<
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = ControllerProps<TFieldValues, TName> & {
    label: string;
    description?: string;
    className?: string;
    inline?: boolean;
};

export const SimpleFormField = <
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
    label,
    description,
    inline,
    render,
    className,
    ...props
}: TSimpleFormFieldProps<TFieldValues, TName>) => (
    <FormField
        {...props}
        render={renderArgs => (
            <FormItem className={className}>
                <div
                    className={cn(
                        !inline && 'space-y-2',
                        inline && 'flex items-center gap-2 flex-row-reverse justify-end',
                    )}
                >
                    <FormLabel className={cn('cursor-pointer', inline && 'mt-px')}>
                        {label}
                    </FormLabel>
                    <FormControl>{render(renderArgs)}</FormControl>
                </div>
                {description && <FormDescription>{description}</FormDescription>}
                <FormMessage />
            </FormItem>
        )}
    />
);
