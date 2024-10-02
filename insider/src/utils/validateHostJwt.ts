import jwt from 'jsonwebtoken';
import { readFile } from 'fs/promises';

export const validateBackendJwt = async (token: string): Promise<boolean> => {
    try {
        const parsed: (jwt.JwtPayload & { roomId?: string }) | string = jwt.verify(
            token,
            await readFile('./jwt-public-key.pem', 'utf-8'),
            { algorithms: ['RS256'] }
        );
        if (typeof parsed !== 'object') return false;


        return true;

        // TODO: Think how to uncomment this validation without hurting the dev experience
        // Currently, the env.ROOM_INFO is static and id does not match rooms we create

        // return parsed.roomId === env.ROOM_INFO.id;
    } catch (e) {
        return false;
    }
}
