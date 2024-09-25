import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';

export const useXterm = () => {
    const elRef = useRef<HTMLDivElement>(null);
    const terminalRef = useRef<Terminal | null>(null);

    useEffect(() => {
        terminalRef.current = new Terminal({
            convertEol: true,
            cols: 80,
            theme: {
                foreground: '#cccccc',
                background: '#1e1e1e',
                cursor: '#ffffff',
                black: '#000000',
                brightBlack: '#666666',
                red: '#cd3131',
                brightRed: '#f14c4c',
                green: '#0dbc79',
                brightGreen: '#23d18b',
                yellow: '#e5e510',
                brightYellow: '#f5f543',
                blue: '#2472c8',
                brightBlue: '#3b8eea',
                magenta: '#bc3fbc',
                brightMagenta: '#d670d6',
                cyan: '#11a8cd',
                brightCyan: '#29b8db',
                white: '#e5e5e5',
                brightWhite: '#e5e5e5',
            },
        });

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
