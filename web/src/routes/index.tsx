import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { CreateJoinRoom } from '~/components/CreateJoinRoom';

export const Route: unknown = createFileRoute('/')({
    component: () => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [selectedTab, setSelectedTab] = useState('join-room');

        return (
            <main className="min-h-screen grid place-items-center">
                <div className="flex flex-col gap-3">
                    <h1 className="w-full text-center font-semibold text-3xl mb-3">
                        Unnamed interview platform
                    </h1>
                    <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-[400px]">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value={'join-room'}>Join room</TabsTrigger>
                            <TabsTrigger value={'create-room'}>Create room</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <CreateJoinRoom isCreate={selectedTab === 'create-room'} />
                </div>
            </main>
        );
    },
});
