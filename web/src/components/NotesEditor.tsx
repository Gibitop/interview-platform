import { useEditor, EditorContent, Extension } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button } from './ui/button';
import { uniqueId } from '~/lib/tiptap/uniqueId';

const myExtension = Extension.create({
    name: 'myExtension',
    priority: 100,
    addOptions() {
        const user = {
            name: 'Other user',
            color: 'red',
        };
        return {
            render() {
                const cursor = document.createElement('span');

                cursor.classList.add('collaboration-cursor__caret');
                cursor.setAttribute('style', `border-color: ${user.color}`);

                const label = document.createElement('div');

                label.classList.add('collaboration-cursor__label');
                label.setAttribute('style', `background-color: ${user.color}`);
                label.insertBefore(document.createTextNode(user.name), null);
                cursor.insertBefore(label, null);

                return cursor;
            },
        };
    },
});

const extensions = [StarterKit, myExtension, uniqueId];
const content = '<p>Hello World! 🌍️</p>'.repeat(1);

export const NotesEditor = () => {
    const editor = useEditor({
        extensions,
        content,
        editorProps: {
            attributes: {
                class: '!static overflow-y-auto h-full px-3 focus:outline-none',
            },
        },
        onUpdate: ({ editor }) => {
            console.log('content changed', editor.getHTML());
        },
        onSelectionUpdate: ({ editor }) => {
            console.log('selection changed', editor?.state.selection.toJSON());
        },
    });

    const handleDebugInsert = () => {
        if (!editor) return;

        const { anchor, head } = editor.state.selection;

        editor.commands.setContent('<p>Debug insert</p>', false);
        editor.commands.setTextSelection({ from: anchor, to: head });
    };

    const handleDebugPrintSelection = () => {
        console.log(editor?.state.selection.toJSON());
    };

    return (
        <div className="flex flex-col h-full">
            <div className="px-3 py-2 flex justify-between items-center min-h-11">
                <div>Notes</div>
                <div className="ml-3 space-x-3">
                    <span className="text-sm opacity-50">Candidates can't see this</span>
                    <Button size="xs" variant="secondary" onClick={handleDebugInsert}>
                        Debug insert
                    </Button>
                    <Button size="xs" variant="secondary" onClick={handleDebugPrintSelection}>
                        Debug print selection
                    </Button>
                </div>
            </div>
            <div
                className="flex-1 max-w-full bg-[#1e1e1e] dark:prose-invert prose prose-base prose-neutral prose-headings:mt-4 prose-p:my-2 leading-5"
                // 44px = h-11 from the title bar
                style={{ height: `calc(100% - 44px)` }}
            >
                <EditorContent editor={editor} className="h-full" />
            </div>
        </div>
    );
};
