import { Editor as MonacoEditor, OnMount } from '@monaco-editor/react';
import { MonacoBinding } from 'y-monaco';
import { useYjs } from './contexts/YjsContext';
import { useEffect, useMemo, useState } from 'react';
import type { editor } from 'monaco-editor';
import { useWebContainer } from '~/hooks/useWebContainer';
import { useRoomStore } from '~/stores/room';
import { useUsers } from './contexts/UsersContext';
import { Button } from './ui/button';
import prettier from 'prettier/standalone';
import prettierPluginEstree from 'prettier/plugins/estree';
import prettierPluginTypeScript from 'prettier/plugins/typescript';
import { FilePicker } from './FilePicker';

export const Editor = () => {
    const yjs = useYjs();
    const [monacoEditor, setMonacoEditor] = useState<editor.IStandaloneCodeEditor | null>(null);
    const { isHost, activeFile } = useRoomStore(s => ({
        isHost: s.isHost,
        activeFile: s.activeFile,
    }));

    const wc = useWebContainer(!isHost);

    // Connect Yjs to Monaco
    useEffect(() => {
        if (!yjs || !monacoEditor) return;
        new MonacoBinding(
            yjs!.monacoTextType,
            monacoEditor.getModel()!,
            new Set([monacoEditor]),
            yjs!.provider.awareness,
        );
    }, [yjs, monacoEditor]);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleMonacoMount: OnMount = (editor, monaco) => {
        setMonacoEditor(editor);

        // By default, monaco use the "value" property to create its own model without
        // any extensions, so typescript assumes ".ts"
        // We need to create a custom model using the desired file name (uri).
        // See the last arg.
        const codeModel = monaco.editor.createModel(
            '',
            'typescript',
            // Typescript must see the 'file' it is editing as having a .tsx extension
            monaco.Uri.file('file.tsx'), // Pass the file name to the model here.
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
    };

    // Sync the active file with Yjs
    useEffect(() => {
        if (!yjs) return;

        const listener: Parameters<typeof yjs.activeFileTextType.observe>[0] = () => {
            useRoomStore.setState({ activeFile: yjs.activeFileTextType.toString() });
        };
        yjs.activeFileTextType.observe(listener);

        // Only host can change the active file
        if (
            isHost &&
            yjs.provider.room?.synced &&
            activeFile !== yjs.activeFileTextType.toString()
        ) {
            yjs.activeFileTextType.delete(0, yjs.activeFileTextType.toString().length);
            yjs.activeFileTextType.insert(0, activeFile);
        }

        return () => {
            yjs.activeFileTextType.unobserve(listener);
        };
    }, [activeFile, isHost, yjs]);

    // Prettier formatting
    const handleFormat = () => {
        if (!monacoEditor) return;
        prettier
            .format(monacoEditor.getValue(), {
                parser: 'typescript',
                semi: true,
                printWidth: 100,
                singleQuote: true,
                trailingComma: 'all',
                arrowParens: 'avoid',
                plugins: [prettierPluginEstree, prettierPluginTypeScript],
            })
            .then(formatted => monacoEditor.setValue(formatted));
    };

    // Add user cursors
    const users = useUsers();
    const styleSheet = useMemo(() => {
        let cursorStyles = '';

        for (const { id, name, color } of users) {
            cursorStyles += `
                .yRemoteSelection-${id},
                .yRemoteSelectionHead-${id}  {
                    --user-color: ${color};
                }
                .yRemoteSelectionHead-${id}::after {
                    content: "${name}";
                }
            `;
        }

        return { __html: cursorStyles };
    }, [users]);

    // Change the active file and follow external changes
    useEffect(() => {
        if (!wc || !monacoEditor || !activeFile) return;

        (async () => {
            let activeFileContent = await wc.fs.readFile(activeFile).catch(() => {
                wc.fs.writeFile(activeFile, '');
                return '';
            });
            if (activeFileContent instanceof Uint8Array) {
                activeFileContent = new TextDecoder().decode(activeFileContent);
            }

            // If host reloads, when the wc is ready, the file will be read and it will be empty
            // This will overwrite the editor content with an empty string, deleting the work
            // If we check if the file is empty, we can avoid this
            // But when we open an empty file next, we will copy the editor content to the file
            // Which is not ideal, but better than losing the work

            // Don't overwrite the editor content if the local file is empty
            if (activeFileContent) {
                monacoEditor.setValue(activeFileContent);
            }

            wc.fs.watch(activeFile, async event => {
                if (event === 'change') {
                    activeFileContent = await wc.fs.readFile(activeFile);
                    if (activeFileContent instanceof Uint8Array) {
                        activeFileContent = new TextDecoder().decode(activeFileContent);
                    }
                    if (activeFileContent.toString() !== monacoEditor.getValue()) {
                        monacoEditor.setValue(activeFileContent.toString() || '');
                    }
                }
            });
        })();
    }, [activeFile, monacoEditor, wc]);

    return (
        <div className="flex flex-col h-full">
            <style dangerouslySetInnerHTML={styleSheet} />
            <div className="px-3 py-2 flex justify-between">
                {isHost ? <FilePicker /> : activeFile}
                <div className="flex gap-3">
                    {isHost && (
                        <Button
                            size="xs"
                            variant="secondary"
                            onClick={() =>
                                monacoEditor &&
                                wc?.fs.writeFile(activeFile, monacoEditor.getValue())
                            }
                        >
                            Force save
                        </Button>
                    )}
                    <Button size="xs" variant="secondary" onClick={handleFormat}>
                        Format
                    </Button>
                </div>
            </div>
            <MonacoEditor
                theme="vs-dark"
                onMount={handleMonacoMount}
                onChange={val => wc?.fs.writeFile(activeFile, val || '')}
                options={{ fontSize: 14, minimap: { enabled: false } }}
            />
        </div>
    );
};
