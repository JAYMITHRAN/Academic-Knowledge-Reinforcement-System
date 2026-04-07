const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');

async function migrateSchema() {
  console.log('Connecting to Aiven Database...');
  
  // Note: Aiven uses SSL, so we ensure ssl is enabled if it's Aiven.
  const isSSL = process.env.DB_SSL === 'true' || process.env.DB_SSL === '1' || process.env.DB_HOST.includes('aivencloud.com');
  
  const connectionConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true,
  };

  if (isSSL) {
    const caPath = path.join(__dirname, '../ca.pem');
    connectionConfig.ssl = {
      ca: fs.readFileSync(caPath),
      rejectUnauthorized: true // Now that we have the proper CA, we can securely verify
    };
  }

  try {
    const connection = await mysql.createConnection(connectionConfig);

    console.log('Connected directly to the server. Checking database...');
    
    // First read the schema.sql file
    const schemaPath = path.join(__dirname, '../schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`schema.sql not found at ${schemaPath}`);
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Running schema.sql on Aiven...');
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (const stmt of statements) {
      try {
        await connection.query(stmt);
      } catch (err) {
        if (err.code === 'ER_DUP_KEYNAME') {
          console.log(`Skipping duplicate index creation...`);
        } else if (stmt.includes('CREATE DATABASE') && err.code === 'ER_DB_CREATE_EXISTS') {
           console.log(`Database already exists, continuing...`);
        } else {
           console.error(`Error executing statement: ${stmt.substring(0, 50)}...`);
           console.error(err.message);
        }
      }
    }
    
    console.log('✅ Aiven Database Schema successfully created and updated!');
    await connection.end();
  } catch (error) {
    console.error('❌ Failed to migrate schema to Aiven:', error.message);
    if (error.code === 'ER_NOT_SUPPORTED_AUTH_MODE') {
      console.log('\nHint: Check your password format or Aiven configuration for old authentication plugins.');
    } else if (error.code === 'ENOTFOUND') {
      console.log('\nHint: The Aiven Host string might be incorrect. Double check your DB_HOST.');
    }
  }
}

migrateSchema();
