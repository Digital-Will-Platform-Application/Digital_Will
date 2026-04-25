import pool from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDatabase() {
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, '001_create_users_table.sql'),
      'utf8'
    );
    
    await pool.query(sql);
    console.log('✅ Users table created successfully');
  } catch (error) {
    console.error('❌ Error creating users table:', error);
    throw error;
  }
}

initDatabase()
  .then(() => {
    console.log('✅ Database initialization complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  });
