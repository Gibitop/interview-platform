import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { z } from 'zod';
import { trpc } from '~/lib/trpc';
import { JoinRoomScreen } from '~/components/JoinRoomScreen';
import { humanIdToUuid } from '~/utils/uuid';
import { useRoomStore } from '~/stores/room';
import { RoomProvider } from '~/components/contexts/useRoomContext/RoomProvider';
import { RoomLayout } from '~/components/RoomLayout';

const roomParamsSchema = z.object({
    roomId: z.string().min(1),
});

const Room = () => {
    const { roomId } = Route.useParams();
    const roomUuid = humanIdToUuid(roomId);

    const { data: selfUser } = trpc.auth.getSelf.useQuery();
    const roomStore = useRoomStore();
    const [name, setName] = useState(
        roomStore?.role === 'candidate' ? roomStore.name : selfUser?.name,
    );

    const { data: roomHostInfo } = trpc.rooms.getHostInfo.useQuery({ roomId: roomUuid });

    if (!roomStore || !name) {
        return (
            <JoinRoomScreen
                roomId={roomId}
                onReady={() => {
                    const roomStoreState = useRoomStore.getState();
                    if (!roomStoreState) return;
                    if (roomStoreState.role === 'host') setName(selfUser!.name);
                    else setName(roomStoreState.name);
                }}
            />
        );
    }

    return (
        <main className="h-screen flex flex-col">
            <RoomProvider>
                <RoomLayout
                    role={roomStore.role}
                    roomInfo={roomHostInfo}
                    roomNamePrefix="Room"
                    backLink="/rooms"
                />
            </RoomProvider>
        </main>
    );
};

export const Route = createFileRoute('/rooms/$roomId')({
    parseParams: params => roomParamsSchema.parse(params),
    onError: () => window.location.replace('/'),
    component: Room,
    beforeLoad: ({ params }) => {
        if (params.roomId !== useRoomStore.getState()?.roomId) {
            useRoomStore.setState(null);
        }
    },
    onLeave: () => useRoomStore.setState(null),
});
