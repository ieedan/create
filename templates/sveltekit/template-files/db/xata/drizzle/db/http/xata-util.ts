import { drizzle } from 'drizzle-orm/xata-http';
import { getXataClient } from './xata';
import { config } from 'dotenv';

config();

const xata = getXataClient();
export const db = drizzle(xata);

// When using drizzle you are currently required to define your schema the drizzle way
// You can see examples here https://xata.io/docs/integrations/drizzle
