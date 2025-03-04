import { z } from "zod";
import { implement } from "../utils/implementWithZod";

export type Role = 'host' | 'candidate' | 'spectator' | 'recorder';

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
    notes?: {
        selection: {
            anchor: {
                path: string[];
                offset: number;
            };
            head: {
                path: string[];
                offset: number;
            };
        };
    };
    isFocused: boolean;
};

export const zChangeMyUserRequest = implement<
    Partial<Pick<User, 'name' | 'selection' | 'isFocused' | 'notes'>>
>().with({
    name: z.string().optional(),
    selection: implement<Exclude<User['selection'], undefined>>().with({
        startLine: z.number(),
        startChar: z.number(),
        endLine: z.number(),
        endChar: z.number(),
    }).optional(),
    notes: implement<Exclude<User['notes'], undefined>>().with({
        selection: implement<Exclude<Exclude<User['notes'], undefined>['selection'], null>>().with({
            anchor: implement<Exclude<Exclude<User['notes'], undefined>['selection']['anchor'], null>>().with({
                path: z.array(z.string()),
                offset: z.number(),
            }),
            head: implement<Exclude<Exclude<User['notes'], undefined>['selection']['head'], null>>().with({
                path: z.array(z.string()),
                offset: z.number(),
            }),
        }),
    }).optional(),
    isFocused: z.boolean().optional(),
});

export type ChangeMyUserRequest = z.infer<typeof zChangeMyUserRequest>;