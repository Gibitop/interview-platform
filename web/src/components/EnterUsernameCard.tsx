import React from 'react';
import { Card } from './ui/card';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from './ui/form';
import { Button } from './ui/button';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from './ui/input';

export type TEnterUsernameCardProps = {
    onSubmit: (username: string) => void;
};

const formSchema = z.object({
    username: z.string().min(1),
});

export const EnterUsernameCard: React.FC<TEnterUsernameCardProps> = ({ onSubmit }) => {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: window.localStorage.getItem('username') || '',
        },
    });

    const handleSubmit = (values: z.infer<typeof formSchema>) => {
        window.localStorage.setItem('username', values.username);
        onSubmit(values.username);
    };

    return (
        <Card className="p-4 shadow-md h-56">
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className="h-full flex flex-col gap-3 justify-between"
                >
                    <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Your name</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormDescription>
                                    Will be displayed to other participants
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button className="w-full" type="submit">
                        Join
                    </Button>
                </form>
            </Form>
        </Card>
    );
};
