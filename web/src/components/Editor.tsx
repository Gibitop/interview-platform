import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import { Editor as MonacoEditor, OnMount, loader } from '@monaco-editor/react';
import { useEffect, useMemo, useState } from 'react';
import type { editor } from 'monaco-editor';
import { Button } from './ui/button';
import prettier from 'prettier/standalone';
import prettierPluginEstree from 'prettier/plugins/estree';
import prettierPluginTypeScript from 'prettier/plugins/typescript';
import { useRoomContext } from './contexts/useRoomContext';

import { getSingletonHighlighter } from 'shiki/bundle/web';
import { shikiToMonaco } from '@shikijs/monaco';

import reactDtsUrl from '~/../public/react.d.ts.txt';
import { FilePicker } from './FilePicker';
import debounce from 'lodash/debounce';
import { Role } from '~insider/types/users';
import { BuiltInParserName } from 'prettier';

// Don't use CDN
self.MonacoEnvironment = {
    async getWorker(_, label) {
        if (label === 'typescript' || label === 'javascript') {
            return new tsWorker();
        }
        return new editorWorker();
    },
};
loader.config({ monaco });

// Create the highlighter, it can be reused
getSingletonHighlighter({
    themes: ['dark-plus'],
    langs: ['javascript', 'typescript', 'jsx', 'tsx', 'json', 'java'],
}).then(highlighter => shikiToMonaco(highlighter, monaco));

const format = async (text: string, lang: string) =>
    prettier.format(text, {
        parser: lang,
        semi: true,
        tabWidth: 4,
        printWidth: 100,
        singleQuote: true,
        trailingComma: 'all',
        arrowParens: 'avoid',
        plugins: [prettierPluginEstree, prettierPluginTypeScript],
    });

// Prettier does not have a built-in parser for all languages, here are some supported extensions
const extensionToBuiltInParserName: Record<string, BuiltInParserName> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'typescript',
    jsx: 'typescript',
};

const monacoPrettier: monaco.languages.DocumentRangeFormattingEditProvider &
    monaco.languages.DocumentFormattingEditProvider = {
    async provideDocumentFormattingEdits(model: monaco.editor.ITextModel) {
        const text = model.getValue();
        const formatted = await format(
            text,
            extensionToBuiltInParserName[model.uri.path.split('.').at(-1) ?? 'txt'] ?? 'text',
        );
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
        const formatted = await format(
            text,
            extensionToBuiltInParserName[model.uri.path.split('.').at(-1) ?? 'txt'] ?? 'text',
        );
        return [
            {
                range,
                text: formatted,
            },
        ];
    },
};

monaco.languages.registerDocumentRangeFormattingEditProvider(
    ['typescript', 'javascript', 'jsx', 'tsx', 'json'],
    monacoPrettier,
);
monaco.languages.registerDocumentFormattingEditProvider(
    ['typescript', 'javascript', 'jsx', 'tsx', 'json'],
    monacoPrettier,
);

export type EditorProps = {
    role: Role;
    usernameCursorsVisible: boolean;
};

const setupMonacoModel = (
    monaco: Parameters<OnMount>[1],
    editor: editor.IStandaloneCodeEditor,
    extension: string,
    value = '',
) => {
    if (['ts', 'tsx', 'js', 'jsx'].includes(extension)) {
        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.Latest,
            allowNonTsExtensions: true,
            moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            module: monaco.languages.typescript.ModuleKind.ESNext,
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
            value,
            'typescript',
            // Typescript must see the 'file' it is editing as having a .tsx extension
            monaco.Uri.parse('file:///main.tsx'), // Pass the file name to the model here.
        );

        editor.setModel(codeModel);
        return;
    }

    if (extension === 'java') {
        const codeModel = monaco.editor.createModel(
            value,
            'java',
            monaco.Uri.parse('file:///Main.java'), // Pass the file name to the model here.
        );

        editor.setModel(codeModel);
        return;
    }

    if (extension === 'json') {
        const codeModel = monaco.editor.createModel(
            value,
            'json',
            monaco.Uri.parse('file:///main.json'), // Pass the file name to the model here.
        );

        editor.setModel(codeModel);
        return;
    }

    if (extension === 'go') {
        const codeModel = monaco.editor.createModel(
            value,
            'go',
            monaco.Uri.parse('file:///main.go'), // Pass the file name to the model here.
        );

        editor.setModel(codeModel);
        return;
    }

    if (extension === 'py') {
        const codeModel = monaco.editor.createModel(
            value,
            'python',
            monaco.Uri.parse('file:///main.py'), // Pass the file name to the model here.
        );

        editor.setModel(codeModel);
        return;
    }

    const codeModel = monaco.editor.createModel(
        value,
        'plaintext',
        monaco.Uri.parse('file:///main.txt'), // Pass the file name to the model here.
    );

    editor.setModel(codeModel);
};

