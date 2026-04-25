// Test R2 connection
import dotenv from 'dotenv';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

dotenv.config();

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'legacy-wallet-recordings';
const R2_STAGING_BUCKET = process.env.R2_STAGING_BUCKET || 'legacy-wallet-recordings-staging';
const R2_ENDPOINT = R2_ACCOUNT_ID ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : null;

console.log('R2 Configuration:');
console.log('Account ID:', R2_ACCOUNT_ID ? '✅ Set' : '❌ Missing');
console.log('Access Key ID:', R2_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing');
console.log('Secret Access Key:', R2_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing');
console.log('Endpoint:', R2_ENDPOINT || '❌ Missing');
console.log('Bucket (Production):', R2_BUCKET_NAME);
console.log('Bucket (Staging):', R2_STAGING_BUCKET);

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.error('❌ R2 credentials not fully configured');
  process.exit(1);
}

try {
  const s3Client = new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });

  console.log('\n✅ S3 Client created successfully');
  console.log('Testing connection...');

  // Test upload a small file
  const testContent = Buffer.from('test file content');
  const testKey = `test/test-${Date.now()}.txt`;

  const command = new PutObjectCommand({
    Bucket: R2_STAGING_BUCKET,
    Key: testKey,
    Body: testContent,
    ContentType: 'text/plain',
  });

  await s3Client.send(command);
  console.log(`✅ Test file uploaded successfully to ${R2_STAGING_BUCKET}/${testKey}`);
  console.log('✅ R2 connection is working!');
} catch (error) {
  console.error('❌ R2 connection failed:');
  console.error('Error:', error.message);
  console.error('Code:', error.Code || error.code);
  console.error('Name:', error.name);
  if (error.$metadata) {
    console.error('Metadata:', JSON.stringify(error.$metadata, null, 2));
  }
  process.exit(1);
}
