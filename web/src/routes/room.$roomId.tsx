import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect } from 'react';

import { z } from 'zod';
import { Editor } from '~/components/Editor';
import { EnterUsernameCard } from '~/components/EnterUsernameCard';
import { Participants } from '~/components/Participants';
import { Terminal } from '~/components/Terminal';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '~/components/ui/resizable';
import { YjsProvider } from '~/components/contexts/YjsContext';
import { defaultRoom, useRoomStore } from '~/stores/room';
import { UsersProvider } from '~/components/contexts/UsersContext';

const roomParamsSchema = z.object({
    roomId: z.string().min(1),
});

const Room = () => {
    const { roomId } = Route.useParams();
    const room = useRoomStore(s => s);

    useEffect(() => {
        if (room.roomId === roomId) return;

        useRoomStore.setState({ ...structuredClone(defaultRoom), roomId });
        if (localStorage.getItem('hostedRooms')?.split(',').includes(roomId)) {
            useRoomStore.setState({ isHost: true });
        }
    }, [room.roomId, roomId]);

    if (!room.myUsername) {
        return (
            <main className="min-h-screen grid place-items-center">
                <div>
                    <h1 className="w-full text-center font-semibold text-3xl mb-3">
                        <Link to="/">Unnamed interview platform</Link>
                    </h1>
                    <EnterUsernameCard
                        onSubmit={myUsername => useRoomStore.setState({ myUsername })}
                    />
                </div>
            </main>
        );
    }

    return (
        <YjsProvider roomId={roomId}>
            <UsersProvider userName={room.myUsername}>
                <main className="h-screen flex flex-col">
                    <div className="flex justify-between border-b dark:border-neutral-800 px-3 py-2">
                        <h1 className="font-semibold text-lg leading-6">
                            <Link to="/">Unnamed interview platform</Link>
                        </h1>
                        <Participants />
                    </div>
                    <div className="flex-1">
                        <ResizablePanelGroup direction="horizontal">
                            <ResizablePanel>
                                <Editor />
                            </ResizablePanel>
                            <ResizableHandle />
                            <ResizablePanel
                                minSize={18}
                                collapsible
                                collapsedSize={3}
                                className="flex flex-col @container"
                            >
                                <Terminal />
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </div>
                </main>
            </UsersProvider>
        </YjsProvider>
    );
};

export const Route = createFileRoute('/room/$roomId')({
    parseParams: params => roomParamsSchema.parse(params),
    onError: () => window.location.replace('/'),
    component: Room,
});
