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

export const Editor = () => {
    const yjs = useYjs();
    const [monacoEditor, setMonacoEditor] = useState<editor.IStandaloneCodeEditor | null>(null);
    const { isHost, activeFile } = useRoomStore(s => ({
        isHost: s.isHost,
        activeFile: s.activeFile,
    }));

    const wc = useWebContainer(!isHost);

    useEffect(() => {
        if (!yjs || !monacoEditor) return;
        new MonacoBinding(
            yjs!.monacoTextType,
            monacoEditor.getModel()!,
            new Set([monacoEditor]),
            yjs!.awareness,
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

    return (
        <div className="flex flex-col h-full">
            <style dangerouslySetInnerHTML={styleSheet} />
            <div className="px-3 py-2 flex justify-between">
                {activeFile}
                <Button size="xs" variant="ghost" onClick={handleFormat}>
                    Format
                </Button>
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
