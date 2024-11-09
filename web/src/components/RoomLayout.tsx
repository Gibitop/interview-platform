import { Role } from '~insider/types/users';
import { Button } from './ui/button';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, Flag, FlagOff } from 'lucide-react';
import { Logo } from './Logo';
import { Participants } from './Participants';
import { ProfileButton } from './ProfileButton';
import { ResizablePanel, ResizablePanelGroup } from './ui/resizable';
import { CodeEditor } from './CodeEditor';
import { Terminal } from './Terminal';
import { AppRouter } from '~backend/trpc/router';
import { dateFormatter } from '~/consts/dateFormatter';
import { ROOM_TYPE_NAMES } from '~/consts/roomTypes';
import { SimpleTooltip } from './simple/SimpleTooltip';
import { useState } from 'react';
import { NotesEditor } from './NotesEditor';
import { PanelResizeHandle } from 'react-resizable-panels';

export type RoomLayoutProps = {
    role: Role;
    roomNamePrefix: string;
    backLink: string;
    roomInfo?: Pick<
        AppRouter['rooms']['getHostInfo']['_def']['$types']['output'],
        'name' | 'createdAt'
    > & { type: string };
};

export const RoomLayout = ({ role, roomInfo, roomNamePrefix, backLink }: RoomLayoutProps) => {
    const [usernameCursorsVisible, setUsernameCursorsVisible] = useState(true);

    return (
        <>
            <div className="flex justify-between items-center border-b dark:border-neutral-800 px-3 py-2 min-h-11">
                {role !== 'spectator' && roomInfo ? (
                    <div className="flex items-center gap-2">
                        <Button size="xs" variant="ghost" className="aspect-square p-1" asChild>
                            <Link to={backLink}>
                                <ArrowLeft size={16} />
                            </Link>
                        </Button>
                        <span>
                            {roomNamePrefix} "<span className="font-semibold">{roomInfo.name}</span>
                            "
                        </span>
                        <span className="text-sm opacity-50">
                            {roomInfo.type in ROOM_TYPE_NAMES
                                ? ROOM_TYPE_NAMES[roomInfo.type as keyof typeof ROOM_TYPE_NAMES]
                                : roomInfo.type}{' '}
                            - {dateFormatter.format(roomInfo.createdAt)}
                        </span>
                    </div>
                ) : (
                    <Logo isSmall isLink />
                )}
                <div className="flex gap-3 items-center">
                    <SimpleTooltip
                        tipContent={
                            usernameCursorsVisible
                                ? 'User names on cursors are visible'
                                : 'User names on cursors are hidden'
                        }
                    >
                        <Button
                            size="xs"
                            className="aspect-square p-1"
                            variant="ghost"
                            onClick={() => setUsernameCursorsVisible(!usernameCursorsVisible)}
                        >
                            {usernameCursorsVisible ? <Flag size={16} /> : <FlagOff size={16} />}
                        </Button>
                    </SimpleTooltip>
                    <Participants />
                    <ProfileButton />
                </div>
            </div>
            <div className="flex-1 flex overflow-hidden">
                <ResizablePanelGroup direction="horizontal">
                    {role !== 'candidate' && (
                        <>
                            <ResizablePanel className="border-r border-r-neutral-800">
                                <NotesEditor />
                            </ResizablePanel>
                            <PanelResizeHandle />
                        </>
                    )}
                    <ResizablePanel>
                        <CodeEditor role={role} usernameCursorsVisible={usernameCursorsVisible} />
                    </ResizablePanel>
                </ResizablePanelGroup>
                {/* <div className="flex flex-col border-l border-l-neutral-800">
                    <Terminal />
                </div> */}
            </div>
        </>
    );
};
