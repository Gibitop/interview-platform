import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { z } from 'zod';
import { Editor } from '~/components/Editor';
import { Participants } from '~/components/Participants';
import { Terminal } from '~/components/Terminal';
import { ResizablePanel, ResizablePanelGroup } from '~/components/ui/resizable';
import { Logo } from '~/components/Logo';
import { ProfileButton } from '~/components/ProfileButton';
import { trpc } from '~/lib/trpc';
import { JoinRoomScreen } from '~/components/JoinRoomScreen';
import { ArrowLeft } from 'lucide-react';
import { humanIdToUuid } from '~/utils/uuid';
import { useRoomStore } from '~/stores/room';
import { Button } from '~/components/ui/button';
import { Link } from '@tanstack/react-router';
import { RoomProvider } from '~/components/contexts/useRoomContext';

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
        <RoomProvider>
            <main className="h-screen flex flex-col">
                <div className="flex justify-between border-b dark:border-neutral-800 px-3 py-2">
                    {roomStore.role === 'host' && roomHostInfo ? (
                        <div className="flex items-center gap-2">
                            <Button size="xs" variant="ghost" className="aspect-square p-1" asChild>
                                <Link to="/rooms">
                                    <ArrowLeft />
                                </Link>
                            </Button>
                            <span>
                                Room "<span className="font-semibold">{roomHostInfo.name}</span>"
                            </span>
                        </div>
                    ) : (
                        <Logo isSmall isLink />
                    )}
                    <div className="flex gap-3 items-center">
                        <Participants />
                        <ProfileButton />
                    </div>
                </div>
                <div className="flex-1">
                    <ResizablePanelGroup direction="horizontal">
                        <ResizablePanel>
                            <Editor />
                        </ResizablePanel>
                        <div className="flex flex-col">
                            <Terminal />
                        </div>
                    </ResizablePanelGroup>
                </div>
            </main>
        </RoomProvider>
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
