/**
 * Test all login credentials against the running backend.
 * Run: node db/test-login.js
 * Requires: backend running on port 5000
 */
const http = require('http');

const tests = [
  { login_id: 'owner01',  password: 'owner123',   role: 'owner'     },
  { login_id: 'mgr01',    password: 'manager123', role: 'manager'   },
  { login_id: 'a01',      password: 'pass01',     role: 'assistant' },
  { login_id: 'a02',      password: 'pass02',     role: 'assistant' },
  { login_id: 't01',      password: 'pass01',     role: 'teacher'   },
  { login_id: 't02',      password: 'pass02',     role: 'teacher'   },
  { login_id: 't03',      password: 'pass03',     role: 'teacher'   },
  { login_id: 't04',      password: 'pass04',     role: 'teacher'   },
];

function postLogin(body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost', port: 5000,
      path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    }, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(raw) }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('\n🧪 Testing all login credentials...\n');
  let pass = 0, fail = 0;
  for (const t of tests) {
    const res = await postLogin(t);
    const ok = res.status === 200 && res.body.success;
    const icon = ok ? '✅' : '❌';
    const info = ok
      ? `token: ${res.body.data.token.slice(0,20)}…`
      : `${res.status}: ${res.body.message}`;
    console.log(`${icon} ${t.login_id.padEnd(10)} / ${t.password.padEnd(12)} → ${info}`);
    ok ? pass++ : fail++;
  }
  console.log(`\n${pass === tests.length ? '🎉' : '⚠️'} ${pass}/${tests.length} passed\n`);
}

runTests().catch(e => console.error('❌ Test failed:', e.message));
