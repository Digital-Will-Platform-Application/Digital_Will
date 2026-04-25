import pool from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function showUsers() {
  try {
    const result = await pool.query(
      `SELECT id, username, email, mobile, address1, address2, age, gender, state, postal_code, created_at 
       FROM users 
       ORDER BY created_at DESC`
    );

    console.log('\n📊 Users in Database:');
    console.log('═'.repeat(100));
    
    if (result.rows.length === 0) {
      console.log('No users found.');
    } else {
      console.log(`Total users: ${result.rows.length}\n`);
      
      result.rows.forEach((user, index) => {
        console.log(`${index + 1}. User ID: ${user.id}`);
        console.log(`   Username: ${user.username || 'N/A'}`);
        console.log(`   Email: ${user.email || 'N/A'}`);
        console.log(`   Mobile: ${user.mobile || 'N/A'}`);
        console.log(`   Age: ${user.age || 'N/A'}`);
        console.log(`   Gender: ${user.gender || 'N/A'}`);
        console.log(`   State: ${user.state || 'N/A'}`);
        console.log(`   Postal Code: ${user.postal_code || 'N/A'}`);
        console.log(`   Address 1: ${user.address1 || 'N/A'}`);
        console.log(`   Address 2: ${user.address2 || 'N/A'}`);
        console.log(`   Created: ${user.created_at}`);
        console.log('-'.repeat(100));
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    process.exit(1);
  }
}

showUsers();
