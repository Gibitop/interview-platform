import SuperJSON from '~/lib/super-json';
import { Recording } from '~insider/types/recording';

export const parseRecordingFile = async (data?: Uint8Array) => {
    if (!data) return;

    const dc = new DecompressionStream('gzip');
    const writer = dc.writable.getWriter();
    writer.write(data);
    writer.close();

    const chunks = [];
    const reader = dc.readable.getReader();
    try {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
        }
    } finally {
        reader.releaseLock();
    }

    const blob = new Blob(chunks);
    const buffer = await blob.arrayBuffer();
    const stringBytes = new Uint8Array(buffer);

    // Convert the bytes to a string.
    const decompressed = new TextDecoder().decode(stringBytes);

    return SuperJSON.parse<Recording>(decompressed);
};
