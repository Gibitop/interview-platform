import SuperJSON from 'superjson';

SuperJSON.registerCustom<Uint8Array, string>(
    {
        isApplicable: v => v instanceof Uint8Array,
        serialize: v => {
            let str = '';
            for (let i = 0; i < v.byteLength; i++) {
                str += String.fromCharCode(v[i]!);
            }
            return btoa(str);
        },
        deserialize: v => {
            const binaryString = atob(v);
            const bytes = new Uint8Array(binaryString.length);

            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            return bytes;
        },
    },
    'Uint8Array',
);

export default SuperJSON;
