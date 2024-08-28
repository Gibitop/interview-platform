import { useXterm } from '~/hooks/useXterm';
import { useEffect, useRef } from 'react';
import { Button } from './ui/button';
import '@xterm/xterm/css/xterm.css';
import { useRoomContext } from './contexts/useRoomContext';

export const Terminal = () => {
    const { elRef, terminalRef } = useXterm();

    const isHost = false;

    const roomContext = useRoomContext();

    useEffect(() => {
        if (!roomContext || !terminalRef.current) return;

        const outputListener = (data: string) => {
            terminalRef.current?.write(data);
        };
        roomContext.addTerminalOutputListener(outputListener);

        const inputListener = terminalRef.current.onData(data => {
            roomContext.writeToTerminal(data);
        });

        return () => {
            inputListener.dispose();
            roomContext.removeTerminalOutputListener(outputListener);
        };
    }, [roomContext, terminalRef]);

    const uploadInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async () => {
        if (!uploadInputRef.current?.files?.length) return;
        for (const file of uploadInputRef.current.files) {
            const reader = new FileReader();
            reader.onload = async () => {
                const data = new Uint8Array(reader.result as ArrayBuffer);
                // TODO: upload
            };
            reader.readAsArrayBuffer(file);
        }
        uploadInputRef.current.files = null;
    };

    return (
        <>
            <input
                ref={uploadInputRef}
                multiple
                type="file"
                className="hidden"
                onChange={handleUpload}
            />
            <div className="px-3 py-2 flex justify-between">
                {isHost ? 'Terminal (read-write)' : 'Terminal (read-only)'}
                <div className="flex gap-3">
                    {isHost && (
                        <Button
                            size="xs"
                            variant="secondary"
                            onClick={() => uploadInputRef.current?.click()}
                        >
                            Upload
                        </Button>
                    )}
                </div>
            </div>
            <div className="h-full">
                {/* 740px = 80 cols */}
                <div className="h-full w-[740px]" ref={elRef} />
            </div>
        </>
    );
};
