import { migrate } from 'drizzle-orm/libsql/migrator';
import { db } from './src/lib/db/db';

migrate(db, { migrationsFolder: './drizzle' });