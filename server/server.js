const express = require('express');
const cors = require('cors');
const { rawScholarships } = require('./data');
const { evaluateAll } = require('./engine');

const PORT = 5001;
const app = express();

// Security Hardening: Defense-in-Depth Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.use(cors());
// Limit JSON payload to 100kb to prevent DoS memory exhaustion
app.use(express.json({ limit: '100kb' }));

// ---------- date helpers (LOCAL dates, never toISOString) ----------
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

function daysLeft(deadline) {
  const todayStr = toDateString(new Date());
  return Math.round((Date.parse(deadline) - Date.parse(todayStr)) / 86400000);
}

// ---------- in-memory scholarships ----------
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

// ---------- in-memory synthetic documents store ----------
const studentDocuments = {
  Taher: [
    {
      id: "DOC-TAH-01",
      name: "Aadhaar Card",
      type: "Identity Proof",
      fileName: "Aadhaar_Card_Taher.pdf",
      fileSize: "1.4 MB",
      docNumber: "XXXX-XXXX-8921",
      issuer: "Unique Identification Authority of India (UIDAI)",
      issueDate: "12 Mar 2021",
      status: "pending", // 'pending' | 'verified' | 'rejected'
      details: {
        holderName: "Taher M.",
        dob: "14 May 2005",
        gender: "Male",
        address: "Shivaji Nagar, Pune, Maharashtra - 411005",
        securityHash: "SHA256: 8f4b23...verified",
      },
      colorTheme: "blue"
    },
    {
      id: "DOC-TAH-02",
      name: "Academic Marksheet",
      type: "Academic Record",
      fileName: "Semester4_MarkSheet_8.7CGPA.pdf",
      fileSize: "2.1 MB",
      docNumber: "SPPU/ENG/2025/4412",
      issuer: "Savitribai Phule Pune University",
      issueDate: "10 Jun 2025",
      status: "pending",
      details: {
        course: "Bachelor of Engineering (Computer Engineering)",
        semester: "Semester IV (Second Year)",
        cgpa: "8.70 / 10.00 (Distinction)",
        rollNumber: "ENG23491",
        verifiedByRegistrar: "Office of the Controller of Examinations",
      },
      colorTheme: "emerald"
    },
    {
      id: "DOC-TAH-03",
      name: "Bank Passbook",
      type: "Financial Record",
      fileName: "SBI_Savings_Passbook_Taher.pdf",
      fileSize: "980 KB",
      docNumber: "SBI-A/C-3918290192",
      issuer: "State Bank of India (Pune Branch)",
      issueDate: "15 Jan 2024",
      status: "pending",
      details: {
        accountHolder: "Taher M.",
        accountType: "Student Savings Bank Account",
        ifscCode: "SBIN0001234",
        branch: "FC Road, Pune",
        dbtAadhaarLinked: "Yes (Active for Direct Benefit Transfer)",
      },
      colorTheme: "indigo"
    },
    {
      id: "DOC-TAH-04",
      name: "Income Certificate",
      type: "Income Verification",
      fileName: "Tahsil_Income_Certificate_2026.pdf",
      fileSize: "1.2 MB",
      docNumber: "MH/REV/INC/2026/0912",
      issuer: "Tahsil Office, Haveli, Govt. of Maharashtra",
      issueDate: "05 Apr 2026",
      status: "pending",
      details: {
        certifiedAnnualIncome: "₹1,80,000 (Rupees One Lakh Eighty Thousand Only)",
        financialYear: "2025-2026",
        authority: "Executive Magistrate & Tahsildar",
        validity: "Valid for Academic Year 2026-27",
      },
      colorTheme: "amber"
    },
    {
      id: "DOC-TAH-05",
      name: "Caste Certificate",
      type: "Social Category Proof",
      fileName: "OBC_NonCreamyLayer_Cert.pdf",
      fileSize: "1.6 MB",
      docNumber: "MH/OBC/NCL/2025/7781",
      issuer: "Sub-Divisional Magistrate (SDM), Pune",
      issueDate: "18 Aug 2025",
      status: "pending",
      details: {
        casteCategory: "Other Backward Class (OBC)",
        nonCreamyLayerStatus: "Certified Non-Creamy Layer (Valid)",
        issuingOfficer: "Competent Authority, Pune Division",
      },
      colorTheme: "purple"
    }
  ],
  "Aarav Sharma": [
    {
      id: "DOC-AAR-01",
      name: "Aadhaar Card",
      type: "Identity Proof",
      fileName: "Aadhaar_Card_Aarav.pdf",
      fileSize: "1.3 MB",
      docNumber: "XXXX-XXXX-3341",
      issuer: "UIDAI, Govt. of India",
      issueDate: "20 Jan 2022",
      status: "verified",
      details: {
        holderName: "Aarav Sharma",
        dob: "08 Nov 2004",
        gender: "Male",
        address: "Kothrud, Pune, Maharashtra",
      },
      colorTheme: "blue"
    },
    {
      id: "DOC-AAR-02",
      name: "Academic Marksheet",
      type: "Academic Record",
      fileName: "Marksheet_Sem4_Aarav.pdf",
      fileSize: "1.8 MB",
      docNumber: "SPPU/ENG/2025/1029",
      issuer: "Savitribai Phule Pune University",
      issueDate: "12 Jun 2025",
      status: "verified",
      details: {
        course: "B.Tech Information Technology",
        cgpa: "8.20 / 10.00",
        rollNumber: "IT23102",
      },
      colorTheme: "emerald"
    },
    {
      id: "DOC-AAR-03",
      name: "Bank Passbook",
      type: "Financial Record",
      fileName: "HDFC_Passbook_Aarav.pdf",
      fileSize: "1.1 MB",
      docNumber: "HDFC-A/C-501002341",
      issuer: "HDFC Bank Ltd.",
      issueDate: "02 Feb 2024",
      status: "verified",
      details: {
        accountHolder: "Aarav Sharma",
        ifscCode: "HDFC0000123",
        dbtAadhaarLinked: "Yes",
      },
      colorTheme: "indigo"
    },
    {
      id: "DOC-AAR-04",
      name: "Income Certificate",
      type: "Income Verification",
      fileName: "Income_Cert_2026.pdf",
      fileSize: "1.2 MB",
      docNumber: "MH/REV/INC/2026/0442",
      issuer: "Tahsil Office, Govt. of Maharashtra",
      issueDate: "10 Apr 2026",
      status: "verified",
      details: {
        certifiedAnnualIncome: "₹2,20,000",
        financialYear: "2025-2026",
      },
      colorTheme: "amber"
    }
  ],
  "Fatima Ansari": [
    {
      id: "DOC-FAT-01",
      name: "Aadhaar Card",
      type: "Identity Proof",
      fileName: "Aadhaar_Fatima_Ansari.pdf",
      fileSize: "1.4 MB",
      docNumber: "XXXX-XXXX-1109",
      issuer: "UIDAI, Govt. of India",
      issueDate: "19 Sep 2021",
      status: "verified",
      details: {
        holderName: "Fatima Ansari",
        dob: "22 Jan 2005",
        gender: "Female",
        address: "Mumbai, Maharashtra",
      },
      colorTheme: "blue"
    },
    {
      id: "DOC-FAT-02",
      name: "Academic Marksheet",
      type: "Academic Record",
      fileName: "BTech_Sem4_Fatima_9.1CGPA.pdf",
      fileSize: "2.3 MB",
      docNumber: "MU/ENG/2025/7821",
      issuer: "University of Mumbai",
      issueDate: "14 Jun 2025",
      status: "verified",
      details: {
        course: "B.E. Electronics & Telecommunication",
        cgpa: "9.10 / 10.00 (Rank 1)",
      },
      colorTheme: "emerald"
    },
    {
      id: "DOC-FAT-03",
      name: "Bank Passbook",
      type: "Financial Record",
      fileName: "BOI_Passbook_Fatima.pdf",
      fileSize: "1.0 MB",
      docNumber: "BOI-A/C-992100412",
      issuer: "Bank of India",
      issueDate: "11 Mar 2024",
      status: "verified",
      details: {
        accountHolder: "Fatima Ansari",
        ifscCode: "BKID0001002",
        dbtAadhaarLinked: "Yes",
      },
      colorTheme: "indigo"
    },
    {
      id: "DOC-FAT-04",
      name: "Income Certificate",
      type: "Income Verification",
      fileName: "Income_Cert_Tahsil.pdf",
      fileSize: "1.3 MB",
      docNumber: "MH/REV/INC/2026/0301",
      issuer: "Tahsil Office, Mumbai Suburban",
      issueDate: "02 Apr 2026",
      status: "verified",
      details: {
        certifiedAnnualIncome: "₹1,50,000",
      },
      colorTheme: "amber"
    },
    {
      id: "DOC-FAT-05",
      name: "Caste Certificate",
      type: "Social Category Proof",
      fileName: "OBC_NCL_Cert_Fatima.pdf",
      fileSize: "1.5 MB",
      docNumber: "MH/OBC/NCL/2025/8812",
      issuer: "Sub-Divisional Officer, Mumbai",
      issueDate: "09 Jul 2025",
      status: "verified",
      details: {
        casteCategory: "OBC",
        nonCreamyLayerStatus: "Certified Valid",
      },
      colorTheme: "purple"
    }
  ]
};

