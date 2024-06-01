import { createFileRoute, Link } from '@tanstack/react-router';
import { ColumnDef } from '@tanstack/react-table';
import { DoorOpen, Link2, Plus } from 'lucide-react';
import { AuthScreen } from '~/components/AuthScreen';
import { CreateRoomDialog } from '~/components/CreateRoomDialog';
import { Logo } from '~/components/Logo';
import { ProfileButton } from '~/components/ProfileButton';
import { SimplePagination } from '~/components/simple/SimplePagination';
import { Button } from '~/components/ui/button';
import { usePagination } from '~/hooks/usePagination';
import { trpc } from '~/lib/trpc';
import { AppRouter } from '../../../backend/src/trpc/router';
import { DataTable } from '~/components/ui/data-table';
import { SimpleTooltip } from '~/components/simple/SimpleTooltip';
import { Badge } from '~/components/ui/badge';
import { toast } from 'sonner';
import { uuidToHumanId } from '~/utils/uuid';

const dateFormatter = new Intl.DateTimeFormat(['ru-RU']);

const columns: ColumnDef<
    AppRouter['rooms']['getMy']['_def']['$types']['output']['rooms'][number]
>[] = [
    {
        header: 'Name',
        accessorKey: 'name',
    },
    {
        header: 'Type',
        accessorKey: 'type',
    },
    {
        header: 'Active',
        id: 'active',
        cell: ({ row }) => (
            <Badge variant={row.original.isActive ? 'positive' : 'destructive'}>
                {row.original.isActive ? 'Active' : 'Inactive'}
            </Badge>
        ),
    },
    {
        header: 'Created at',
        accessorFn: ({ createdAt }) => dateFormatter.format(createdAt),
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const handleCopyLink = () => {
                navigator.clipboard.writeText(`${window.location.origin}/rooms/${row.original.id}`);
                toast.success('Room link copied!');
            };

            return (
                <div className="space-x-2 text-end">
                    <SimpleTooltip tipContent="Join the room">
                        <Button size="xs" variant="outline" className="size-7 p-1" asChild>
                            <Link to={`/rooms/${uuidToHumanId(row.original.id)}`}>
                                <DoorOpen />
                            </Link>
                        </Button>
                    </SimpleTooltip>
                    <SimpleTooltip tipContent="Copy link">
                        <Button
                            size="xs"
                            variant="outline"
                            className="size-7 p-1"
                            onClick={handleCopyLink}
                        >
                            <Link2 />
                        </Button>
                    </SimpleTooltip>
                </div>
            );
        },
    },
];

const AuthedComponent = () => {
    const { requestPagination, setPage, useSetResponsePagination, responsePagination } =
        usePagination();
    const { data, isLoading } = trpc.rooms.getMy.useQuery({ pagination: requestPagination });
    useSetResponsePagination(data?.pagination);

    return (
        <>
            <nav className="border-b dark:border-neutral-800">
                <div className="py-2 px-3 container flex items-center justify-between">
                    <Logo isSmall />
                    <ProfileButton withName />
                </div>
            </nav>
            <main className="p-4 container">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-3xl">My rooms</h2>
                    <CreateRoomDialog>
                        <Button size="sm">
                            <Plus className="mr-2" />
                            New room
                        </Button>
                    </CreateRoomDialog>
                </div>
                <DataTable isLoading={isLoading} columns={columns} data={data?.rooms ?? []} />
                <SimplePagination
                    pages={responsePagination.pages}
                    page={responsePagination.page}
                    setPage={setPage}
                    className="mt-3"
                />
            </main>
        </>
    );
};

export const Route = createFileRoute('/rooms')({
    component: () => (
        <AuthScreen>
            <AuthedComponent />
        </AuthScreen>
    ),
});
