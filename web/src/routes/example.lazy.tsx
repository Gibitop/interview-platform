import { createLazyFileRoute } from '@tanstack/react-router';
import { files } from '../files';
import { useEffect, useState } from 'react';
import { useTerminal } from '../hooks/useTerminal';
import { useWebContainer } from '../hooks/useWebContainer';
import '@xterm/xterm/css/xterm.css';
import { Editor, OnMount } from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { MonacoBinding } from 'y-monaco';
import type { Options as SimplePeerOptions } from 'simple-peer';

const ydocument = new Y.Doc();
const provider = new WebrtcProvider('your-room-name', ydocument, {
    password: 'optional-room-password',
    signaling: ['ws://127.0.0.1:4444'],
    filterBcConns: false,
    peerOpts: {} satisfies SimplePeerOptions,
});
const type = ydocument.getText('monaco');

export const Route = createLazyFileRoute('/example')({
    component: Index,
});

function Index() {
    const [iframeSrc, setIframeSrc] = useState('loading.html');

    const { elRef, terminalRef } = useTerminal();
    const webContainer = useWebContainer();

    useEffect(() => {
        if (!webContainer) return;

        (async () => {
            console.log('Mounting files');
            await webContainer.mount(files).catch(console.error);
            console.log('Mounting files finished');

            webContainer.on('server-ready', (_port, url) => {
                setIframeSrc(url);
            });

            const shellProcess = await webContainer.spawn('jsh');
            shellProcess.output.pipeTo(
                new WritableStream({
                    write(data) {
                        console.log('output', { data });
                        terminalRef.current?.write(data);
                    },
                }),
            );

            const input = shellProcess.input.getWriter();
            terminalRef.current?.onData(data => {
                console.log('input', { data });
                input.write(data);
            });
        })();
    }, [terminalRef, webContainer]);

    const handleSetTextAreaValue = (newContent: string) => {
        webContainer?.fs.writeFile('/index.js', newContent);
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleMonacoMount: OnMount = (editor, monaco) => {
        // By default, monaco use the "value" property to create its own model without
        // any extensions, so typescript assumes ".ts"
        // We need to create a custom model using the desired file name (uri).
        // See the last arg.
        const codeModel = monaco.editor.createModel(
            '',
            'typescript',
            // Typescript must see the 'file' it is editing as having a .tsx extension
            monaco.Uri.file('foo.tsx'), // Pass the file name to the model here.
        );

        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            // 2 = react
            jsx: 2,
        });
        monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: false,
            noSyntaxValidation: false,
        });
        editor.setModel(codeModel);

        new MonacoBinding(type, editor.getModel()!, new Set([editor]), provider.awareness);
    };

    return (
        <div className="h-screen w-full flex flex-col">
            <div className="flex gap-4 w-full flex-1">
                <Editor
                    theme="vs-dark"
                    onChange={val => handleSetTextAreaValue(val || '')}
                    onMount={handleMonacoMount}
                />
                <iframe className="w-full h-full" src={iframeSrc}></iframe>
            </div>
            <div className="flex-1" ref={elRef} />
        </div>
    );
}