// Track overall student verification approval status
const studentVerificationStatus = {
  Taher: 'pending', // 'pending' | 'approved' | 'rejected'
  'Aarav Sharma': 'approved',
  'Fatima Ansari': 'approved',
  'Kavita Patil': 'rejected',
};

// ---------- in-memory synthetic applicants ----------
let applications = [
  {
    id: 'APP-101',
    name: 'Taher',
    email: 'ctrl@hack.com',
    education_level: 'UG',
    gpa: 8.7,
    income: 180000,
    category: 'OBC',
    gender: 'Male',
    scholarship: 'Tata Capital Pankh Scholarship',
    scholarshipId: 4,
    award: '₹30,000/year',
    status: 'Under Review',
    appliedDate: 'Today, 11:20 AM',
    documents: ['Aadhaar', 'Marksheet', 'Bank Passbook', 'Income Certificate', 'Caste Certificate'],
    fitScore: 100,
  },
  {
    id: 'APP-102',
    name: 'Aarav Sharma',
    email: 'aarav.s@gmail.com',
    education_level: 'UG',
    gpa: 8.2,
    income: 220000,
    category: 'General',
    gender: 'Male',
    scholarship: 'Reliance Foundation Undergraduate Scholarship',
    scholarshipId: 5,
    award: '₹2,00,000 (one-time)',
    status: 'Approved',
    appliedDate: 'Yesterday, 3:45 PM',
    documents: ['Aadhaar', 'Marksheet', 'Bank Passbook'],
    fitScore: 94,
  },
  {
    id: 'APP-103',
    name: 'Fatima Ansari',
    email: 'fatima.a@college.edu',
    education_level: 'UG',
    gpa: 9.1,
    income: 150000,
    category: 'OBC',
    gender: 'Female',
    scholarship: 'Women in STEM Merit Grant',
    scholarshipId: 6,
    award: '₹40,000/year',
    status: 'Shortlisted',
    appliedDate: '2 days ago',
    documents: ['Aadhaar', 'Marksheet', 'Bank Passbook', 'Income Certificate'],
    fitScore: 100,
  },
  {
    id: 'APP-104',
    name: 'Kavita Patil',
    email: 'kavita.patil@outlook.com',
    education_level: 'UG',
    gpa: 7.9,
    income: 120000,
    category: 'SC',
    gender: 'Female',
    scholarship: 'Top Class Education Scheme (SC)',
    scholarshipId: 8,
    award: '₹1,00,000/year',
    status: 'Docs Verification Pending',
    appliedDate: '3 days ago',
    documents: ['Aadhaar', 'Marksheet', 'Caste Certificate'],
    fitScore: 88,
  },
  {
    id: 'APP-105',
    name: 'Vikramaditya Deshmukh',
    email: 'vikram.d@gmail.com',
    education_level: 'UG',
    gpa: 8.5,
    income: 420000,
    category: 'General',
    gender: 'Male',
    scholarship: 'Central Sector Scheme for College Students',
    scholarshipId: 2,
    award: '₹20,000/year',
    status: 'Interview Scheduled',
    appliedDate: '4 days ago',
    documents: ['Aadhaar', 'Marksheet', 'Income Certificate', 'Bank Passbook'],
    fitScore: 92,
  },
  {
    id: 'APP-106',
    name: 'Sneha Kulkarni',
    email: 'sneha.k@unipune.ac.in',
    education_level: 'PG',
    gpa: 8.8,
    income: 300000,
    category: 'General',
    gender: 'Female',
    scholarship: 'PG Research Fellowship',
    scholarshipId: 10,
    award: '₹60,000/year',
    status: 'Under Review',
    appliedDate: '5 days ago',
    documents: ['Aadhaar', 'Marksheet', 'Bank Passbook'],
    fitScore: 96,
  }
];

