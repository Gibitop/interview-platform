import { createFileRoute } from '@tanstack/react-router';
import { ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
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

const columns: ColumnDef<
    AppRouter['rooms']['getMy']['_def']['$types']['output']['rooms'][number]
>[] = [
    {
        accessorKey: 'name',
        header: 'Name',
    },
    {
        accessorKey: 'type',
        header: 'Type',
    },
    {
        accessorKey: 'isActive',
        header: 'Active',
    },
    {
        accessorFn: ({ createdAt }) => new Intl.DateTimeFormat(['gb'], {}).format(createdAt),
        header: 'Created at',
    },
];

const AuthedComponent = () => {
    const { requestPagination, setPage, useSetResponsePagination, responsePagination } =
        usePagination();
    const { data, isLoading } = trpc.rooms.getMy.useQuery({ pagination: requestPagination });
    useSetResponsePagination(data?.pagination);

    const table = useReactTable({
        data: data?.rooms ?? [],
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <>
            <nav className="py-2 px-3 flex items-center justify-between border-b dark:border-neutral-800">
                <Logo isSmall />
                <ProfileButton withName />
            </nav>
            <main className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-3xl">My rooms</h2>
                    <CreateRoomDialog>
                        <Button size="sm">
                            <Plus className="mr-2" />
                            New room
                        </Button>
                    </CreateRoomDialog>
                </div>
                <DataTable columns={columns} data={data?.rooms ?? []} />
                <SimplePagination
                    pages={responsePagination.pages}
                    page={responsePagination.page}
                    setPage={setPage}
                    className='mt-3'
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
