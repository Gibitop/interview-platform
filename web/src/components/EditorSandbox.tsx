import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import { Editor as MonacoEditor, OnMount, loader } from '@monaco-editor/react';
import { useRef, useState } from 'react';

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

export const EditorSandbox = () => {
    const [value, setValue] = useState('');

    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

    // Save the editor instance when it mounts
    const handleEditorMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
        editorRef.current = editor;

        editor.onDidChangeCursorPosition(e => {
            console.log('Cursor position:', e.position);
        });
    };

    // Preserve cursor position when updating value
    const handleValueChange = (newValue?: string) => {
        if (editorRef.current) {
            const position = editorRef.current.getPosition(); // Get the current cursor position
            setValue(newValue ?? '');
            if (!position) return;
            setTimeout(() => {
                editorRef.current?.setPosition(position); // Restore the cursor position
                // editorRef.current?.focus(); // Focus back to the editor
            }, 0); // Restore after state update
        } else {
            setValue(newValue ?? '');
        }
    };

    return (
        <div className="flex flex-col h-full">
            <textarea
                className="bg-black"
                value={value}
                onChange={e => handleValueChange(e.target.value)}
            />
            <MonacoEditor
                theme="vs-dark"
                value={value}
                onChange={handleValueChange}
                onMount={handleEditorMount}
                options={{ fontSize: 14, minimap: { enabled: false } }}
            />
        </div>
    );
};
