import { useTerminal } from '~/hooks/useTerminal';
import { useYjs } from './contexts/YjsContext';
import { useEffect, useRef } from 'react';
import '@xterm/xterm/css/xterm.css';
import { useWebContainer } from '~/hooks/useWebContainer';
import { useRoomStore } from '~/stores/room';
import { Button } from './ui/button';

export const Terminal = () => {
    const yjs = useYjs();
    const { elRef, terminalRef } = useTerminal();
    const isHost = useRoomStore(s => s.isHost);

    const wc = useWebContainer(!isHost);

    useEffect(() => {
        if (!yjs || !terminalRef.current) return;
        if (isHost && !wc) return;

        let observer: Parameters<typeof yjs.terminalTextType.observe>[0];
        if (isHost && wc) {
            (async () => {
                const process = await wc.spawn('jsh');
                process.output.pipeTo(
                    new WritableStream({
                        write(data) {
                            yjs.terminalTextType.insert(yjs.terminalTextType.length, data);
                            terminalRef.current?.write(data);
                        },
                    }),
                );

                const input = process.input.getWriter();
                terminalRef.current?.onData(data => {
                    input.write(data);
                });
            })();
        } else {
            observer = event => {
                if (!terminalRef.current) return;

                event.changes.delta.forEach(change => {
                    if (!change.insert) return;
                    if (Array.isArray(change.insert)) return;
                    terminalRef.current!.write(change.insert);
                });
            };
            yjs.terminalTextType.observe(observer);
        }

        return () => {
            yjs.terminalTextType.unobserve(observer);
        };
    }, [terminalRef, yjs, wc, isHost]);

    const uploadInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async () => {
        if (!uploadInputRef.current?.files?.length || !wc) return;
        for (const file of uploadInputRef.current.files) {
            const reader = new FileReader();
            reader.onload = async () => {
                const data = new Uint8Array(reader.result as ArrayBuffer);
                wc.fs.writeFile(file.name, data);
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
                            disabled={!wc}
                            size="xs"
                            variant="secondary"
                            onClick={() => uploadInputRef.current?.click()}
                        >
                            Upload
                        </Button>
                    )}
                </div>
            </div>
            <div className="hidden @[250px]:block h-full">
                <div className="h-full" ref={elRef} />
            </div>
        </>
    );
};
