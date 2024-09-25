import { pgTable, text, uuid } from "drizzle-orm/pg-core";

export const usersTable = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),

    username: text('username').notNull().unique(),
    hashedPassword: text('hashed_password').notNull(),
});
