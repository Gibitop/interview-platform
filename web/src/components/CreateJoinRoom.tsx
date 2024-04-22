import { z } from 'zod';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from './ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useNavigate } from '@tanstack/react-router';
import { v4 as uuid4 } from 'uuid';
import { useEffect } from 'react';
import { useRoomStore } from '~/stores/room';
import { toast } from 'sonner';

const formSchema = z.object({
    roomId: z.string().min(1),
    username: z.string().min(1),
});

export type TCreateJoinRoomProps = {
    isCreate: boolean;
};

export const CreateJoinRoom = ({ isCreate }: TCreateJoinRoomProps) => {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: window.localStorage.getItem('username') || '',
        },
    });

    useEffect(() => {
        form.setValue('roomId', isCreate ? uuid4().replace(/-/g, '') : '');
    }, [form, isCreate]);

    const navigate = useNavigate();

    function onSubmit(values: z.infer<typeof formSchema>) {
        window.localStorage.setItem('username', values.username);
        if (isCreate) {
            localStorage.setItem(
                'hostedRooms',
                [...(localStorage.getItem('hostedRooms')?.split(',') ?? []), values.roomId].join(
                    ',',
                ),
            );
        }
        useRoomStore.setState({
            roomId: values.roomId,
            myUsername: values.username,
            isHost: isCreate,
        });
        navigate({
            to: '/room/$roomId',
            params: { roomId: values.roomId },
        });
    }

    return (
        <Card className="p-4 shadow-md h-96">
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="h-full flex flex-col gap-3 justify-between"
                >
                    <div className="space-y-8">
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
                        <FormField
                            control={form.control}
                            name="roomId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Room id</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            withCopy={isCreate}
                                            disabled={isCreate}
                                            onCopy={() =>
                                                toast('Room id copied!', {
                                                    duration: 1500,
                                                    position: 'top-center',
                                                })
                                            }
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        {isCreate
                                            ? 'Provide this id the interviewee'
                                            : 'Room id is provided by the interviewer'}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <Button className="w-full" type="submit">
                        {isCreate ? 'Create' : 'Join'}
                    </Button>
                </form>
            </Form>
        </Card>
    );
};
