import React from 'react';
import { Form } from '../ui/form';
import { Button } from '../ui/button';
import { FieldValues, SubmitHandler, UseFormReturn } from 'react-hook-form';
import { cn } from '~/utils/shadcn';

export type TSimpleFormProps<TFieldValues extends FieldValues> = {
    form: UseFormReturn<TFieldValues>;
    onSubmitSuccess: SubmitHandler<TFieldValues>;
    className?: string;
    submitButtonContent?: React.ReactNode;
    children?: React.ReactNode;
    isLoading?: boolean;
};

export const SimpleForm = <TFieldValues extends FieldValues>({
    form,
    className,
    onSubmitSuccess,
    isLoading,
    submitButtonContent,
    children,
}: TSimpleFormProps<TFieldValues>) => {
    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmitSuccess)}
                className={cn('space-y-6', className)}
            >
                {children}
                <Button className="w-full" type="submit" disabled={isLoading}>
                    {submitButtonContent}
                </Button>
            </form>
        </Form>
    );
};
