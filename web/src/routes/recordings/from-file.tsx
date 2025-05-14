import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { AuthScreen } from '~/components/AuthScreen';
import { RecordingProvider } from '~/components/contexts/useRoomContext/RecordingProvider';
import { Logo } from '~/components/Logo';
import { RoomLayout } from '~/components/RoomLayout';
import { Button } from '~/components/ui/button';
import { DropZone } from '~/components/ui/drop-zone';
import { usePromise } from '~/hooks/usePromise';
import { parseRecordingFile } from '~/utils/recording';
import { Recording } from '~insider/types/recording';

const RecordingFromFile = () => {
    const [recordingPromise, setRecordingPromise] = useState<
        Promise<Recording | undefined> | undefined
    >();

    const handleSelctedFile = (file?: File) => {
        if (!file) return;

        setRecordingPromise(
            file.arrayBuffer().then(buffer => parseRecordingFile(new Uint8Array(buffer))),
        );
    };

    const {
        value: parsedRecording,
        loading: isParsingRecording,
        error: parsingRecordingError,
    } = usePromise(recordingPromise);

    if (!recordingPromise) {
        return (
            <main className="grid h-screen place-items-center">
                <div className="absolute top-8">
                    <Logo />
                </div>
                <div className="flex flex-col items-center">
                    <div className="mb-3 text-xl">Select a recording file to view</div>
                    <DropZone
                        description={
                            <>
                                Drop a recording file here or{' '}
                                <span className="underline">browse</span>
                            </>
                        }
                        accept=".gz"
                        onChange={e => handleSelctedFile(e.target.files?.[0])}
                    />
                    <Button asChild variant="secondary" className="mt-8">
                        <Link to="/recordings">
                            <ArrowLeft className="mr-3" />
                            Back to recordings
                        </Link>
                    </Button>
                </div>
            </main>
        );
    }

    if (isParsingRecording) {
        return (
            <main className="grid h-screen place-items-center">
                <div className="grid gap-2 place-items-center">
                    <Loader2 className="mb-2 animate-spin" />
                    <p>Loading recording...</p>
                </div>
            </main>
        );
    }

    if (!parsedRecording || parsingRecordingError) {
        return <main className="grid h-screen place-items-center">Could not parse recording</main>;
    }

    return (
        <main className="flex flex-col h-screen overflow-hidden">
            <RecordingProvider recording={parsedRecording.recording}>
                <RoomLayout
                    role="recorder"
                    roomInfo={parsedRecording.roomInfo}
                    roomNamePrefix="Recording"
                    backLink="/recordings"
                />
            </RecordingProvider>
        </main>
    );
};

export const Route = createFileRoute('/recordings/from-file')({
    component: () => (
        <AuthScreen>
            <RecordingFromFile />
        </AuthScreen>
    ),
});
