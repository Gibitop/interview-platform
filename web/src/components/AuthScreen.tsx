import omit from 'lodash/omit';
import { Logo } from './Logo';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { trpc } from '~/lib/trpc';
import { Loader2 } from 'lucide-react';
import { SimpleTabs } from './simple/SimpleTabs';
import { SimpleForm } from './simple/SimpleForm';
import { SimpleFormField } from './simple/SimpleFormField';
import { toast } from 'sonner';
import { useInvalidateProtected } from '~/hooks/trpc/useInvalidateProtected';
import { useLogin } from '~/hooks/trpc/useLogin';

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

    const invalidateProtected = useInvalidateProtected();

    const { error: selfError, isLoading: isLoadingSelf } = trpc.auth.getSelf.useQuery(undefined, {
        retry: 0,
    });

    const { data: isRegistrationOpen, isLoading: isLoadingRegistrationOpen } =
        trpc.auth.isRegistrationOpen.useQuery();
    const { mutate: register, isPending: isRegistering } = trpc.auth.register.useMutation({
        onSuccess: invalidateProtected,
    });
    const { mutate: login, isPending: isLoggingIn } = useLogin();

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

    const handleSubmit = (values: z.infer<typeof formSchema>) => {
        if (values.tab === 'login') {
            login(omit(values, 'tab'), { onError: () => toast.error('Could not sign-in') });
        } else {
            register(omit(values, 'tab'), { onError: () => toast.error('Could not sign-up') });
        }
    };

    const isLoading = isRegistering || isLoggingIn || isLoadingRegistrationOpen;

    return (
        <main className="m-auto mt-[25vh] mb-6">
            <div className="flex flex-col items-center gap-3">
                <Logo isCentered className="mb-3" />
                <SimpleTabs
                    options={[
                        { label: 'Sign in', value: 'login' },
                        { label: 'Sign up', value: 'register' },
                    ]}
                    value={selectedTab}
                    onChange={val => form.setValue('tab', val)}
                    className="w-[400px]"
                />
                <Card className="p-4 w-[400px]">
                    <SimpleForm
                        form={form}
                        onSubmitSuccess={handleSubmit}
                        isLoading={isLoading}
                        submitButtonContent={
                            selectedTab === 'login'
                                ? 'Sign in'
                                : isRegistrationOpen
                                  ? 'Sign up'
                                  : 'Registration is closed'
                        }
                    >
                        <SimpleFormField
                            control={form.control}
                            name="username"
                            label="Username"
                            disabled={selectedTab === 'register' && !isRegistrationOpen}
                            render={({ field }) => <Input {...field} />}
                        />
                        <SimpleFormField
                            control={form.control}
                            name="password"
                            label="Password"
                            disabled={selectedTab === 'register' && !isRegistrationOpen}
                            render={({ field }) => <Input type="password" {...field} />}
                        />
                        {selectedTab === 'register' && (
                            <SimpleFormField
                                className="animate-in fade-in"
                                control={form.control}
                                name="name"
                                label="Your name"
                                description="Will be displayed to other participants"
                                disabled={selectedTab === 'register' && !isRegistrationOpen}
                                render={({ field }) => <Input {...field} />}
                            />
                        )}
                    </SimpleForm>
                </Card>
            </div>
        </main>
    );
};
