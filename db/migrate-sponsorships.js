/**
 * Migration: Add sponsorships table + seed sample data
 * Run: node db/migrate-sponsorships.js
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

  // Create sponsorships table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS sponsorships (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      donor_name    VARCHAR(100) NOT NULL,
      amount        DECIMAL(15,2) NOT NULL,
      description   TEXT,
      received_date DATE NOT NULL,
      status        ENUM('received','pending','cancelled') DEFAULT 'received',
      recorded_by   INT,
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);
  console.log('✅ sponsorships table created');

  // Check if already has data
  const [[cnt]] = await conn.query('SELECT COUNT(*) AS n FROM sponsorships');
  if (cnt.n === 0) {
    await conn.query(`
      INSERT INTO sponsorships (donor_name, amount, description, received_date, status) VALUES
        ('Ahmed Al-Rashidi Foundation', 15000.00, 'Annual educational grant', '2026-01-01', 'received'),
        ('Hidaya Community Fund',        8500.00, 'Term 1 community support', '2026-02-15', 'received'),
        ('Anonymous Donor',              5000.00, 'General school support',   '2026-03-10', 'received')
    `);
    console.log('✅ Sample sponsorships seeded (3 records)');
  } else {
    console.log(`ℹ️  sponsorships already has ${cnt.n} record(s) — skipping seed`);
  }

  // Show current income totals
  const [[fees]] = await conn.query(
    "SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE is_paid = 1"
  );
  const [[spon]] = await conn.query(
    "SELECT COALESCE(SUM(amount),0) AS total FROM sponsorships WHERE status = 'received'"
  );

  const studentFees  = parseFloat(fees.total);
  const sponsorship  = parseFloat(spon.total);
  const netIncome    = studentFees + sponsorship;
  const zakatDue     = netIncome >= 595 ? (netIncome * 0.025).toFixed(2) : 0;

  console.log('\n📊 Current School Income Summary:');
  console.log(`   Student Fees collected : ${studentFees.toLocaleString()} ETB`);
  console.log(`   Sponsorships received  : ${sponsorship.toLocaleString()} ETB`);
  console.log(`   ─────────────────────────────`);
  console.log(`   NET INCOME             : ${netIncome.toLocaleString()} ETB`);
  console.log(`   Zakat Due (2.5%)       : ${Number(zakatDue).toLocaleString()} ETB\n`);

  await conn.end();
  process.exit(0);
}

migrate().catch(e => {
  console.error('❌ Migration failed:', e.message);
  process.exit(1);
});
