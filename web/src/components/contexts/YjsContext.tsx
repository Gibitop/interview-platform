import React, { createContext, useContext, useEffect, useState } from 'react';
import { WebrtcProvider } from 'y-webrtc';
import * as Y from 'yjs';

export type TYjsProviderProps = {
    roomId: string;
    children: React.ReactNode;
};

type TYjsContext = {
    document: Y.Doc;
    provider: WebrtcProvider;
    monacoTextType: Y.Text;
    terminalTextType: Y.Text;
    activeFileTextType: Y.Text;
} | null;

const yjsContext = createContext<TYjsContext>(null);

export const YjsProvider: React.FC<TYjsProviderProps> = ({ children, roomId }) => {
    const [value, setValue] = useState<TYjsContext>(null);

    useEffect(() => {
        const document = new Y.Doc({ shouldLoad: true });
        const provider = new WebrtcProvider(roomId, document, {
            signaling: [window.location.origin.replace('http', 'ws') + '/ws'],
        });

        const monacoTextType = document.getText('monaco');
        const terminalTextType = document.getText('terminal');
        const activeFileTextType = document.getText('activeFile');

        setValue({
            document,
            provider,
            monacoTextType,
            terminalTextType,
            activeFileTextType,
        });

        return () => {
            document.destroy();
            provider.destroy();
            setValue(null);
        };
    }, [roomId]);

    return <yjsContext.Provider value={value}>{children}</yjsContext.Provider>;
};

export const useYjs = () => useContext(yjsContext);
