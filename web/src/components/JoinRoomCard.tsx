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
import { useRoomStore } from '~/stores/room';
import { toast } from 'sonner';

const formSchema = z.object({
    roomId: z.string().min(1),
    username: z.string().min(1),
});

export const JoinRoomCard = () => {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: window.localStorage.getItem('username') || '',
        },
    });

    const navigate = useNavigate();

    function onSubmit(values: z.infer<typeof formSchema>) {
        window.localStorage.setItem('username', values.username);
        useRoomStore.setState({
            roomId: values.roomId,
            myUsername: values.username,
            isHost: false,
        });
        navigate({
            to: '/rooms/$roomId',
            params: { roomId: values.roomId },
        });
    }

    return (
        <Card className="p-4 shadow-md w-[400px] h-96">
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="h-full flex flex-col gap-3 justify-between"
                >
                    <div className="space-y-4">
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
                                            onCopy={() =>
                                                toast('Room id copied!', {
                                                    duration: 1500,
                                                    position: 'top-center',
                                                })
                                            }
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Room id is provided by the interviewer
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <Button className="w-full mt-3" type="submit">
                        Join room
                    </Button>
                </form>
            </Form>
        </Card>
    );
};
