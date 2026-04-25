import dotenv from 'dotenv';
import pool from '../config/database.js';

dotenv.config();

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful!');
    console.log('Current time:', result.rows[0].now);
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Make sure DATABASE_URL is set in your .env file');
    process.exit(1);
  }
}

testConnection();
