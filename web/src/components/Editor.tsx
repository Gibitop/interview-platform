import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import { Editor as MonacoEditor, OnMount, loader } from '@monaco-editor/react';
import { useEffect, useMemo, useState } from 'react';
import type { editor } from 'monaco-editor';
import { Button } from './ui/button';
import prettier from 'prettier/standalone';
import prettierPluginEstree from 'prettier/plugins/estree';
import prettierPluginTypeScript from 'prettier/plugins/typescript';
import { useRoomContext } from './contexts/RoomContext';

import { getHighlighter } from 'shiki/bundle/web';
import { shikiToMonaco } from '@shikijs/monaco';

import reactDtsUrl from '~public/react.d.ts.txt?url';
import { useRoomStore } from '~/stores/room';

// Don't use CDN
self.MonacoEnvironment = {
    async getWorker(_, label) {
        if (label === 'json') {
            return new jsonWorker();
        }
        if (label === 'css' || label === 'scss' || label === 'less') {
            return new cssWorker();
        }
        if (label === 'html' || label === 'handlebars' || label === 'razor') {
            return new htmlWorker();
        }
        if (label === 'typescript' || label === 'javascript') {
            return new tsWorker();
        }
        return new editorWorker();
    },
};
loader.config({ monaco });

// Create the highlighter, it can be reused
const highlighter = await getHighlighter({
    themes: ['dark-plus'],
    langs: ['javascript', 'typescript'],
});

shikiToMonaco(highlighter, monaco);

const format = async (text: string) =>
    prettier.format(text, {
        parser: 'typescript',
        semi: true,
        tabWidth: 4,
        printWidth: 100,
        singleQuote: true,
        trailingComma: 'all',
        arrowParens: 'avoid',
        plugins: [prettierPluginEstree, prettierPluginTypeScript],
    });

const monacoPrettier: monaco.languages.DocumentRangeFormattingEditProvider &
    monaco.languages.DocumentFormattingEditProvider = {
    async provideDocumentFormattingEdits(model: monaco.editor.ITextModel) {
        const text = model.getValue();
        const formatted = await format(text);
        return [
            {
                range: model.getFullModelRange(),
                text: formatted,
            },
        ];
    },
    async provideDocumentRangeFormattingEdits(
        model: monaco.editor.ITextModel,
        range: monaco.Range,
    ) {
        const text = model.getValueInRange(range);
        const formatted = await format(text);
        return [
            {
                range,
                text: formatted,
            },
        ];
    },
};

monaco.languages.registerDocumentRangeFormattingEditProvider(
    ['typescript', 'javascript', 'json'],
    monacoPrettier,
);
monaco.languages.registerDocumentFormattingEditProvider(
    ['typescript', 'javascript', 'json'],
    monacoPrettier,
);

export const Editor = () => {
    const [monacoEditor, setMonacoEditor] = useState<editor.IStandaloneCodeEditor | null>(null);

    const isSpectator = useRoomStore(data => data?.role === 'host' && data.isSpectator);
    const roomContext = useRoomContext();
    const changeMyAwareness = roomContext?.changeMyAwareness;

    // Send cursor position to the server
    useEffect(() => {
        if (!changeMyAwareness || !monacoEditor) return;

        monacoEditor.onDidChangeCursorPosition(e => {
            changeMyAwareness({
                line: e.position.lineNumber,
                char: e.position.column,
            });
        });
    }, [changeMyAwareness, monacoEditor]);

    // Draw user cursors
    useEffect(() => {
        if (!roomContext?.awareness || !monacoEditor) return;

        const decorations: monaco.editor.IModelDeltaDecoration[] = [];
        for (const { id, line, char } of roomContext.awareness) {
            if (id === roomContext.myId) continue;

            decorations.push({
                options: {
                    stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
                    className: 'yRemoteSelection yRemoteSelection-' + id,
                    beforeContentClassName: 'yRemoteSelectionHead yRemoteSelectionHead-' + id,
                },
                range: new monaco.Range(line, char, line, char),
            });
        }

        const collection = monacoEditor.createDecorationsCollection(decorations);

        return () => {
            collection.clear();
        };
    }, [monacoEditor, roomContext?.awareness, roomContext?.myId]);

    const handleMonacoMount: OnMount = (editor, monaco) => {
        setMonacoEditor(editor);

        editor.updateOptions({ contextmenu: false });

        // Could not find a way to detect the general copy behavior
        editor.onKeyDown(e => {
            const { keyCode, ctrlKey, metaKey } = e;

            // Ctrl / Cmd + C
            if ((metaKey || ctrlKey) && keyCode === monaco.KeyCode.KeyC) {
                roomContext?.reportCopy();
            }
        });

        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.Latest,
            allowNonTsExtensions: true,
            moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            module: monaco.languages.typescript.ModuleKind.CommonJS,
            noEmit: true,
            esModuleInterop: true,
            jsx: monaco.languages.typescript.JsxEmit.React,
            reactNamespace: 'React',
            allowJs: true,
            typeRoots: ['node_modules/@types'],
        });

        monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: false,
            noSyntaxValidation: false,
        });

        fetch(reactDtsUrl)
            .then(res => res.text())
            .then(reactDts => {
                monaco.languages.typescript.typescriptDefaults.addExtraLib(
                    reactDts,
                    `file:///node_modules/@types/react/index.d.ts`,
                );
            });

        // By default, monaco use the "value" property to create its own model without
        // any extensions, so typescript assumes ".ts"
        // We need to create a custom model using the desired file name (uri).
        // See the last arg.
        const codeModel = monaco.editor.createModel(
            '',
            'typescript',
            // Typescript must see the 'file' it is editing as having a .tsx extension
            monaco.Uri.parse('file:///main.tsx'), // Pass the file name to the model here.
        );

        editor.setModel(codeModel);

        editor.onDidChangeModelContent(event => {
            if (roomContext?.getActiveFileContent() === codeModel.getValue()) return;

            roomContext?.updateActiveFileContent((ins, del) => {
                event.changes
                    .sort((change1, change2) => change2.rangeOffset - change1.rangeOffset)
                    .forEach(change => {
                        if (change.rangeLength) {
                            del(change.rangeOffset, change.rangeLength);
                        }
                        if (change.text) {
                            ins(change.rangeOffset, change.text);
                        }
                    });
            });
        });
    };

    useEffect(() => {
        if (!monacoEditor) return;
        monacoEditor.updateOptions({
            readOnly: isSpectator,
            readOnlyMessage: { value: "Can't edit code as a spectator" },
        });
    }, [isSpectator, monacoEditor]);

    // Add user cursors
    const styleSheet = useMemo(() => {
        let cursorStyles = '';

        for (const { id, name, color } of roomContext?.awareness ?? []) {
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
    }, [roomContext?.awareness]);

    return (
        <div className="flex flex-col h-full">
            <style dangerouslySetInnerHTML={styleSheet} />
            <div className="px-3 py-2 flex justify-between">
                <div className="flex gap-2">
                    <Button
                        size="xs"
                        variant="secondary"
                        onClick={() =>
                            monacoEditor?.getAction('editor.action.formatDocument')?.run()
                        }
                    >
                        Format
                    </Button>
                </div>
            </div>
            <div className="flex-1" onContextMenu={e => e.preventDefault()}>
                <MonacoEditor
                    value={roomContext?.getActiveFileContent() || ''}
                    theme="dark-plus"
                    onMount={handleMonacoMount}
                    options={{ fontSize: 14, minimap: { enabled: false } }}
                />
            </div>
        </div>
    );
};
