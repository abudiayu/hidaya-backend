/**
 * Patches TeacherDashboard results case with real DB data
 * Run: node db/patch-teacher-results.js
 */
const fs   = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'Hidaya-front', 'src', 'pages', 'TeacherDashboard', 'index.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const START = "      case 'results':";
const END   = "      case 'view':";

const si = content.indexOf(START);
const ei = content.indexOf(END);
if (si === -1 || ei === -1) { console.error('Markers not found', si, ei); process.exit(1); }

const newCase = `      case 'results': {
        // ── submit all marks for one semester to the DB ──────────────────────
        const handleSubmitSemester = async (sem) => {
          if (!teacherSubjectObj) return;
          const marks = sem === 'sem1' ? sem1Marks : sem2Marks;
          const setLocked = sem === 'sem1' ? setSem1Locked : setSem2Locked;
          setSubmitSaving(true); setSaveError('');
          try {
            for (const stu of dbStudents) {
              const row = marks[stu.id] || {};
              if (!row.assignment && !row.class_work && !row.mid_exam && !row.final_exam) continue;
              await resultsAPI.save({
                student_id: stu.id,
                subject_id: teacherSubjectObj.id,
                semester:   sem,
                assignment:  Number(row.assignment  || 0),
                class_work:  Number(row.class_work  || 0),
                mid_exam:    Number(row.mid_exam    || 0),
                final_exam:  Number(row.final_exam  || 0),
              });
            }
            setLocked(true);
            setSavedMsg((sem === 'sem1' ? 'Semester 1' : 'Semester 2') + ' marks saved ✓');
            setTimeout(() => setSavedMsg(''), 3000);
          } catch (e) {
            setSaveError(e.message || 'Failed to save marks');
          } finally { setSubmitSaving(false); }
        };

        // ── update a single cell ─────────────────────────────────────────────
        const updateMark = (sem, studentId, key, rawVal, max) => {
          const v = rawVal === '' ? '' : Math.min(max, Math.max(0, Number(rawVal)));
          const setter = sem === 'sem1' ? setSem1Marks : setSem2Marks;
          setter(prev => ({
            ...prev,
            [studentId]: { ...(prev[studentId] || {}), [key]: rawVal === '' ? '' : v }
          }));
        };

        // ── render a semester table ──────────────────────────────────────────
        const renderSemTable = (sem) => {
          const locked  = sem === 'sem1' ? sem1Locked  : sem2Locked;
          const marks   = sem === 'sem1' ? sem1Marks   : sem2Marks;
          const label   = sem === 'sem1' ? 'Semester 1' : 'Semester 2';
          return (
            <>
              {locked && (
                <div className="locked-banner">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  {label} marks saved — read-only
                </div>
              )}
              {resultsLoading ? (
                <div style={{textAlign:'center',padding:32,color:'#94a3b8'}}>
                  <svg className="login-spin" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2.5" strokeLinecap="round" width="28" height="28" style={{display:'block',margin:'0 auto 8px'}}>
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                  Loading marks from database…
                </div>
              ) : (
                <div className="marks-table-wrap">
                  <div className="marks-head">
                    <div className="marks-col-name">Student</div>
                    {MARK_COLS.map(c => (
                      <div key={c.key} className="marks-col-input">
                        {c.max}<span className="marks-col-sub">{c.label}</span>
                      </div>
                    ))}
                    <div className="marks-col-total">Total</div>
                    <div className="marks-col-grade">Grade</div>
                  </div>
                  {dbStudents.length === 0 && (
                    <div style={{textAlign:'center',padding:24,color:'#94a3b8',fontSize:13}}>
                      No students in database. Add students from Payment Status.
                    </div>
                  )}
                  {dbStudents.map(stu => {
                    const row   = marks[stu.id] || {};
                    const total = semTotal(row);
                    return (
                      <div key={stu.id} className="marks-row">
                        <div className="marks-col-name marks-student">
                          <div>{stu.full_name}</div>
                          <div style={{fontSize:11,color:'#94a3b8'}}>{stu.student_code} · {stu.grade}</div>
                        </div>
                        {MARK_COLS.map(c => (
                          <div key={c.key} className="marks-col-input">
                            {locked ? (
                              <span style={{ color: row[c.key] !== '' ? gradeColor(Number(row[c.key]) / c.max * 100) : '#94a3b8', fontWeight: 600 }}>
                                {row[c.key] !== '' && row[c.key] !== undefined ? row[c.key] : '—'}
                              </span>
                            ) : (
                              <input
                                type="number" min="0" max={c.max}
                                placeholder="—"
                                value={row[c.key] ?? ''}
                                onChange={e => updateMark(sem, stu.id, c.key, e.target.value, c.max)}
                                className="sem-input"
                                style={row[c.key] !== '' && row[c.key] !== undefined
                                  ? { color: gradeColor(Number(row[c.key]) / c.max * 100), fontWeight: 700 } : {}}
                              />
                            )}
                          </div>
                        ))}
                        <div className="marks-col-total">
                          <span style={{ color: gradeColor(total), fontWeight: 800 }}>{total ?? '—'}</span>
                        </div>
                        <div className="marks-col-grade">
                          <span className="sem-grade-badge" style={{ background: gradeColor(total) + '18', color: gradeColor(total) }}>
                            {gradeLabel(total)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {!locked && !resultsLoading && (
                <div className="gr-submit-row">
                  <div className="gr-submit-note">Once submitted, {label} marks cannot be edited.</div>
                  <button className="submit-btn" onClick={() => handleSubmitSemester(sem)} disabled={submitSaving}>
                    {submitSaving ? 'Saving…' : 'Submit ' + label + ' Marks'}
                  </button>
                </div>
              )}
            </>
          );
        };

        return (
          <div className="dash-content page-enter">
            <div className="gr-header">
              <div>
                <h2 className="section-heading">Student Results — {TEACHER_SUBJECT}</h2>
                <p className="section-sub">Assignment /10 · Class Work /10 · Mid Exam /30 · Final Exam /50 · Total /100</p>
              </div>
            </div>

            {saveError && (
              <div style={{background:'#fee2e2',border:'1px solid #fca5a5',borderRadius:8,padding:'10px 16px',marginBottom:16,fontSize:13,color:'#991b1b'}}>{saveError}</div>
            )}
            {savedMsg && (
              <div style={{background:'#f0fdf4',border:'1px solid #86efac',borderRadius:8,padding:'10px 16px',marginBottom:16,fontSize:13,color:'#15803d',fontWeight:600}}>{savedMsg}</div>
            )}
            {!teacherSubjectObj && !resultsLoading && dbSubjects.length > 0 && (
              <div style={{background:'#fff7ed',border:'1px solid #fdba74',borderRadius:8,padding:'10px 16px',marginBottom:16,fontSize:13,color:'#9a3412'}}>
                Subject "{TEACHER_SUBJECT}" not found in DB. Contact admin.
              </div>
            )}

            {/* Semester tabs */}
            <div className="sem-tabs">
              {[{ key:'sem1', label:'Semester 1' }, { key:'sem2', label:'Semester 2' }, { key:'final', label:'Final Result' }].map(tab => (
                <button key={tab.key} className={\`sem-tab \${activeSem === tab.key ? 'sem-tab-active' : ''}\`} onClick={() => setActiveSem(tab.key)}>
                  {tab.label}
                  {tab.key === 'sem1'  && sem1Locked && <span className="sem-tab-dot" />}
                  {tab.key === 'sem2'  && sem2Locked && <span className="sem-tab-dot" />}
                  {tab.key === 'final' && sem1Locked && sem2Locked && <span className="sem-tab-dot" />}
                </button>
              ))}
            </div>

            {activeSem === 'sem1' && renderSemTable('sem1')}
            {activeSem === 'sem2' && renderSemTable('sem2')}

            {/* Final Result */}
            {activeSem === 'final' && (
              <div className="sem-final-wrap">
                {(!sem1Locked || !sem2Locked) && (
                  <div className="sem-final-notice">
                    {!sem1Locked && !sem2Locked ? 'Submit both semesters to see final results.'
                      : !sem1Locked ? 'Submit Semester 1 to see final results.'
                      : 'Submit Semester 2 to see final results.'}
                  </div>
                )}
                {sem1Locked && sem2Locked && (
                  <>
                    <div className="final-summary-header">
                      <span>{TEACHER_SUBJECT} — Final Results</span>
                      <span className="final-summary-sub">AVG = (Semester 1 + Semester 2) ÷ 2</span>
                    </div>
                    <div className="marks-table-wrap">
                      <div className="marks-head final-marks-head">
                        <div className="marks-col-name">Student</div>
                        <div className="marks-col-total">Sem 1<span className="marks-col-sub">/100</span></div>
                        <div className="marks-col-total">Sem 2<span className="marks-col-sub">/100</span></div>
                        <div className="marks-col-total marks-col-avg">AVG<span className="marks-col-sub">/100</span></div>
                        <div className="marks-col-grade">Grade</div>
                      </div>
                      {dbStudents.map(stu => {
                        const t1  = semTotal(sem1Marks[stu.id]);
                        const t2  = semTotal(sem2Marks[stu.id]);
                        const avg = (t1 !== null && t2 !== null) ? Math.round((t1 + t2) / 2) : null;
                        return (
                          <div key={stu.id} className="marks-row final-marks-row">
                            <div className="marks-col-name marks-student">
                              <div>{stu.full_name}</div>
                              <div style={{fontSize:11,color:'#94a3b8'}}>{stu.student_code}</div>
                            </div>
                            <div className="marks-col-total"><span style={{ color: gradeColor(t1), fontWeight: 600 }}>{t1 ?? '—'}</span></div>
                            <div className="marks-col-total"><span style={{ color: gradeColor(t2), fontWeight: 600 }}>{t2 ?? '—'}</span></div>
                            <div className="marks-col-total marks-col-avg"><span style={{ color: gradeColor(avg), fontWeight: 800, fontSize:'1.05rem' }}>{avg ?? '—'}</span></div>
                            <div className="marks-col-grade">
                              <span className="sem-grade-badge" style={{ background: gradeColor(avg) + '22', color: gradeColor(avg), fontSize:'0.85rem' }}>{gradeLabel(avg)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        );
      }

      `;

fs.writeFileSync(filePath, content.slice(0, si) + newCase + content.slice(ei), 'utf8');
const total = (content.slice(0, si) + newCase + content.slice(ei)).split('\n').length;
console.log('✅ TeacherDashboard results case patched! Lines:', total);
