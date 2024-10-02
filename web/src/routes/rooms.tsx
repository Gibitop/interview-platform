import { createFileRoute, Link } from '@tanstack/react-router';
import { ColumnDef } from '@tanstack/react-table';
import { AlertTriangleIcon, Link2, Loader2, Plus, Square } from 'lucide-react';
import { AuthScreen } from '~/components/AuthScreen';
import { CreateRoomDialog } from '~/components/CreateRoomDialog';
import { SimplePagination } from '~/components/simple/SimplePagination';
import { Button } from '~/components/ui/button';
import { usePagination } from '~/hooks/usePagination';
import { trpc } from '~/lib/trpc';
import type { AppRouter } from '~backend/trpc/router';
import { DataTable } from '~/components/ui/data-table';
import { SimpleTooltip } from '~/components/simple/SimpleTooltip';
import { Badge } from '~/components/ui/badge';
import { toast } from 'sonner';
import { uuidToHumanId } from '~/utils/uuid';
import { useAlertDialog } from '~/components/contexts/AlertDialog';
import { ControlPanelLayout } from '~/components/ControlPanelLayout';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { ROOM_TYPE_NAMES } from '~/consts/roomTypes';
import { useRef } from 'react';
import { DeleteRoomButton } from '~/components/DeleteRoomButton';
import { dateFormatter } from '~/consts/dateFormatter';

const ActiveRoomActionsColumn = ({ roomId }: { roomId: string }) => {
    const trpcUtils = trpc.useUtils();
    const { mutate: stopRoom, isPending: isStoppingRoom } = trpc.rooms.stop.useMutation({
        onSuccess: () => {
            trpcUtils.rooms.getMyRooms.invalidate();
            trpcUtils.rooms.getMyRecordings.invalidate();
        },
    });

    const { confirm } = useAlertDialog();

    const handleCopyLink = () => {
        navigator.clipboard.writeText(`${window.location.origin}/rooms/${uuidToHumanId(roomId)}`);
        toast.success('Room link copied!');
    };

    return (
        <div className="space-x-2 text-end">
            <SimpleTooltip tipContent="Copy link">
                <Button
                    size="icon-sm"
                    variant="outline"
                    onClick={handleCopyLink}
                    disabled={isStoppingRoom}
                >
                    <Link2 size={18} />
                </Button>
            </SimpleTooltip>
            <SimpleTooltip tipContent="Stop room container">
                <Button
                    size="icon-sm"
                    variant="outline"
                    disabled={isStoppingRoom}
                    onClick={() =>
                        confirm({
                            onConfirm: () => stopRoom({ roomId }),
                            title: 'Are you sure you want to stop this room?',
                            body: (
                                <div>
                                    <p>You won't be able to start it again</p>
                                    <p>
                                        The recording will be generated and available in the 'my
                                        recordings' tab
                                    </p>
                                </div>
                            ),
                        })
                    }
                >
                    {isStoppingRoom && <Loader2 size={18} className="animate-spin" />}
                    {!isStoppingRoom && <Square size={18} />}
                </Button>
            </SimpleTooltip>
        </div>
    );
};

const NameColumn = ({
    id,
    isActive,
    name,
}: AppRouter['rooms']['getMyRooms']['_def']['$types']['output']['rooms'][number]) => {
    const { isPending: isStoppingRoom } = trpc.rooms.stop.useMutation();

    if (!isActive || isStoppingRoom) name;

    return (
        <Link className="underline" to={`/rooms/${uuidToHumanId(id)}`}>
            {name}
        </Link>
    );
};

const columns: ColumnDef<
    AppRouter['rooms']['getMyRooms']['_def']['$types']['output']['rooms'][number]
>[] = [
    {
        header: 'Name',
        cell: ({ row }) => <NameColumn {...row.original} />,
    },
    {
        header: 'Type',
        accessorFn: ({ type }) => ROOM_TYPE_NAMES[type],
    },
    {
        header: 'Status',
        id: 'active',
        cell: ({ row }) => (
            <Badge variant={row.original.isActive ? 'positive' : 'secondary'}>
                {row.original.isActive ? 'Active' : 'Inactive'}
            </Badge>
        ),
    },
    {
        header: 'Creation date',
        accessorFn: ({ createdAt }) => dateFormatter.format(createdAt),
    },
    {
        id: 'actions',
        meta: { noPadding: true },
        cell: ({ row }) => (
            <div className="space-x-2 text-end px-4 py-2">
                {row.original.isActive ? (
                    <ActiveRoomActionsColumn roomId={row.original.id} />
                ) : (
                    <DeleteRoomButton roomId={row.original.id} />
                )}
            </div>
        ),
    },
];

const AuthedComponent = () => {
    const { requestPagination, setPage, useSetResponsePagination, responsePagination } =
        usePagination();
    const { data, isLoading } = trpc.rooms.getMyRooms.useQuery({ pagination: requestPagination });
    useSetResponsePagination(data?.pagination);

    const newRoomButtonRef = useRef<HTMLButtonElement>(null);

    return (
        <ControlPanelLayout className="h-full flex flex-col justify-between">
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-3xl">My rooms</h2>
                    <CreateRoomDialog>
                        <Button size="sm" ref={newRoomButtonRef}>
                            <Plus className="mr-2" />
                            New room
                        </Button>
                    </CreateRoomDialog>
                </div>

                <Alert className="mt-4 mb-2">
                    <AlertTriangleIcon size={16} />
                    <AlertTitle>Rooms are stopped automatically 24h after creation</AlertTitle>
                    <AlertDescription>
                        After a room is stopped, the recording will be generated and available in
                        the "my recordings" tab
                    </AlertDescription>
                </Alert>

                <DataTable
                    isLoading={isLoading}
                    columns={columns}
                    data={data?.rooms ?? []}
                    noResultsMessage={
                        <div>
                            <p className="text-lg">You don't have any active rooms yet</p>
                            <Button
                                size="sm"
                                className="mt-4"
                                onClick={() => newRoomButtonRef.current?.click()}
                            >
                                <Plus className="mr-2" />
                                Create new room
                            </Button>
                        </div>
                    }
                />
            </div>
            {responsePagination.pages > 1 && (
                <SimplePagination
                    pages={responsePagination.pages}
                    page={responsePagination.page}
                    setPage={setPage}
                    className="mt-3"
                />
            )}
        </ControlPanelLayout>
    );
};

export const Route = createFileRoute('/rooms')({
    component: () => (
        <AuthScreen>
            <AuthedComponent />
        </AuthScreen>
    ),
});
