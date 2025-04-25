import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../components/ui/dialog';
import { trpc } from '~/lib/trpc';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { ROOM_TYPE_NAMES, ROOM_TYPES } from '~/consts/roomTypes';
import { SimpleFormField } from './simple/SimpleFormField';
import { SimpleForm } from './simple/SimpleForm';

export type TCreateRoomDialogProps = {
    children: React.ReactNode;
};

const formSchema = z.object({
    name: z.string().min(1),
    type: z.enum(ROOM_TYPES),
});

export const CreateRoomDialog: React.FC<TCreateRoomDialogProps> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);

    const trpcUtils = trpc.useUtils();
    const { mutate: createRoom, isPending } = trpc.rooms.create.useMutation({
        onSuccess: () => {
            trpcUtils.rooms.getMyRooms.invalidate();
            setIsOpen(false);
            toast.success('Room created');
        },
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        createRoom(values);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create new room</DialogTitle>
                </DialogHeader>
                <SimpleForm
                    form={form}
                    onSubmitSuccess={onSubmit}
                    isLoading={isPending}
                    submitButtonContent="Create"
                >
                    <SimpleFormField
                        control={form.control}
                        name="name"
                        label="Room name"
                        disabled={isPending}
                        render={({ field }) => <Input {...field} placeholder="John Doe" />}
                    />
                    <SimpleFormField
                        control={form.control}
                        name="type"
                        label="Room type"
                        disabled={isPending}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ROOM_TYPES.map(type => (
                                        <SelectItem key={type} value={type}>
                                            {ROOM_TYPE_NAMES[type]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                </SimpleForm>
            </DialogContent>
        </Dialog>
    );
};
