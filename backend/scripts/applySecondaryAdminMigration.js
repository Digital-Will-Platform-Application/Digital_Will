/**
 * Applies migration 009: adds users.is_secondary_admin (required for secondary admins + Admin Settings).
 * Uses DATABASE_URL from backend/.env (your Neon connection string).
 *
 * Usage (from backend folder): npm run migrate:009
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is missing. Set it in backend/.env to your Neon connection string.');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const sqlPath = path.join(__dirname, '..', 'migrations', '009_add_is_secondary_admin_to_users.sql');

async function main() {
  const sql = fs.readFileSync(sqlPath, 'utf8');
  await pool.query(sql);
  console.log('✅ Migration 009 applied: is_secondary_admin column exists on users.');
  console.log('   You can create secondary admins in Admin Settings; they get the same dashboard as you except Settings.');
}

main()
  .catch((err) => {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  })
  .finally(() => pool.end());
