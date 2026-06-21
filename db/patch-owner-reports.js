/**
 * Patches OwnerDashboard sentReports section to show comment + document download
 * Run: node db/patch-owner-reports.js
 */
const fs   = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'Hidaya-front', 'src', 'pages', 'OwnerDashboard', 'index.jsx');

let content = fs.readFileSync(filePath, 'utf8');

// Find start: the sentReports.length > 0 block
const startMarker = '{sentReports.length > 0 && (';
const startIdx    = content.indexOf(startMarker);
if (startIdx === -1) { console.error('❌ Start marker not found'); process.exit(1); }

// Find the matching end: first occurrence of '})\n\n      {sentReports.length === 0'
const endMarker = '{sentReports.length === 0 &&';
const endIdx    = content.indexOf(endMarker);
if (endIdx === -1) { console.error('❌ End marker not found'); process.exit(1); }

const before = content.slice(0, startIdx);
const after  = content.slice(endIdx);

const newBlock = `{sentReports.length > 0 && (
        <div style={{marginBottom:28}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            <span style={{fontSize:14,fontWeight:800,color:'#1e293b'}}>Reports from Manager ({sentReports.length})</span>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {sentReports.map(r => (
              <div key={r.id} style={{background:'#f0f9ff',border:'1.5px solid #bae6fd',borderRadius:14,padding:'20px 22px',boxShadow:'0 2px 8px rgba(8,145,178,0.08)'}}>
                {/* Header */}
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12,marginBottom:14}}>
                  <div>
                    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
                      <span style={{padding:'3px 10px',background:'#dcfce7',color:'#15803d',borderRadius:20,fontSize:11,fontWeight:700}}>&#10003; From Manager</span>
                      <span style={{fontSize:17,fontWeight:800,color:'#0c4a6e'}}>{r.term}</span>
                    </div>
                    <div style={{fontSize:12,color:'#64748b'}}>
                      By <strong>{r.generated_by_name || 'Manager'}</strong> &middot; Sent {fmtDate(r.sent_at)}
                    </div>
                  </div>
                  {/* Document download */}
                  {r.document_name && (
                    <a
                      href={reportsAPI.documentUrl(r.id)}
                      download={r.document_name}
                      style={{display:'inline-flex',alignItems:'center',gap:7,padding:'9px 16px',
                        background:'linear-gradient(135deg,#7c3aed,#6d28d9)',color:'#fff',
                        borderRadius:8,fontSize:12,fontWeight:700,textDecoration:'none',
                        boxShadow:'0 3px 10px rgba(124,58,237,0.3)',flexShrink:0}}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      {r.document_name}
                    </a>
                  )}
                </div>
                {/* Manager comment */}
                {(r.comment || r.notes) && (
                  <div style={{background:'#fff',borderRadius:8,padding:'12px 14px',marginBottom:14,
                    border:'1px solid #bae6fd',borderLeft:'4px solid #0891b2'}}>
                    <div style={{fontSize:11,fontWeight:700,color:'#0891b2',marginBottom:4,
                      textTransform:'uppercase',letterSpacing:'0.04em'}}>
                      Manager's Comment
                    </div>
                    <div style={{fontSize:13,color:'#1e293b',lineHeight:1.6}}>{r.comment || r.notes}</div>
                  </div>
                )}
                {/* Stats grid */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))',gap:10}}>
                  {[
                    { label:'Student Avg',  value:\`\${fmt1(r.student_avg_score)}/100\`, color:'#0891b2' },
                    { label:'Task Rate',    value:\`\${fmt1(r.teacher_task_rate)}%\`,    color:'#7c3aed' },
                    { label:'Attendance',   value:\`\${fmt1(r.attendance_rate)}%\`,      color:'#16a34a' },
                    { label:'Top Grade',    value: r.top_grade || 'N/A',               color:'#d97706' },
                    { label:'Students',     value: r.total_students || 0,              color:'#0891b2' },
                    { label:'Teachers',     value: r.total_teachers  || 0,             color:'#1a73e8' },
                    { label:'Assistants',   value: r.total_assistants || 0,            color:'#16a34a' },
                  ].map(s => (
                    <div key={s.label} style={{background:'#fff',borderRadius:10,padding:'11px 13px',border:'1px solid #e0f2fe'}}>
                      <div style={{fontSize:17,fontWeight:800,color:s.color}}>{s.value}</div>
                      <div style={{fontSize:10,fontWeight:600,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.04em',marginTop:2}}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      `;

fs.writeFileSync(filePath, before + newBlock + after, 'utf8');
const lineCount = content.split('\n').length;
console.log('✅ OwnerDashboard patched! Approx lines:', lineCount);
