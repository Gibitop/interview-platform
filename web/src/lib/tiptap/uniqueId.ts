/*
    Copyright 2023 Thijs-Jan Huisman
    Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
    The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import {
    findChildren,
    combineTransactionSteps,
    getChangedRanges,
    findChildrenInRange,
    findDuplicates,
    Extension,
} from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Slice, Fragment, Node as ProseMirrorNode } from '@tiptap/pm/model';

export const uniqueId = Extension.create({
    name: 'unique-id',
    priority: 99999,
    addOptions: () => ({
        attributeName: 'id',
        types: [] as string[],
        createId: () => window.crypto.randomUUID(),
    }),
    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    [this.options.attributeName]: {
                        default: null,
                        parseHTML: element => element.getAttribute(this.options.attributeName),
                        renderHTML: attributes => {
                            if (!attributes[this.options.attributeName]) {
                                return {};
                            }

                            return {
                                [this.options.attributeName]:
                                    attributes[this.options.attributeName],
                            };
                        },
                    },
                },
            },
        ];
    },
    onCreate() {
        const { tr, doc } = this.editor.state;
        const { types, attributeName, createId } = this.options;

        findChildren(
            doc,
            node => types.includes(node.type.name) && node.attrs[attributeName] == null,
        ).forEach(({ node, pos }) => {
            console.log('createId on', node);
            tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                [attributeName]: createId(),
            });
        });

        this.editor.view.dispatch(tr);
    },
    addProseMirrorPlugins() {
        let dragSourceElement: HTMLElement | null = null;
        let transformPasted = false;

        return [
            new Plugin({
                key: new PluginKey('unique-id'),

                appendTransaction: (transactions, { doc: oldDoc }, { doc: newDoc, tr }) => {
                    if (!transactions.some(({ docChanged }) => docChanged) || oldDoc.eq(newDoc))
                        return;

                    const { types, attributeName, createId } = this.options;
                    // @ts-expect-error - Transactions is readonly
                    const transform = combineTransactionSteps(oldDoc, transactions);

                    // get changed ranges based on the old state
                    getChangedRanges(transform).forEach(({ newRange }) => {
                        // ! Always no new nodes
                        const newNodes = findChildrenInRange(newDoc, newRange, node =>
                            types.includes(node.type.name),
                        );
                        console.log('%cnewNodes', 'background-color: red;', newNodes);

                        const newIds = newNodes
                            .map(({ node }) => node.attrs[attributeName])
                            .filter(id => id !== null);

                        newNodes.forEach(({ node, pos }) => {
                            // Get state from document, not from node, because the node might be outdated
                            const id = tr.doc.nodeAt(pos)?.attrs[attributeName];

                            if (id === null) {
                                tr.setNodeMarkup(pos, undefined, {
                                    ...node.attrs,
                                    [attributeName]: createId(),
                                });

                                return;
                            }

                            // check if the node doesn’t exist in the old state
                            if (
                                transform.mapping.invert().mapResult(pos) &&
                                findDuplicates(newIds).includes(id)
                            ) {
                                tr.setNodeMarkup(pos, undefined, {
                                    ...node.attrs,
                                    [attributeName]: createId(),
                                });
                            }
                        });
                    });

                    if (!tr.steps.length) return;
                    return tr;
                },

                // we register a global drag handler to track the current drag source element
                view(view) {
                    const handleDragstart = (e: DragEvent) => {
                        dragSourceElement = view.dom.parentElement?.contains(e.target as Node)
                            ? view.dom.parentElement
                            : null;
                    };

                    // window.addEventListener('dragstart', handleDragstart);
                    window.addEventListener('dragstart', handleDragstart);

                    return {
                        destroy() {
                            window.removeEventListener('dragstart', handleDragstart);
                        },
                    };
                },

                props: {
                    // `handleDOMEvents` is called before `transformPasted`
                    // so we can do some checks before
                    handleDOMEvents: {
                        // only create new ids for dropped content while holding `alt`
                        // or content is dragged from another editor
                        drop: (view, event) => {
                            if (
                                dragSourceElement !== view.dom.parentElement ||
                                event.dataTransfer?.effectAllowed === 'copy'
                            ) {
                                dragSourceElement = null;
                                transformPasted = true;
                            }

                            return false;
                        },
                        // always create new ids on pasted content
                        paste: () => {
                            transformPasted = true;
                            return false;
                        },
                    },

                    // we’ll remove ids for every pasted node
                    // so we can create a new one within `appendTransaction`
                    transformPasted: slice => {
                        if (!transformPasted) return slice;

                        const { types, attributeName } = this.options;
                        const removeId = (fragment: Fragment) => {
                            const list: ProseMirrorNode[] = [];

                            fragment.forEach(node => {
                                // don’t touch text nodes
                                if (node.isText) {
                                    list.push(node);
                                    return;
                                }

                                // check for any other child nodes
                                if (!types.includes(node.type.name)) {
                                    list.push(node.copy(removeId(node.content)));
                                    return;
                                }

                                // remove id
                                list.push(
                                    node.type.create(
                                        {
                                            ...node.attrs,
                                            [attributeName]: null,
                                        },
                                        removeId(node.content),
                                        node.marks,
                                    ),
                                );
                            });

                            return Fragment.from(list);
                        };

                        // reset check
                        transformPasted = false;

                        return new Slice(removeId(slice.content), slice.openStart, slice.openEnd);
                    },
                },
            }),
        ];
    },
});
