import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

// Since there is no arbitrary SQL RPC, we must use a Postgres client if we have the DB URI.
// Let's check if there is a Postgres connection string in .env
console.log("DB URL exists:", !!process.env.DATABASE_URL);
