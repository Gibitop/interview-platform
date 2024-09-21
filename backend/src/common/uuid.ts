export const humanIdToUuid = (humanId: string) =>
    [
        humanId.slice(0, 8),
        humanId.slice(8, 12),
        humanId.slice(12, 16),
        humanId.slice(16, 20),
        humanId.slice(20),
    ].join('-');

export const uuidToHumanId = (uuid: string) => uuid.replace(/-/g, '');
