import { create } from 'zustand';

export type TRoomParticipantRole = 'host' | 'interviewee';

export type TRoom = {
    roomId: string;
    myUsername: string;
    isHost: boolean;
    activeFile: string;
};

export const defaultRoom: TRoom = {
    roomId: '',
    myUsername: '',
    isHost: false,
    activeFile: 'index.js',
};

export const useRoomStore = create<TRoom>(() => structuredClone(defaultRoom));
