import pool from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initAllTables() {
  try {
        const migrations = [
          '001_create_users_table.sql',
          '002_create_wills_table.sql',
          '003_create_assets_table.sql',
          '008_create_asset_allocations_table.sql',
          '004_create_email_notifications_table.sql',
          '005_create_recipients_table.sql',
          '006_create_email_verifications_table.sql',
          '007_create_chat_messages_table.sql',
          '008_add_avatar_url_to_users.sql',
          '009_add_is_secondary_admin_to_users.sql',
          '010_clear_secondary_flag_primary_admin.sql',
        ];

    for (const migration of migrations) {
      const sql = fs.readFileSync(
        path.join(__dirname, migration),
        'utf8'
      );
      
      await pool.query(sql);
      console.log(`✅ ${migration} executed successfully`);
    }
    
    console.log('✅ All database tables created successfully');
  } catch (error) {
    console.error('❌ Error creating database tables:', error);
    throw error;
  }
}

initAllTables()
  .then(() => {
    console.log('✅ Database initialization complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  });