export const Editor = ({ role, usernameCursorsVisible }: EditorProps) => {
    const [monacoEditor, setMonacoEditor] = useState<editor.IStandaloneCodeEditor | null>(null);

    const roomContext = useRoomContext();
    const changeMyUser = roomContext?.changeMyUser;
    const extension = roomContext?.activeFilePath.split('.').at(-1) ?? 'txt';

    // Send cursor position to the server
    useEffect(() => {
        if (!changeMyUser || !monacoEditor) return;

        const debouncedSendCursor = debounce((e: editor.ICursorSelectionChangedEvent) => {
            changeMyUser({
                selection: {
                    startLine: e.selection.startLineNumber,
                    startChar: e.selection.startColumn,
                    endLine: e.selection.endLineNumber,
                    endChar: e.selection.endColumn,
                },
            });
        }, 20);

        const disposable = monacoEditor.onDidChangeCursorSelection(debouncedSendCursor);

        return () => {
            disposable.dispose();
        };
    }, [changeMyUser, monacoEditor]);

    // Draw user cursors
    useEffect(() => {
        if (!roomContext?.users || !monacoEditor) return;

        const decorations: monaco.editor.IModelDeltaDecoration[] = [];
        for (const { id, selection } of roomContext.users) {
            if (id === roomContext.myId) continue;

            decorations.push({
                options: {
                    stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
                    className: 'yRemoteSelection yRemoteSelection-' + id,
                    beforeContentClassName: 'yRemoteSelectionHead yRemoteSelectionHead-' + id,
                },
                range: new monaco.Range(
                    selection.startLine,
                    selection.startChar,
                    selection.endLine,
                    selection.endChar,
                ),
            });
        }

        const collection = monacoEditor.createDecorationsCollection(decorations);

        return () => {
            collection.clear();
        };
    }, [monacoEditor, roomContext?.users, roomContext?.myId]);

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

        setupMonacoModel(monaco, editor, extension, roomContext?.activeFileContent);
    };

    // Set the editor language, when active file extension changes
    useEffect(() => {
        if (!monacoEditor) return;

        const model = monacoEditor.getModel();
        const value = model?.getValue() ?? '';
        model?.dispose();

        setupMonacoModel(monaco, monacoEditor, extension, value);
    }, [extension, monacoEditor]);

    // Send active file content changes to the server
    useEffect(() => {
        if (!monacoEditor || !roomContext) return;

        const disposable = monacoEditor.onDidChangeModelContent(event => {
            if (roomContext.getActiveFileContent() === monacoEditor.getModel()?.getValue()) return;

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

        return () => {
            disposable.dispose();
        };
    }, [monacoEditor, roomContext]);

    // Read-only mode for spectators
    useEffect(() => {
        if (!monacoEditor) return;
        monacoEditor.updateOptions({
            readOnly: role === 'spectator' || role === 'recorder',
            readOnlyMessage: { value: "Can't edit code as a spectator" },
        });
    }, [role, monacoEditor]);

    // Other users cursors style
    const styleSheet = useMemo(() => {
        let cursorStyles = '';

        for (const { id, name, color } of roomContext?.users ?? []) {
            cursorStyles += `
                .yRemoteSelection-${id},
                .yRemoteSelectionHead-${id} {
                    --user-color: ${color};
                }
            `;
            if (usernameCursorsVisible) {
                cursorStyles += `
                    .yRemoteSelectionHead-${id}::after {
                        content: "${name}";
                    }
                `;
            }
        }

        return { __html: cursorStyles };
    }, [roomContext?.users, usernameCursorsVisible]);

    // Hack to keep the cursor position from jumping to the end of the file when other users edit the file
    useEffect(() => {
        const newContent = roomContext?.activeFileContent ?? '';
        if (newContent === monacoEditor?.getValue()) return;

        const selection = monacoEditor?.getSelection();
        if (!selection) return;

        monacoEditor?.setValue(newContent);
        monacoEditor?.setSelection(selection);
    }, [monacoEditor, roomContext?.activeFileContent]);

    return (
        <div className="flex flex-col h-full">
            <style dangerouslySetInnerHTML={styleSheet} />
            <div className="flex justify-between px-3 py-2 min-h-10">
                <FilePicker />
                <div className="flex gap-2">
                    {role !== 'recorder' && extensionToBuiltInParserName[extension] && (
                        <Button
                            size="xs"
                            variant="secondary"
                            onClick={() =>
                                monacoEditor?.getAction('editor.action.formatDocument')?.run()
                            }
                        >
                            Format
                        </Button>
                    )}
                </div>
            </div>
            <div className="flex-1" onContextMenu={e => e.preventDefault()}>
                <MonacoEditor
                    theme="dark-plus"
                    onMount={handleMonacoMount}
                    options={{ fontSize: 14, minimap: { enabled: false } }}
                />
            </div>
        </div>
    );
};
