import argon2 from 'argon2';
import { env } from './env';
import { randomBytes } from 'crypto';

const secret = Buffer.from(env.HASHING_SECRET_HEX, 'hex');

export const hash = (password: string) =>
    argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 19 * 1024, // 19 MiB
        timeCost: 2,
        parallelism: 1,
        salt: randomBytes(32),
        secret,
    });

export const verify = (hash: string, password: string) => argon2.verify(hash, password, { secret });
