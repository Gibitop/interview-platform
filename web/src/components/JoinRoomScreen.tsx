import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Link } from '@tanstack/react-router';
import { toast } from 'sonner';
import { SimpleFormField } from './simple/SimpleFormField';
import { SimpleForm } from './simple/SimpleForm';
import { SimpleTabs } from './simple/SimpleTabs';
import { useAuthState } from '~/hooks/useAuthState';
import { trpcVanilla } from '~/lib/trpc';
import useRefinement from '~/hooks/useRefinement';
import { humanIdToUuid, uuidToHumanId } from '~/utils/uuid';
import { useLogin } from '~/hooks/trpc/useLogin';
import { useJoinRoom } from '~/hooks/trpc/useJoinRoom';
import { Button } from './ui/button';
import { ProfileButton } from './ProfileButton';
import { Logo } from './Logo';
import { useRoomStore } from '~/stores/room';
import { Checkbox } from './ui/checkbox';

export type TJoinRoomScreenProps = {
    roomId?: string;
    withSignInButton?: boolean;
    onReady?: (roomId: string) => void;
};

const formSchema = z.discriminatedUnion('tab', [
    z.object({
        tab: z.literal('candidate'),
        roomId: z.string().min(1),
        name: z.string().min(1),
    }),
    z.object({
        tab: z.literal('host'),
        roomId: z.string().min(1),
        username: z.string().nullish(),
        password: z.string().nullish(),
        isSpectator: z.boolean().nullish(),
    }),
]);

export const JoinRoomScreen = ({ roomId, withSignInButton, onReady }: TJoinRoomScreenProps) => {
    const authState = useAuthState();

    const { mutateAsync: loginAsync, isPending: isLoggingIn } = useLogin();
    const { mutateAsync: joinRoomAsync, isPending: isLoading } = useJoinRoom();

    const roomIdExistsRefinement = useRefinement<z.infer<typeof formSchema>>(
        ({ roomId }) =>
            trpcVanilla.rooms.getPublicInfo
                .query({ roomId: humanIdToUuid(roomId) })
                .then(() => true)
                .catch(() => false),
        { debounce: 300 },
    );
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(
            formSchema
                .refine(roomIdExistsRefinement, {
                    path: ['roomId'],
                    message: 'Room does not exist',
                })
                .refine(
                    data => {
                        if (data.tab === 'host' && authState !== 'logged-in' && !data.username) {
                            return false;
                        }
                        return true;
                    },
                    { message: 'Username is required', path: ['username'] },
                )
                .refine(
                    data => {
                        if (data.tab === 'host' && authState !== 'logged-in' && !data.password) {
                            return false;
                        }
                        return true;
                    },
                    { message: 'Password is required', path: ['password'] },
                ),
        ),
        defaultValues: {
            tab: authState === 'logged-in' ? 'host' : 'candidate',
            roomId: roomId ?? '',
            name: window.sessionStorage.getItem('name') || '',
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (values.tab === 'host') {
            if (authState === 'logged-out') {
                try {
                    await loginAsync({ username: values.username!, password: values.password! });
                } catch {
                    toast.error('Cloud not sign-in');
                    return;
                }
            }
            try {
                await joinRoomAsync({
                    roomId: humanIdToUuid(values.roomId),
                    isStealthy: !!values.isSpectator,
                });
            } catch {
                if (values.isSpectator) {
                    toast.error('Cloud not join the room as a spectator');
                    return;
                }
                toast.error('Could not add the room to your rooms');
            }
            useRoomStore.setState({
                roomId: values.roomId,
                role: 'host',
                isSpectator: !!values.isSpectator,
                token: await trpcVanilla.rooms.getHostJwt.query({
                    roomId: humanIdToUuid(values.roomId),
                }),
            });
        } else {
            sessionStorage.setItem('name', values.name);
            useRoomStore.setState({
                roomId: values.roomId,
                role: 'candidate',
                name: values.name,
            });
        }
        onReady?.(values.roomId);
    }

    const currentTab = form.watch('tab');

    return (
        <main className="m-auto mt-[25vh] mb-6">
            <div className="absolute right-3 top-3">
                {withSignInButton && authState === 'logged-out' && (
                    <Button variant="secondary" asChild>
                        <Link to="/rooms">Sign in</Link>
                    </Button>
                )}
                {authState === 'logged-in' && (
                    <div className="flex items-center gap-3">
                        <Button size="sm" variant="secondary">
                            <Link to="/rooms">Rooms</Link>
                        </Button>
                        <ProfileButton withName />
                    </div>
                )}
            </div>
            <div className="flex flex-col items-center gap-3">
                <Logo isCentered className="mb-3" />
                <SimpleTabs
                    className="w-[400px]"
                    options={[
                        { label: 'Join as a candidate', value: 'candidate' },
                        { label: 'Join as a host', value: 'host' },
                    ]}
                    value={currentTab}
                    onChange={value => form.setValue('tab', value)}
                />
                <Card className="p-4 w-[400px] pt-5 pb-6">
                    <SimpleForm
                        form={form}
                        onSubmitSuccess={onSubmit}
                        submitButtonContent="Join room"
                        isLoading={isLoading || isLoggingIn}
                    >
                        {!roomId && (
                            <SimpleFormField
                                rules={{ validate: () => false || 'Room does not exist' }}
                                control={form.control}
                                name="roomId"
                                defaultValue=""
                                label="Room id"
                                description="Room id is provided by the interviewer"
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        onChange={e => {
                                            roomIdExistsRefinement.invalidate();
                                            field.onChange(uuidToHumanId(e.target.value));
                                        }}
                                        onCopy={() =>
                                            toast('Room id copied!', {
                                                duration: 1500,
                                                position: 'top-center',
                                            })
                                        }
                                    />
                                )}
                            />
                        )}
                        {currentTab === 'candidate' && (
                            <SimpleFormField
                                control={form.control}
                                name="name"
                                label="Your name"
                                description="Will be displayed to other participants"
                                render={({ field }) => <Input {...field} />}
                            />
                        )}
                        {currentTab === 'host' && (
                            <>
                                {authState === 'logged-out' && (
                                    <>
                                        <SimpleFormField
                                            control={form.control}
                                            name="username"
                                            defaultValue=""
                                            label="Username"
                                            render={({ field }) => (
                                                <Input {...field} value={field.value ?? ''} />
                                            )}
                                        />
                                        <SimpleFormField
                                            control={form.control}
                                            name="password"
                                            defaultValue=""
                                            label="Password"
                                            render={({ field }) => (
                                                <Input
                                                    type="password"
                                                    {...field}
                                                    value={field.value ?? ''}
                                                />
                                            )}
                                        />
                                    </>
                                )}
                                <SimpleFormField
                                    inline
                                    control={form.control}
                                    name="isSpectator"
                                    defaultValue={false}
                                    label="Spectator mode"
                                    description="You will not be able to interact with the sandbox and will not be visible to other participants"
                                    render={({ field }) => (
                                        <Checkbox
                                            {...field}
                                            value={undefined}
                                            onChange={undefined}
                                            checked={!!field.value}
                                            onCheckedChange={checked => field.onChange(checked)}
                                        />
                                    )}
                                />
                            </>
                        )}
                    </SimpleForm>
                </Card>
            </div>
        </main>
    );
};
