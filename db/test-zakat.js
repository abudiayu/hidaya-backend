/**
 * Test zakat endpoints with owner01 token
 * Run: node db/test-zakat.js
 */
const http = require('http');

function request(method, path, token, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = { Authorization: 'Bearer ' + token };
    if (data) { headers['Content-Type'] = 'application/json'; headers['Content-Length'] = Buffer.byteLength(data); }
    const req = http.request({ hostname: 'localhost', port: 5000, path, method, headers }, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(raw) }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function run() {
  // 1. Login as owner
  const loginData = JSON.stringify({ login_id: 'owner01', password: 'owner123' });
  const loginRes = await new Promise((resolve, reject) => {
    const req = http.request({ hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginData) }
    }, res => { let r=''; res.on('data', c => r+=c); res.on('end', () => resolve(JSON.parse(r))); });
    req.on('error', reject); req.write(loginData); req.end();
  });

  if (!loginRes.success) { console.error('Login failed:', loginRes.message); return; }
  const token = loginRes.data.token;
  console.log('✅ Logged in as owner01\n');

  // 2. Test /api/zakat/calculate
  const calc = await request('GET', '/api/zakat/calculate', token);
  console.log('GET /api/zakat/calculate →', calc.status);
  if (calc.body.success) {
    const d = calc.body.data;
    console.log('  annual_income:', d.annual_income, 'ETB');
    console.log('  nisab_value:  ', d.nisab_value, 'ETB');
    console.log('  is_liable:    ', d.is_liable);
    console.log('  zakat_amount: ', d.zakat_amount, 'ETB');
    console.log('  income_sources:', d.income_sources);
  } else {
    console.log('  ERROR:', calc.body.message);
  }

  console.log();

  // 3. Test /api/zakat/income-breakdown
  const brk = await request('GET', '/api/zakat/income-breakdown', token);
  console.log('GET /api/zakat/income-breakdown →', brk.status);
  if (brk.body.success) {
    const d = brk.body.data;
    console.log('  totals:', d.totals);
    console.log('  by_grade:', d.by_grade);
    console.log('  sponsorships count:', d.sponsorships?.length);
  } else {
    console.log('  ERROR:', brk.body.message);
  }
}

run().catch(e => console.error('❌', e.message));
