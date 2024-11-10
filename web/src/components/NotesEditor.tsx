import { useEditor, EditorContent, Extension, Editor } from '@tiptap/react';
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

const UNIQUE_ID_ATTRIBUTE = 'data-uid';

const extensions = [
    StarterKit,
    myExtension,
    uniqueId.configure({
        attributeName: UNIQUE_ID_ATTRIBUTE,
        types: ['paragraph', 'heading', 'orderedList', 'bulletList', 'listItem'],
    }),
];
const content = '<p>Hello World! 🌍️</p>'.repeat(1);

const getPathPosition = (editor: Editor, pos: number) => {
    const { node, offset } = editor.view.domAtPos(pos);
    if (!node) return null;

    const path: string[] = [];
    let iteratedNode = node;

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const parent = iteratedNode.parentNode;
        if (!parent) break;

        const nodeId = iteratedNode.parentElement?.getAttribute(UNIQUE_ID_ATTRIBUTE);
        if (nodeId) path.unshift(nodeId);

        iteratedNode = parent;
    }

    return { path, offset };
};

const pathPositionToGlobalPosition = (
    editor: Editor,
    { path, offset }: Exclude<ReturnType<typeof getPathPosition>, null>,
) => {
    let out = 0;
    for (let i = path.length - 1; i >= 0; i--) {
        const node = editor.view.dom.querySelector(`[${UNIQUE_ID_ATTRIBUTE}="${path[i]}"]`);
        if (!node) continue;

        if (i === path.length - 1) {
            out = offset;
        } else {
            out = editor.view.posAtDOM(node, 0);
        }
        break;
    }

    return out;
};

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
            console.log('Selection changed', {
                anchor: getPathPosition(editor, editor.state.selection.anchor),
                head: getPathPosition(editor, editor.state.selection.head),
            });
        },
    });

    const handleDebugInsert = () => {
        if (!editor) return;

        const pathSelection = {
            anchor: getPathPosition(editor, editor.state.selection.anchor),
            head: getPathPosition(editor, editor.state.selection.head),
        };

        editor.commands.insertContentAt(0, '<p>Debug insert</p>');

        editor.commands.setTextSelection({
            from: pathSelection.anchor
                ? pathPositionToGlobalPosition(editor, pathSelection.anchor)
                : 0,
            to: pathSelection.head ? pathPositionToGlobalPosition(editor, pathSelection.head) : 0,
        });
    };

    const handleDebugPrintSelection = () => {
        console.log(editor?.getHTML());
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
