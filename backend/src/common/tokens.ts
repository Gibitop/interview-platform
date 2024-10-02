import { readFile } from 'fs/promises';
import jwt from 'jsonwebtoken';

export const generateInsiderToken = async (roomId: string) =>
    jwt.sign({ roomId }, await readFile('./jwt-private-key.pem', 'utf-8'), {
        algorithm: 'RS256',
        expiresIn: '24h',
    });
