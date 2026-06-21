/**
 * Migration: add status, sent_at, sent_by columns to reports table
 * Run: node db/migrate-reports.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

const cfg = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || 'hidayadb',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
};

async function migrate() {
  const conn = await mysql.createConnection(cfg);
  console.log('\n✅ Connected to', cfg.database);

  // Add columns if they don't exist
  const cols = [
    { name: 'status',  sql: "ADD COLUMN status ENUM('draft','sent') NOT NULL DEFAULT 'draft' AFTER notes" },
    { name: 'sent_at', sql: "ADD COLUMN sent_at DATETIME NULL AFTER status" },
    { name: 'sent_by', sql: "ADD COLUMN sent_by INT NULL AFTER sent_at" },
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
      console.log(`ℹ️  Column already exists: ${col.name}`);
    }
  }

  // Add FK for sent_by if not exists
  try {
    await conn.query(`ALTER TABLE reports ADD CONSTRAINT fk_reports_sent_by FOREIGN KEY (sent_by) REFERENCES users(id) ON DELETE SET NULL`);
    console.log('✅ Added FK for sent_by');
  } catch { /* already exists */ }

  console.log('\n✅ Reports table migration complete!\n');
  await conn.end();
  process.exit(0);
}

migrate().catch(e => { console.error('❌', e.message); process.exit(1); });
