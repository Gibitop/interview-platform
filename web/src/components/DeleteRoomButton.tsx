import { Loader2, Trash2 } from 'lucide-react';
import { trpc } from '~/lib/trpc';
import { useAlertDialog } from './contexts/AlertDialog';
import { Button } from './ui/button';

export type DeleteRoomButtonProps = {
    roomId: string;
};

export const DeleteRoomButton = ({ roomId }: DeleteRoomButtonProps) => {
    const trpcUtils = trpc.useUtils();

    const { mutate: deleteRoom, isPending: isDeletingRoom } = trpc.rooms.delete.useMutation({
        onSuccess: () => {
            trpcUtils.rooms.getMyRooms.invalidate();
            trpcUtils.rooms.getMyRecordings.invalidate();
        },
    });

    const { confirm } = useAlertDialog();

    return (
        <Button
            size="icon-sm"
            variant="outline"
            disabled={isDeletingRoom}
            onClick={() =>
                confirm({
                    onConfirm: () => deleteRoom({ roomId }),
                    title: 'Are you sure you want to delete this recording?',
                    body: <p>You won't be able to restore it or the room it belongs to</p>,
                })
            }
        >
            {isDeletingRoom && <Loader2 size={18} className="animate-spin" />}
            {!isDeletingRoom && <Trash2 size={18} />}
        </Button>
    );
};
