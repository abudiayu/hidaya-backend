/**
 * Migration: add document_name + document_data columns to reports
 * Also adds comment column (replaces notes for clarity)
 * Run: node db/migrate-report-docs.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

const cfg = {
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME     || 'hidayadb',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || 'root',
};

async function migrate() {
  const conn = await mysql.createConnection(cfg);
  console.log('\n✅ Connected to', cfg.database);

  const cols = [
    { name: 'comment',       sql: "ADD COLUMN comment TEXT NULL AFTER notes" },
    { name: 'document_name', sql: "ADD COLUMN document_name VARCHAR(255) NULL AFTER comment" },
    { name: 'document_data', sql: "ADD COLUMN document_data LONGBLOB NULL AFTER document_name" },
    { name: 'document_type', sql: "ADD COLUMN document_type VARCHAR(100) NULL AFTER document_data" },
  ];

  for (const col of cols) {
    const [rows] = await conn.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA=? AND TABLE_NAME='reports' AND COLUMN_NAME=?`,
      [cfg.database, col.name]
    );
    if (rows.length === 0) {
      await conn.query(`ALTER TABLE reports ${col.sql}`);
      console.log(`✅ Added column: ${col.name}`);
    } else {
      console.log(`ℹ️  Already exists: ${col.name}`);
    }
  }

  console.log('\n✅ Migration complete!\n');
  await conn.end();
  process.exit(0);
}

migrate().catch(e => { console.error('❌', e.message); process.exit(1); });
