import { config } from 'dotenv';
import type { Config } from 'drizzle-kit';

config();

export default {
	schema: './src/lib/db/schema.ts',
	out: './drizzle',
	driver: 'turso',
	dialect: 'sqlite',
	dbCredentials: {
		url: process.env.TURSO_DATABASE_URL,
		authToken: process.env.TURSO_AUTH_TOKEN,
	},
} satisfies Config;