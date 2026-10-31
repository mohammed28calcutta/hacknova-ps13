const BASE = 'http://127.0.0.1:5001';

const ananya = {
  name: 'Ananya (First-Year Girl, OBC, Low Income)',
  gpa: 8.4,
  income: 180000,
  category: 'OBC',
  gender: 'Female',
  education_level: 'UG',
  documents: ['Aadhaar', 'Marksheet', 'Bank Passbook']
};

const rohan = {
  name: 'Rohan (General Male, High Income)',
  gpa: 7.2,
  income: 950000,
  category: 'General',
  gender: 'Male',
  education_level: 'UG',
  documents: ['Aadhaar', 'Marksheet', 'Income Certificate', 'Bank Passbook']
};

let failures = 0;

function report(name, ok, detail) {
  if (ok) {
    console.log('PASS: ' + name);
  } else {
    failures++;
    console.log('FAIL: ' + name + (detail ? '  -> ' + detail : ''));
  }
}

function sortedIds(list) {
  return list.map((s) => s.id).sort((a, b) => a - b);
}

function same(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

async function call(method, path, body) {
  const options = { method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) options.body = JSON.stringify(body);
  const res = await fetch(BASE + path, options);
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, data };
}

async function run() {
  // 1) list all scholarships
  try {
    const r = await call('GET', '/api/scholarships');
    report('GET /api/scholarships returns 11 items', r.status === 200 && Array.isArray(r.data) && r.data.length === 11,
      'status ' + r.status + ', items ' + (Array.isArray(r.data) ? r.data.length : 'n/a'));
  } catch (e) {
    report('GET /api/scholarships returns 11 items', false, e.message);
  }

  // 2) Ananya evaluation
  try {
    const r = await call('POST', '/api/evaluate', { student: ananya });
    const d = r.data || {};
    const m = sortedIds(d.matched || []);
    const p = sortedIds(d.partial || []);
    const i = sortedIds(d.ineligible || []);
    report('Ananya: matched [4,5,6,7], partial [1,2,3], ineligible [8,9,10]',
      r.status === 200 && same(m, [4, 5, 6, 7]) && same(p, [1, 2, 3]) && same(i, [8, 9, 10]),
      'got matched ' + JSON.stringify(m) + ', partial ' + JSON.stringify(p) + ', ineligible ' + JSON.stringify(i));
  } catch (e) {
    report('Ananya evaluation', false, e.message);
  }

  // 3) Rohan evaluation
  try {
    const r = await call('POST', '/api/evaluate', { student: rohan });
    const d = r.data || {};
    const m = sortedIds(d.matched || []);
    const ine = (d.ineligible || []).length;
    report('Rohan: matched [7] and 9 ineligible', r.status === 200 && same(m, [7]) && ine === 9,
      'got matched ' + JSON.stringify(m) + ', ineligible count ' + ine);
  } catch (e) {
    report('Rohan evaluation', false, e.message);
  }

  // 4) reminders
  try {
    const r = await call('POST', '/api/reminders/trigger', { student: ananya });
    const d = r.data || {};
    const ids = (d.alerts || []).map((a) => a.id);
    report('Reminders for Ananya: count 3, ids [3,1,4] in order', r.status === 200 && d.count === 3 && same(ids, [3, 1, 4]),
      'got count ' + d.count + ', ids ' + JSON.stringify(ids));
  } catch (e) {
    report('Reminders for Ananya', false, e.message);
  }

  // 5) admin verify toggle, then restore
  let toggled = false;
  try {
    const v = await call('PATCH', '/api/scholarships/11/verify');
    toggled = v.status === 200;
    const r = await call('POST', '/api/evaluate', { student: ananya });
    const count = r.data && r.data.matched ? r.data.matched.length : -1;
    report('Verify scheme 11 -> Ananya has 5 matched', toggled && v.data.verified === true && count === 5,
      'verified=' + (v.data && v.data.verified) + ', matched count ' + count);
  } catch (e) {
    report('Verify scheme 11', false, e.message);
  }
  if (toggled) {
    try {
      const back = await call('PATCH', '/api/scholarships/11/verify');
      report('Scheme 11 restored to unverified', back.status === 200 && back.data.verified === false,
        'verified=' + (back.data && back.data.verified));
    } catch (e) {
      report('Scheme 11 restored to unverified', false, e.message);
    }
  }

  // 6) bad input
  try {
    const r = await call('POST', '/api/evaluate', {});
    report('POST /api/evaluate with empty body returns 400', r.status === 400, 'status ' + r.status);
  } catch (e) {
    report('POST /api/evaluate with empty body returns 400', false, e.message);
  }

  console.log('');
  if (failures > 0) {
    console.log(failures + ' check(s) FAILED');
    process.exit(1);
  }
  console.log('All checks passed');
}

run().catch((e) => {
  console.log('FAIL: could not reach the server at ' + BASE + ' (is it running?) -> ' + e.message);
  process.exit(1);
});
