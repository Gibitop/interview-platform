import { createFileRoute, Link } from '@tanstack/react-router';
import { ColumnDef } from '@tanstack/react-table';
import { AlertTriangleIcon, Download, Loader2, ScanEye } from 'lucide-react';
import { useRef } from 'react';
import { AuthScreen } from '~/components/AuthScreen';
import { ControlPanelLayout } from '~/components/ControlPanelLayout';
import { DeleteRoomButton } from '~/components/DeleteRoomButton';
import { SimplePagination } from '~/components/simple/SimplePagination';
import { SimpleTooltip } from '~/components/simple/SimpleTooltip';
import { Alert, AlertTitle } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import { DataTable } from '~/components/ui/data-table';
import { dateFormatter } from '~/consts/dateFormatter';
import { ROOM_TYPE_NAMES } from '~/consts/roomTypes';
import { usePagination } from '~/hooks/usePagination';
import { trpc } from '~/lib/trpc';
import { uuidToHumanId } from '~/utils/uuid';
import { AppRouter } from '~backend/trpc/router';

const DownloadRecordingButton = ({ roomId }: { roomId: string }) => {
    const utils = trpc.useUtils();
    const { isPending: isDeletingRoom } = trpc.rooms.delete.useMutation();

    const downloaderRef = useRef<HTMLAnchorElement | null>(null);

    const handleDownload = async () => {
        if (!downloaderRef.current) return;

        const res = await utils.rooms.getRecording.fetch({ roomId });
        if (!res) {
            console.error('No response');
            return;
        }

        const blob = new Blob([res]);
        const blobUrl = URL.createObjectURL(blob);

        downloaderRef.current.href = blobUrl;
        downloaderRef.current.click();
    };

    return (
        <>
            <a download={`${uuidToHumanId(roomId)}.json.gz`} ref={downloaderRef} className="" />
            <SimpleTooltip tipContent="Download recording file">
                <Button
                    onClick={handleDownload}
                    size="icon-sm"
                    variant="outline"
                    disabled={isDeletingRoom}
                >
                    {isDeletingRoom && <Loader2 size={18} className="animate-spin" />}
                    {!isDeletingRoom && <Download size={18} />}
                </Button>
            </SimpleTooltip>
        </>
    );
};

const columns: ColumnDef<
    AppRouter['rooms']['getMyRecordings']['_def']['$types']['output']['recordings'][number]
>[] = [
    {
        header: 'Name',
        cell: ({ row }) => (
            <Link
                className="underline"
                to="/recordings/$recordingId"
                params={{ recordingId: uuidToHumanId(row.original.id) }}
            >
                {row.original.name}
            </Link>
        ),
    },
    {
        header: 'Type',
        accessorFn: ({ type }) => ROOM_TYPE_NAMES[type],
    },
    {
        header: 'Room creation date',
        accessorFn: ({ createdAt }) => dateFormatter.format(createdAt),
    },
    {
        id: 'actions',
        meta: { noPadding: true },
        cell: ({ row }) => (
            <div className="px-4 py-2 space-x-2 text-end">
                <DownloadRecordingButton roomId={row.original.id} />
                <SimpleTooltip tipContent="Delete recording">
                    <DeleteRoomButton roomId={row.original.id} />
                </SimpleTooltip>
            </div>
        ),
    },
];

const RecordingsComponent = () => {
    const { requestPagination, setPage, useSetResponsePagination, responsePagination } =
        usePagination();

    const { data, isLoading } = trpc.rooms.getMyRecordings.useQuery({
        pagination: requestPagination,
    });

    useSetResponsePagination(data?.pagination);

    return (
        <ControlPanelLayout>
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-3xl font-semibold">My recordings</h2>
                    <Button size="sm" asChild>
                        <Link to="/recordings/from-file">
                            <ScanEye className="mr-2" />
                            View from file
                        </Link>
                    </Button>
                </div>

                <Alert className="mt-4 mb-2">
                    <AlertTriangleIcon size={16} />
                    <AlertTitle className="mb-0">
                        Recordings are deleted automatically 30 days after generation
                    </AlertTitle>
                </Alert>

                <DataTable
                    isLoading={isLoading}
                    columns={columns}
                    data={data?.recordings ?? []}
                    noResultsMessage={
                        <>
                            <p className="mb-1 text-lg">You don't have any recordings yet.</p>
                            <p>Recordings appear here after a room is stopped</p>
                        </>
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

export const Route = createFileRoute('/recordings/')({
    component: () => (
        <AuthScreen>
            <RecordingsComponent />
        </AuthScreen>
    ),
});
