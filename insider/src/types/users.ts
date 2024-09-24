import { z } from "zod";
import { implement } from "../utils/implementWithZod";

export type Role = 'host' | 'candidate' | 'spectator';

export type User = {
    id: string;
    role: Role;
    name: string;
    color: string;
    selection: {
        startLine: number;
        startChar: number;
        endLine: number;
        endChar: number;
    };
    isFocused: boolean;
};

export const zChangeMyUserRequest = implement<
    Partial<Pick<User, 'name' | 'selection' | 'isFocused'>>
>().with({
    name: z.string().optional(),
    selection: implement<Exclude<User['selection'], null>>().with({
        startLine: z.number(),
        startChar: z.number(),
        endLine: z.number(),
        endChar: z.number(),
    }).optional(),
    isFocused: z.boolean().optional(),
});

export type ChangeMyUserRequest = z.infer<typeof zChangeMyUserRequest>;