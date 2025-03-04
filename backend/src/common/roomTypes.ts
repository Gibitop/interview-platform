export const ROOM_TYPES = [
    'node',
    'java',
    'golang',
    'python3',
] as const;

export type TRoomType = typeof ROOM_TYPES[number];

export const IMAGES: Record<TRoomType, string> = {
    node: 'ghcr.io/gibitop/interview-platform-insider-node',
    java: 'ghcr.io/gibitop/interview-platform-insider-java',
    golang: 'ghcr.io/gibitop/interview-platform-insider-golang',
    python3: 'ghcr.io/gibitop/interview-platform-insider-python3',
} as const;
