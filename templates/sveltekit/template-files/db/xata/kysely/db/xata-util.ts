import { Kysely } from 'kysely';
import { XataDialect, type Model } from '@xata.io/kysely';
import { type DatabaseSchema, getXataClient } from './xata'; // Generated client
import { config } from 'dotenv';

config();

const xata = getXataClient();

export const db = new Kysely<Model<DatabaseSchema>>({
	dialect: new XataDialect({ xata })
});