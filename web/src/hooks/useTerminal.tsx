import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';

export const useTerminal = () => {
    const elRef = useRef<HTMLDivElement>(null);
    const terminalRef = useRef<Terminal | null>(null);

    useEffect(() => {
        terminalRef.current = new Terminal({ convertEol: true });

        const fitAddon = new FitAddon();
        terminalRef.current.loadAddon(fitAddon);
        fitAddon.fit();

        terminalRef.current!.open(elRef.current!);

        const resizeListener = () => {
            fitAddon.fit();
        };
        const ro = new ResizeObserver(resizeListener);
        const el = elRef.current!;
        ro.observe(el);

        return () => {
            terminalRef.current?.dispose();
            fitAddon.dispose();
            ro.unobserve(el);
            ro.disconnect();
        };
    }, []);

    return { elRef, terminalRef };
};
