import { useMemo } from 'react';
import { Socket } from 'socket.io-client';
import { S2CEvent } from '~insider/eventNames';
import { RecordedEvent } from '~insider/types/recording';

export const useMockSocket = () =>
    useMemo(() => {
        type EventListener = (...args: unknown[]) => void | Promise<void>;
        const eventListenersMap = new Map<S2CEvent, Set<EventListener>>();

        const mockSocket = {
            connected: true,
            on: (event: S2CEvent, listener: EventListener) => {
                if (eventListenersMap.has(event)) {
                    eventListenersMap.get(event)!.add(listener);
                } else {
                    eventListenersMap.set(event, new Set([listener]));
                }
            },
            off: (event: S2CEvent, listener: EventListener) => {
                eventListenersMap.get(event)?.delete(listener);
            },
            emit: () => {},
        } as unknown as Socket;

        const receiveEvent = (event: RecordedEvent['event'], ...args: RecordedEvent['args']) => {
            eventListenersMap.get(event)?.forEach(listener => listener(...args));
        };

        return { mockSocket, receiveEvent };
    }, []);