// ---------- routes ----------

// Auth endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  if (email.trim().toLowerCase() === 'ctrl@hack.com' && password === 'pass123') {
    return res.json({
      success: true,
      user: {
        name: 'Taher',
        email: 'ctrl@hack.com',
        gpa: 8.7,
        income: 180000,
        category: 'OBC',
        gender: 'Male',
        education_level: 'UG',
        documents: ['Aadhaar', 'Marksheet', 'Bank Passbook', 'Income Certificate', 'Caste Certificate'],
        docStatus: studentVerificationStatus['Taher'] || 'pending',
      }
    });
  }

  return res.json({
    success: true,
    user: {
      name: email.split('@')[0] || 'Student',
      email: email.trim(),
      gpa: 8.0,
      income: 200000,
      category: 'General',
      gender: 'Male',
      education_level: 'UG',
      documents: ['Aadhaar', 'Marksheet', 'Bank Passbook'],
      docStatus: 'pending',
    }
  });
});

app.post('/api/auth/register', (req, res) => {
  const body = req.body || {};
  if (!body.name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  const user = {
    name: body.name.trim(),
    email: body.email ? body.email.trim() : 'student@hacknova.org',
    gpa: typeof body.gpa === 'number' ? body.gpa : 8.5,
    income: typeof body.income === 'number' ? body.income : 200000,
    category: body.category || 'General',
    gender: body.gender || 'Male',
    education_level: body.education_level || 'UG',
    documents: Array.isArray(body.documents) ? body.documents : ['Aadhaar', 'Marksheet'],
    docStatus: 'pending',
  };
  return res.status(201).json({ success: true, user });
});

// Document verification endpoints
app.get('/api/documents/:studentName', (req, res) => {
  const name = decodeURIComponent(req.params.studentName);
  const docs = studentDocuments[name] || studentDocuments['Taher'] || [];
  const status = studentVerificationStatus[name] || 'pending';
  res.json({ documents: docs, status });
});

app.get('/api/documents', (req, res) => {
  res.json({
    allDocuments: studentDocuments,
    statuses: studentVerificationStatus
  });
});

app.patch('/api/documents/:studentName/:docId/status', (req, res) => {
  const name = decodeURIComponent(req.params.studentName);
  const docId = req.params.docId;
  const status = req.body && req.body.status;
  const docs = studentDocuments[name];
  if (!docs) return res.status(404).json({ error: 'Student not found' });
  const doc = docs.find((d) => d.id === docId);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  doc.status = status;

  // Check if all are verified
  const allVerified = docs.every((d) => d.status === 'verified');
  const anyRejected = docs.some((d) => d.status === 'rejected');
  studentVerificationStatus[name] = allVerified ? 'approved' : anyRejected ? 'rejected' : 'pending';

  res.json({ doc, studentStatus: studentVerificationStatus[name] });
});

app.patch('/api/documents/:studentName/verify-all', (req, res) => {
  const name = decodeURIComponent(req.params.studentName);
  const docs = studentDocuments[name];
  if (docs) {
    docs.forEach((d) => { d.status = 'verified'; });
  }
  studentVerificationStatus[name] = 'approved';
  res.json({ success: true, status: 'approved', documents: docs });
});

app.patch('/api/documents/:studentName/reject-all', (req, res) => {
  const name = decodeURIComponent(req.params.studentName);
  const docs = studentDocuments[name];
  if (docs) {
    docs.forEach((d) => { d.status = 'rejected'; });
  }
  studentVerificationStatus[name] = 'rejected';
  res.json({ success: true, status: 'rejected', documents: docs });
});

// Applications endpoints
app.get('/api/applications', (req, res) => {
  res.json(applications);
});

app.post('/api/applications', (req, res) => {
  const b = req.body || {};
  const newApp = {
    id: 'APP-' + (100 + applications.length + 1),
    name: b.name || 'Taher',
    email: b.email || 'ctrl@hack.com',
    education_level: b.education_level || 'UG',
    gpa: b.gpa || 8.7,
    income: b.income || 180000,
    category: b.category || 'OBC',
    gender: b.gender || 'Male',
    scholarship: b.scholarshipTitle || 'Scholarship Scheme',
    scholarshipId: b.scholarshipId || 1,
    award: b.amount || 'Standard Grant',
    status: 'Under Review',
    appliedDate: 'Just now',
    documents: b.documents || ['Aadhaar', 'Marksheet', 'Bank Passbook'],
    fitScore: b.score || 100,
  };
  applications.unshift(newApp);
  res.status(201).json(newApp);
});

app.patch('/api/applications/:id/status', (req, res) => {
  const id = req.params.id;
  const status = req.body && req.body.status;
  if (!status) return res.status(400).json({ error: 'Status is required' });
  const appItem = applications.find((a) => a.id === id);
  if (!appItem) return res.status(404).json({ error: 'Application not found' });
  appItem.status = status;
  res.json(appItem);
});

// Scholarships endpoints
app.get('/api/scholarships', (req, res) => {
  try {
    res.json(scholarships.map(withDaysLeft));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
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
      title: b.title.trim().slice(0, 150),
      provider: b.provider.trim().slice(0, 100),
      amount: b.amount.trim().slice(0, 50),
      deadline: b.deadline,
      min_gpa: Math.max(0, Math.min(10, b.min_gpa)),
      max_income: Math.max(0, b.max_income),
      category_eligible: Array.isArray(b.category_eligible) ? b.category_eligible.filter(x => typeof x === 'string') : ['All'],
      gender_eligible: typeof b.gender_eligible === 'string' ? b.gender_eligible : 'All',
      education_levels: Array.isArray(b.education_levels) ? b.education_levels.filter(x => typeof x === 'string') : ['UG'],
      required_docs: Array.isArray(b.required_docs) ? b.required_docs.filter(x => typeof x === 'string') : [],
      verified: false
    };
    scholarships.push(created);
    res.status(201).json(withDaysLeft(created));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.patch('/api/scholarships/:id/verify', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Invalid scholarship ID' });
    }
    const s = scholarships.find((x) => x.id === id);
    if (!s) return res.status(404).json({ error: 'Scholarship ' + req.params.id + ' not found' });
    s.verified = !s.verified;
    res.json(withDaysLeft(s));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/evaluate', (req, res) => {
  try {
    const student = req.body && req.body.student;
    const problem = findStudentError(student);
    if (problem) return res.status(400).json({ error: problem });
    res.json(evaluateStudent(student));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
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
    res.status(500).json({ error: 'Server error' });
  }
});

// Bad JSON in request body handler
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  res.status(500).json({ error: 'Server error' });
});

app.listen(PORT, () => console.log('Server running on http://localhost:' + PORT));
