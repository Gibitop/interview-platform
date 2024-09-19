export const ROOM_TYPES = [
    'node',
    // 'java'
] as const;

export type TRoomType = typeof ROOM_TYPES[number];

export const IMAGES: Record<TRoomType, string> = {
    node: 'ghcr.io/gibitop/interview-platform-insider-node',
    // java: 'insider-java',
} as const;
