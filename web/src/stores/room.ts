import { create } from 'zustand';

export type TRoom = {
    roomId: string;
} & (
    | {
          role: 'candidate';
          name: string;
      }
    | {
          role: 'host';
          isSpectator: boolean;
          token: string;
      }
);

export const useRoomStore = create<TRoom | null>(() => null);
