/**
 * Test report generate + send + owner view flow
 * Run: node db/test-reports.js
 */
const http = require('http');

function req(method, path, token, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = { Authorization: 'Bearer ' + token };
    if (data) { headers['Content-Type'] = 'application/json'; headers['Content-Length'] = Buffer.byteLength(data); }
    const r = http.request({ hostname: 'localhost', port: 5000, path, method, headers }, res => {
      let raw = ''; res.on('data', c => raw += c); res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(raw) }));
    });
    r.on('error', reject); if (data) r.write(data); r.end();
  });
}

function login(login_id, password) {
  const d = JSON.stringify({ login_id, password });
  return new Promise((resolve, reject) => {
    const r = http.request({ hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(d) }
    }, res => { let raw=''; res.on('data', c => raw+=c); res.on('end', () => resolve(JSON.parse(raw))); });
    r.on('error', reject); r.write(d); r.end();
  });
}

async function run() {
  console.log('\n🧪 Testing Reports Generate + Send flow\n');

  // Login both roles
  const mgrLogin   = await login('mgr01', 'manager123');
  const ownerLogin = await login('owner01', 'owner123');
  if (!mgrLogin.success || !ownerLogin.success) { console.error('❌ Login failed'); return; }
  const mgrToken   = mgrLogin.data.token;
  const ownerToken = ownerLogin.data.token;
  console.log('✅ Manager + Owner logged in\n');

  // 1. Manager generates a report
  const gen = await req('POST', '/api/reports/generate', mgrToken, { term: 'Test Term 2026', notes: 'End of term summary' });
  console.log('POST /api/reports/generate →', gen.status);
  if (gen.body.success) {
    const r = gen.body.data;
    console.log('  Report ID:', r.id, '| Term:', r.term, '| Status:', r.status);
    console.log('  Student avg:', r.student_avg_score, '| Task rate:', r.teacher_task_rate, '| Attendance:', r.attendance_rate);

    // 2. Manager sends the report to owner
    const send = await req('PUT', `/api/reports/${r.id}/send`, mgrToken, {});
    console.log('\nPUT /api/reports/' + r.id + '/send →', send.status);
    if (send.body.success) {
      console.log('  Status now:', send.body.data.status, '| Sent at:', send.body.data.sent_at);
    } else { console.log('  ERROR:', send.body.message); }

    // 3. Owner fetches sent reports
    const sent = await req('GET', '/api/reports/sent', ownerToken);
    console.log('\nGET /api/reports/sent (owner) →', sent.status);
    if (sent.body.success) {
      console.log('  Reports visible to owner:', sent.body.data.length);
      sent.body.data.forEach(r2 => console.log('  -', r2.term, '|', r2.status, '| by:', r2.generated_by_name));
    } else { console.log('  ERROR:', sent.body.message); }

    // 4. Cleanup - delete the test report
    await req('DELETE', `/api/reports/${r.id}`, mgrToken);
    console.log('\n🧹 Test report cleaned up');

  } else {
    console.log('  ERROR:', gen.body.message);
  }

  console.log('\n✅ Flow test complete!\n');
}

run().catch(e => console.error('❌', e.message));
