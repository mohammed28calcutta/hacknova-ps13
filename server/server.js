const express = require('express');
const cors = require('cors');
const { rawScholarships } = require('./data');
const { evaluateAll } = require('./engine');

const PORT = 5001;
const app = express();
app.use(cors());
app.use(express.json());

// ---------- date helpers (all LOCAL dates, never toISOString) ----------
function pad(n) {
  return String(n).padStart(2, '0');
}

function toDateString(date) {
  return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
}

function addDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toDateString(d);
}

// Whole number of days between today (local) and the deadline (YYYY-MM-DD).
function daysLeft(deadline) {
  const todayStr = toDateString(new Date());
  return Math.round((Date.parse(deadline) - Date.parse(todayStr)) / 86400000);
}

// ---------- in-memory data ----------
const scholarships = rawScholarships.map((raw) => {
  const item = { ...raw, deadline: addDays(raw.deadline_in_days) };
  delete item.deadline_in_days;
  return item;
});

let nextId = Math.max(...scholarships.map((s) => s.id)) + 1;

function withDaysLeft(s) {
  return { ...s, daysLeft: daysLeft(s.deadline) };
}

function findStudentError(student) {
  if (!student || typeof student !== 'object') return 'student is required';
  if (typeof student.gpa !== 'number' || !isFinite(student.gpa)) return 'student.gpa must be a number';
  if (typeof student.income !== 'number' || !isFinite(student.income)) return 'student.income must be a number';
  return null;
}

// Evaluates a student against VERIFIED scholarships only, adds daysLeft to every item.
function evaluateStudent(student) {
  const verified = scholarships.filter((s) => s.verified);
  const result = evaluateAll(student, verified);
  return {
    matched: result.matched.map(withDaysLeft),
    partial: result.partial.map(withDaysLeft),
    ineligible: result.ineligible.map(withDaysLeft)
  };
}

// ---------- routes ----------
app.get('/api/scholarships', (req, res) => {
  try {
    res.json(scholarships.map(withDaysLeft));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/scholarships', (req, res) => {
  try {
    const b = req.body || {};
    const missing = [];
    ['title', 'provider', 'amount'].forEach((f) => {
      if (typeof b[f] !== 'string' || b[f].trim() === '') missing.push(f);
    });
    if (typeof b.deadline !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(b.deadline) || isNaN(Date.parse(b.deadline))) {
      missing.push('deadline (YYYY-MM-DD)');
    }
    if (typeof b.min_gpa !== 'number' || !isFinite(b.min_gpa)) missing.push('min_gpa (number)');
    if (typeof b.max_income !== 'number' || !isFinite(b.max_income)) missing.push('max_income (number)');
    if (missing.length > 0) {
      return res.status(400).json({ error: 'Missing or invalid fields: ' + missing.join(', ') });
    }

    const created = {
      id: nextId++,
      title: b.title.trim(),
      provider: b.provider.trim(),
      amount: b.amount.trim(),
      deadline: b.deadline,
      min_gpa: b.min_gpa,
      max_income: b.max_income,
      category_eligible: Array.isArray(b.category_eligible) ? b.category_eligible : ['All'],
      gender_eligible: typeof b.gender_eligible === 'string' ? b.gender_eligible : 'All',
      education_levels: Array.isArray(b.education_levels) ? b.education_levels : ['UG'],
      required_docs: Array.isArray(b.required_docs) ? b.required_docs : [],
      verified: false
    };
    scholarships.push(created);
    res.status(201).json(withDaysLeft(created));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/scholarships/:id/verify', (req, res) => {
  try {
    const id = Number(req.params.id);
    const s = scholarships.find((x) => x.id === id);
    if (!s) return res.status(404).json({ error: 'Scholarship ' + req.params.id + ' not found' });
    s.verified = !s.verified;
    res.json(withDaysLeft(s));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/evaluate', (req, res) => {
  try {
    const student = req.body && req.body.student;
    const problem = findStudentError(student);
    if (problem) return res.status(400).json({ error: problem });
    res.json(evaluateStudent(student));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reminders/trigger', (req, res) => {
  try {
    const student = req.body && req.body.student;
    const problem = findStudentError(student);
    if (problem) return res.status(400).json({ error: problem });

    const result = evaluateStudent(student);
    const alerts = result.matched
      .concat(result.partial)
      .filter((s) => s.daysLeft <= 14)
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .map((s) => ({
        id: s.id,
        title: s.title,
        deadline: s.deadline,
        daysLeft: s.daysLeft,
        missingDocs: s.missingDocs
      }));
    res.json({ count: alerts.length, alerts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bad JSON in a request body -> clean JSON error instead of an HTML page.
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  res.status(500).json({ error: err && err.message ? err.message : 'Server error' });
});

app.listen(PORT, () => console.log('Server running on http://localhost:' + PORT));
