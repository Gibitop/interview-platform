import { useTerminal } from '~/hooks/useTerminal';
import { useYjs } from './contexts/YjsContext';
import { useEffect } from 'react';
import '@xterm/xterm/css/xterm.css';
import { useWebContainer } from '~/hooks/useWebContainer';
import { useRoomStore } from '~/stores/room';

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

            // terminalRef.current.onData(data => {
            //     yjs.terminalTextType.insert(yjs.terminalTextType.length, data);
            // });
        }

        return () => {
            yjs.terminalTextType.unobserve(observer);
        };
    }, [terminalRef, yjs, wc, isHost]);

    return <div className="h-full" ref={elRef} />;
};
