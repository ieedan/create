import { text, sqliteTable } from 'drizzle-orm/sqlite-core';

export const fooTable = sqliteTable("foo", {
    bar: text("bar").notNull().default("Hey!"),
});

// Your schema definition can go here
// See docs for schemas in SQLite https://orm.drizzle.team/docs/get-started-sqlite