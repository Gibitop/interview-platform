import type { ROOM_TYPES as roomTypesArray } from '~backend/common/roomTypes';

export const ROOM_TYPES: typeof roomTypesArray = ['node', 'java', 'golang', 'python3'];

export const ROOM_TYPE_NAMES: Record<(typeof ROOM_TYPES)[number], string> = {
    node: 'JavaScript: Node.js 22',
    java: 'Java: OpenJDK 21',
    golang: 'Go: Golang 1.24',
    python3: 'Python 3',
};
