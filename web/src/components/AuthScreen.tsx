import omit from 'lodash/omit';
import { Logo } from './Logo';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
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
import { Input } from './ui/input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { trpc } from '~/lib/trpc';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';

const formSchema = z.discriminatedUnion('tab', [
    z.object({
        tab: z.literal('login'),
        username: z.string(),
        password: z.string(),
    }),
    z.object({
        tab: z.literal('register'),
        name: z.string().min(1),
        username: z.string().regex(/^[a-z0-9_-]{4,31}$/, { message: 'Invalid username' }),
        password: z.string().min(6).max(255),
    }),
]);

export const AuthScreen = ({ children }: React.PropsWithChildren) => {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { tab: 'login' },
    });
    const selectedTab = form.watch('tab');

    const trpcUtils = trpc.useUtils();
    const invalidateProtected = () => {
        trpcUtils.auth.getSelf.invalidate();
        trpcUtils.rooms.invalidate();
    };

    const { error: selfError, isLoading: isLoadingSelf } = trpc.auth.getSelf.useQuery(undefined, {
        retry: 0,
    });

    const { data: isRegistrationOpen, isLoading: isLoadingRegistrationOpen } =
        trpc.auth.isRegistrationOpen.useQuery();
    const { mutate: register, isPending: isRegistering } = trpc.auth.register.useMutation({
        onSuccess: invalidateProtected,
    });
    const { mutate: login, isPending: isLoggingIn } = trpc.auth.login.useMutation({
        onSuccess: invalidateProtected,
    });

    if (isLoadingSelf) {
        return (
            <main className="min-h-screen grid place-items-center">
                <Loader2 className="animate-spin" />
            </main>
        );
    }
    if (!selfError) {
        return children;
    }

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        if (values.tab === 'login') {
            login(omit(values, 'tab'));
        } else {
            register(omit(values, 'tab'));
        }
    };

    const isLoading = isRegistering || isLoggingIn || isLoadingRegistrationOpen;

    return (
        <main className="min-h-screen grid place-items-center">
            <div className="flex flex-col gap-3">
                <Logo isLink isCentered className="mb-3" />
                <Tabs
                    value={selectedTab}
                    onValueChange={newTab => form.setValue('tab', newTab as typeof selectedTab)}
                    className="w-[400px]"
                >
                    <TabsList className="grid w-full grid-cols-2 mb-3">
                        <TabsTrigger value={'login' satisfies typeof selectedTab}>
                            Sign in
                        </TabsTrigger>
                        <TabsTrigger value={'register' satisfies typeof selectedTab}>
                            Sign up
                        </TabsTrigger>
                    </TabsList>
                    <Card className="p-4 shadow-md">
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="h-full flex flex-col gap-3 justify-between"
                            >
                                <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="username"
                                        disabled={selectedTab === 'register' && !isRegistrationOpen}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Username</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        disabled={selectedTab === 'register' && !isRegistrationOpen}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Password</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {selectedTab === 'register' && (
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            disabled={
                                                selectedTab === 'register' && !isRegistrationOpen
                                            }
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
                                    )}
                                </div>

                                <Button
                                    className="w-full mt-3"
                                    type="submit"
                                    disabled={
                                        isLoading ||
                                        (selectedTab === 'register' && !isRegistrationOpen)
                                    }
                                >
                                    {selectedTab === 'login'
                                        ? 'Sign in'
                                        : isRegistrationOpen
                                          ? 'Sign up'
                                          : 'Registration is closed'}
                                </Button>
                            </form>
                        </Form>
                    </Card>
                </Tabs>
            </div>
        </main>
    );
};
