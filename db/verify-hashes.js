/**
 * Verify all bcrypt hashes in schema.sql actually work.
 * Run: node db/verify-hashes.js
 */
const bcrypt = require('bcryptjs');

const pairs = [
  { id: 'owner01',  password: 'owner123',   hash: '$2a$10$.xxXtSP/qKSdDL5qAHuhK.7WNHxvZINY7tfQHda1sjk/MGFm.Tw4a' },
  { id: 'mgr01',    password: 'manager123', hash: '$2a$10$hJXtgnVVVH7TSISirxcIeeh.NXbJh1sqE3C0F70f8WJhV/PDa65kK' },
  { id: 'a01',      password: 'pass01',     hash: '$2a$10$WJZvCjmWhi8.jwWMXA2KdeNHdvV2vl9MXSk3V9NlJu/ZuMqO.7dpS' },
  { id: 'a02',      password: 'pass02',     hash: '$2a$10$MxLNOC6.PrFNVlDwMFvQG.adTVoc3eM6JwfXjC/0Rwmdt4/Ty4v0K' },
  { id: 't01',      password: 'pass01',     hash: '$2a$10$WJZvCjmWhi8.jwWMXA2KdeNHdvV2vl9MXSk3V9NlJu/ZuMqO.7dpS' },
  { id: 't02',      password: 'pass02',     hash: '$2a$10$MxLNOC6.PrFNVlDwMFvQG.adTVoc3eM6JwfXjC/0Rwmdt4/Ty4v0K' },
  { id: 't03',      password: 'pass03',     hash: '$2a$10$abHb0iLTsih/k.56Wu.bIuor34/cnrHwxu.Msq7tBfGAow5G23sXa' },
  { id: 't04',      password: 'pass04',     hash: '$2a$10$nCPvYq0uEB9N95rOi5Uh4e9RwK7axgiSbcq8mSsITAFtvHdpab/Yy' },
];

async function verify() {
  console.log('\n🔐 Verifying bcrypt hashes...\n');
  let allOk = true;
  for (const p of pairs) {
    const ok = await bcrypt.compare(p.password, p.hash);
    const icon = ok ? '✅' : '❌';
    console.log(`${icon} ${p.id} / ${p.password} → ${ok ? 'MATCH' : 'FAIL'}`);
    if (!ok) allOk = false;
  }
  console.log(allOk ? '\n✅ All hashes verified!\n' : '\n❌ Some hashes FAILED — run npm run seed to fix.\n');
}

verify();
