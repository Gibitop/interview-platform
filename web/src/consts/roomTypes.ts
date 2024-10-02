import type { ROOM_TYPES as roomTypesArray } from '~backend/common/roomTypes';

export const ROOM_TYPES: typeof roomTypesArray = ['node'];

export const ROOM_TYPE_NAMES: Record<(typeof ROOM_TYPES)[number], string> = {
    node: 'Node.js',
};
