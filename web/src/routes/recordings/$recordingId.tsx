import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { trpc } from '~/lib/trpc';
import { humanIdToUuid } from '~/utils/uuid';
import { RecordingProvider } from '~/components/contexts/useRoomContext/RecordingProvider';
import { RoomLayout } from '~/components/RoomLayout';
import { AuthScreen } from '~/components/AuthScreen';
import { Loader2 } from 'lucide-react';
import type { Recording } from '~insider/types/recording';
import { parseRecordingFile } from '~/utils/recording';
import { usePromise } from '~/hooks/usePromise';

const Recording = () => {
    const { recordingId } = Route.useParams();
    const recordingUuid = humanIdToUuid(recordingId);

    const { data: roomHostInfo, isLoading: isRoomHostInfoLoading } =
        trpc.rooms.getHostInfo.useQuery({
            roomId: recordingUuid,
        });

    const { data: recordingPromise, isLoading: isRecordingLoading } =
        trpc.rooms.getRecording.useQuery({ roomId: recordingUuid }, { select: parseRecordingFile });

    const {
        value: parsedRecording,
        loading: isParsingRecording,
        error: parsingRecordingError,
    } = usePromise(recordingPromise);

    if (isRoomHostInfoLoading || isRecordingLoading || isParsingRecording) {
        return (
            <main className="h-screen grid place-items-center">
                <div className="grid gap-2 place-items-center">
                    <Loader2 className="animate-spin mb-2" />
                    <p>Loading recording...</p>
                </div>
            </main>
        );
    }

    if (!parsedRecording || parsingRecordingError) {
        return <main className="h-screen fgrid place-items-center">Could not find recording</main>;
    }

    return (
        <main className="h-screen flex flex-col overflow-hidden">
            <RecordingProvider recording={parsedRecording.recording}>
                <RoomLayout
                    role="recorder"
                    roomInfo={roomHostInfo}
                    roomNamePrefix="Recording"
                    backLink="/recordings"
                />
            </RecordingProvider>
        </main>
    );
};

const recordingParamsSchema = z.object({
    recordingId: z.string().min(1),
});

export const Route = createFileRoute('/recordings/$recordingId')({
    parseParams: params => recordingParamsSchema.parse(params),
    onError: () => window.location.replace('/'),
    component: () => (
        <AuthScreen>
            <Recording />
        </AuthScreen>
    ),
});
