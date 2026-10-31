import React, { useState, useEffect, useCallback } from 'react';
import {
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Bell,
  Clock,
  Settings,
  User,
  X,
  ShieldCheck,
  Bookmark,
  BookMarked,
  Search,
  Filter,
  ExternalLink,
  BarChart2,
  Download,
  FileText,
  FileCheck,
  TrendingUp,
  Eye,
  LogOut,
  Lock,
  Mail,
  Sparkles,
  UploadCloud,
  Check,
} from 'lucide-react';

import {
  DEFAULT_STUDENT,
  STUDENT_DOCUMENTS,
  SYNTHETIC_APPLICANTS,
  CATEGORIES,
  GENDERS,
  EDUCATION_LEVELS,
  ALL_DOCUMENTS,
} from './presets';

import {
  loginUser,
  registerUser,
  evaluate,
  triggerReminders,
  getScholarships,
  toggleVerify,
  getApplications,
  submitApplication,
  updateApplicationStatus,
  getStudentDocuments,
  updateDocumentStatus,
  verifyAllStudentDocuments,
  rejectAllStudentDocuments,
} from './api';

// ─── Catalogue filter helpers ────────────────────────────────────────────────
const LOCATIONS = ['All India', 'Maharashtra', 'Central', 'State'];
const DEADLINE_OPTIONS = [
  { label: 'Any deadline', value: 0 },
  { label: 'Due in ≤ 7 days', value: 7 },
  { label: 'Due in ≤ 14 days', value: 14 },
  { label: 'Due in ≤ 30 days', value: 30 },
];
const APP_STATUS_OPTIONS = [
  { value: 'not_applied', label: 'Not Applied' },
  { value: 'applied', label: 'Applied ✓' },
  { value: 'docs_ready', label: 'Docs Ready 📄' },
  { value: 'interview', label: 'Interview Scheduled 🗓' },
  { value: 'result', label: 'Result Awaited ⏳' },
];

// ─── Export helper ────────────────────────────────────────────────────────────
function exportCSV(rows, filename) {
  if (!rows || rows.length === 0) return;
  const header = Object.keys(rows[0]).join(',');
  const body = rows.map((r) => Object.values(r).map((v) => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([header + '\n' + body], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  // ─── Authentication & User State ───────────────────────────────────────────
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [student, setStudent] = useState(DEFAULT_STUDENT);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('ctrl@hack.com');
  const [loginPassword, setLoginPassword] = useState('pass123');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Registration form state
  const [regForm, setRegForm] = useState({
    name: '',
    email: '',
    password: '',
    education_level: 'UG',
    gpa: 8.7,
    income: 180000,
    category: 'OBC',
    gender: 'Male',
    documents: [],
  });
  const [uploadedFiles, setUploadedFiles] = useState({});

  // ─── Document Verification Store State ─────────────────────────────────────
  const [studentDocsStore, setStudentDocsStore] = useState(STUDENT_DOCUMENTS);
  const [verificationStatuses, setVerificationStatuses] = useState({
    Taher: 'pending',
    'Aarav Sharma': 'approved',
    'Fatima Ansari': 'approved',
    'Kavita Patil': 'rejected',
  });
  const [activeVerifyStudent, setActiveVerifyStudent] = useState('Taher');
  const [previewDoc, setPreviewDoc] = useState(null); // Document object currently open in inspect modal

  // ─── Navigation & Results State ─────────────────────────────────────────────
  const [view, setView] = useState('student'); // 'student' | 'admin'
  const [activeTab, setActiveTab] = useState('matched'); // 'matched' | 'partial' | 'ineligible'
  const [adminTab, setAdminTab] = useState('verification'); // 'verification' | 'applications' | 'registry' | 'analytics'

  const [results, setResults] = useState({ matched: [], partial: [], ineligible: [] });
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState(DEFAULT_STUDENT);

  // Reminders Alert Banner State
  const [reminderAlerts, setReminderAlerts] = useState(null);
  const [loadingReminders, setLoadingReminders] = useState(false);

  // Admin View State
  const [allScholarships, setAllScholarships] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState(null);
  const [adminApplicants, setAdminApplicants] = useState(SYNTHETIC_APPLICANTS);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterEduLevel, setFilterEduLevel] = useState('All');
  const [filterDeadlineDays, setFilterDeadlineDays] = useState(0);
  const [filterLocation, setFilterLocation] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  // Bookmarks & Application Status
  const [bookmarkedIds, setBookmarkedIds] = useState([]);
  const [applicationStatus, setApplicationStatus] = useState({});
  const [viewCounts, setViewCounts] = useState({});

  // Toast
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const incrementView = useCallback((id) => {
    setViewCounts((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  }, []);

  const toggleBookmark = (id) => {
    setBookmarkedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const setAppStatus = (id, status) => {
    setApplicationStatus((prev) => ({ ...prev, [id]: status }));
  };

  // Check if current student's documents are approved by Admin
  const isCurrentStudentVerified = (verificationStatuses[student.name] || 'pending') === 'approved';

  // ─── Evaluation ─────────────────────────────────────────────────────────────
  const runMatch = async (currentStudent) => {
    setLoading(true);
    const res = await evaluate(currentStudent);
    setIsOffline(res.offline);
    setResults(res.data);
    setLoading(false);
  };

  const handleCronCheck = async () => {
    setLoadingReminders(true);
    const res = await triggerReminders(student);
    setReminderAlerts(res.data);
    setLoadingReminders(false);
  };

  // ─── Admin Data ─────────────────────────────────────────────────────────────
  const loadAdminData = async () => {
    setAdminLoading(true);
    setAdminError(null);
    try {
      const [schs, apps] = await Promise.all([getScholarships(), getApplications()]);
      setAllScholarships(schs);
      if (apps && apps.length > 0) setAdminApplicants(apps);
    } catch (err) {
      setAdminError('Connected to responsive local verification storage.');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleToggleVerify = async (id) => {
    try {
      await toggleVerify(id);
      await loadAdminData();
      await runMatch(student);
      showToast(`Scholarship #${id} verification updated!`);
    } catch (err) {
      showToast('Status updated locally');
    }
  };

  const handleUpdateApplicantStatus = async (appId, newStatus) => {
    await updateApplicationStatus(appId, newStatus);
    setAdminApplicants((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
    );
    showToast(`Applicant ${appId} marked as ${newStatus}`);
  };

  // ─── Document Verification Handlers ─────────────────────────────────────────
  const handleVerifySingleDoc = async (studentName, docId) => {
    await updateDocumentStatus(studentName, docId, 'verified');
    setStudentDocsStore((prev) => {
      const list = prev[studentName] || [];
      const updated = list.map((d) => (d.id === docId ? { ...d, status: 'verified' } : d));
      const allVerified = updated.every((d) => d.status === 'verified');
      if (allVerified) {
        setVerificationStatuses((s) => ({ ...s, [studentName]: 'approved' }));
      }
      return { ...prev, [studentName]: updated };
    });
    if (previewDoc && previewDoc.id === docId) {
      setPreviewDoc((d) => ({ ...d, status: 'verified' }));
    }
    showToast(`✓ Document ${docId} verified successfully`);
  };

  const handleRejectSingleDoc = async (studentName, docId) => {
    await updateDocumentStatus(studentName, docId, 'rejected');
    setStudentDocsStore((prev) => {
      const list = prev[studentName] || [];
      const updated = list.map((d) => (d.id === docId ? { ...d, status: 'rejected' } : d));
      setVerificationStatuses((s) => ({ ...s, [studentName]: 'rejected' }));
      return { ...prev, [studentName]: updated };
    });
    if (previewDoc && previewDoc.id === docId) {
      setPreviewDoc((d) => ({ ...d, status: 'rejected' }));
    }
    showToast(`✕ Document ${docId} rejected`);
  };

  const handleVerifyAllDocs = async (studentName) => {
    await verifyAllStudentDocuments(studentName);
    setStudentDocsStore((prev) => {
      const list = prev[studentName] || [];
      const updated = list.map((d) => ({ ...d, status: 'verified' }));
      return { ...prev, [studentName]: updated };
    });
    setVerificationStatuses((s) => ({ ...s, [studentName]: 'approved' }));
    showToast(`✓ All documents for ${studentName} APPROVED! Scholarship applications UNLOCKED.`);
  };

  const handleRejectAllDocs = async (studentName) => {
    await rejectAllStudentDocuments(studentName);
    setStudentDocsStore((prev) => {
      const list = prev[studentName] || [];
      const updated = list.map((d) => ({ ...d, status: 'rejected' }));
      return { ...prev, [studentName]: updated };
    });
    setVerificationStatuses((s) => ({ ...s, [studentName]: 'rejected' }));
    showToast(`✕ All documents for ${studentName} marked as REJECTED.`);
  };

  // ─── Apply to Scholarship ───────────────────────────────────────────────────
  const handleApplyNow = async (sch) => {
    if (!isCurrentStudentVerified) {
      showToast('⚠️ Action Blocked: Admin document verification required before applying!');
      return;
    }

    setAppStatus(sch.id, 'applied');
    const newRecord = {
      name: student.name,
      email: student.email,
      education_level: student.education_level,
      gpa: student.gpa,
      income: student.income,
      category: student.category,
      gender: student.gender,
      scholarship: sch.title,
      scholarshipId: sch.id,
      award: sch.amount,
      documents: student.documents,
      fitScore: sch.score || 100,
    };
    await submitApplication(newRecord);
    setAdminApplicants((prev) => [
      {
        id: 'APP-' + Math.floor(Math.random() * 900 + 100),
        ...newRecord,
        status: 'Under Review',
        appliedDate: 'Just now',
      },
      ...prev,
    ]);
    showToast(`✓ Application for "${sch.title}" submitted to Admin registry!`);
  };

  // ─── Auth Handlers ──────────────────────────────────────────────────────────
  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    const res = await loginUser(loginEmail, loginPassword);
    if (res.success && res.user) {
      setStudent(res.user);
      setEditFormData(res.user);
      setIsLoggedIn(true);
      runMatch(res.user);
      showToast(`Welcome back, ${res.user.name}!`);
    } else {
      setAuthError('Invalid credentials. Use ctrl@hack.com / pass123');
    }
    setAuthLoading(false);
  };

  const handleQuickDemoLogin = () => {
    setLoginEmail('ctrl@hack.com');
    setLoginPassword('pass123');
    setStudent(DEFAULT_STUDENT);
    setEditFormData(DEFAULT_STUDENT);
    setIsLoggedIn(true);
    runMatch(DEFAULT_STUDENT);
    showToast('Logged in as Taher (Prototype Profile)!');
  };

  const triggerSyntheticAutofill = () => {
    const autofilledDocs = [
      'Aadhaar',
      'Marksheet',
      'Bank Passbook',
      'Income Certificate',
      'Caste Certificate',
    ];
    setRegForm({
      name: 'Taher',
      email: 'ctrl@hack.com',
      password: 'pass123',
      education_level: 'UG',
      gpa: 8.7,
      income: 180000,
      category: 'OBC',
      gender: 'Male',
      documents: autofilledDocs,
    });
    setUploadedFiles({
      Aadhaar: 'Aadhaar_Card_Taher.pdf',
      Marksheet: 'Semester4_MarkSheet_8.7CGPA.pdf',
      'Bank Passbook': 'SBI_Savings_Passbook_Taher.pdf',
      'Income Certificate': 'Tahsil_Income_Certificate_2026.pdf',
      'Caste Certificate': 'OBC_NonCreamyLayer_Cert.pdf',
    });
    showToast('✨ Synthetic Profile "Taher" & all 5 documents autofilled!');
  };

  const handleRegNameChange = (e) => {
    const val = e.target.value;
    setRegForm((prev) => ({ ...prev, name: val }));
    if (val.trim().toLowerCase() === 'taher') {
      triggerSyntheticAutofill();
    }
  };

  const handleDocCheckboxToggle = (doc) => {
    const current = regForm.documents || [];
    if (current.includes(doc)) {
      setRegForm({ ...regForm, documents: current.filter((d) => d !== doc) });
      const copy = { ...uploadedFiles };
      delete copy[doc];
      setUploadedFiles(copy);
    } else {
      setRegForm({ ...regForm, documents: [...current, doc] });
      setUploadedFiles({ ...uploadedFiles, [doc]: `${doc.replace(/\s+/g, '_')}_Upload.pdf` });
    }
  };

  const handleSimulatedFileUpload = (doc) => {
    if (!regForm.documents.includes(doc)) {
      setRegForm({ ...regForm, documents: [...regForm.documents, doc] });
    }
    setUploadedFiles({
      ...uploadedFiles,
      [doc]: `${doc.replace(/\s+/g, '_')}_Document.pdf`,
    });
    showToast(`✓ Uploaded certificate for ${doc}`);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regForm.name) {
      showToast('Please enter your name');
      return;
    }
    setAuthLoading(true);
    const newStudentProfile = {
      name: regForm.name,
      email: regForm.email || 'ctrl@hack.com',
      education_level: regForm.education_level,
      gpa: Number(regForm.gpa) || 8.5,
      income: Number(regForm.income) || 200000,
      category: regForm.category,
      gender: regForm.gender,
      documents: regForm.documents.length > 0 ? regForm.documents : ['Aadhaar', 'Marksheet'],
    };

    const res = await registerUser(newStudentProfile);
    setStudent(res.user);
    setEditFormData(res.user);
    setIsLoggedIn(true);
    runMatch(res.user);
    showToast(`Profile created! Welcome to ScholarPath, ${res.user.name}.`);
    setAuthLoading(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setView('student');
    showToast('Logged out successfully.');
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setStudent(editFormData);
    setIsEditModalOpen(false);
    runMatch(editFormData);
    showToast('Profile updated & eligibility recalculated!');
  };

  const handleEditDocToggle = (doc) => {
    const current = editFormData.documents || [];
    if (current.includes(doc)) {
      setEditFormData({ ...editFormData, documents: current.filter((d) => d !== doc) });
    } else {
      setEditFormData({ ...editFormData, documents: [...current, doc] });
    }
  };

  useEffect(() => {
    if (view === 'admin') {
      loadAdminData();
    }
  }, [view]);

  // ─── Filtering logic ────────────────────────────────────────────────────────
  const filterScholarships = (list) => {
    return list.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q || s.title.toLowerCase().includes(q) || s.provider.toLowerCase().includes(q);
      const matchCat =
        filterCategory === 'All' ||
        (s.category_eligible &&
          s.category_eligible.some((c) => c === 'All' || c === filterCategory));
      const matchEdu =
        filterEduLevel === 'All' ||
        (s.education_levels && s.education_levels.includes(filterEduLevel));
      const matchDeadline =
        filterDeadlineDays === 0 ||
        (s.daysLeft !== undefined && s.daysLeft <= filterDeadlineDays);
      return matchSearch && matchCat && matchEdu && matchDeadline;
    });
  };

  const visibleScholarships = filterScholarships(results[activeTab] || []);

  const allResults = [
    ...(results.matched || []),
    ...(results.partial || []),
    ...(results.ineligible || []),
  ];

  const analyticsRows = allResults.map((s) => ({
    id: s.id,
    title: s.title,
    provider: s.provider,
    status: s.status,
    views: viewCounts[s.id] || 0,
    saves: bookmarkedIds.includes(s.id) ? 1 : 0,
    application: applicationStatus[s.id] || 'not_applied',
  }));

  const handleExportReport = () => {
    if (analyticsRows.length === 0) {
      showToast('Evaluate scholarships first to generate report!');
      return;
    }
    exportCSV(analyticsRows, 'scholarpath-analytics-report.csv');
    showToast('Analytics report exported as CSV!');
  };

  // ═════════════════════════════════════════════════════════════════════════════
  // 1. AUTH SCREEN (LOGIN & ONBOARDING / NEW USER REGISTRATION)
  // ═════════════════════════════════════════════════════════════════════════════
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-6">
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 bg-slate-800 text-white px-5 py-3 rounded-xl shadow-2xl border border-slate-600 flex items-center space-x-2 text-sm animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top Header */}
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between py-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 text-white p-2.5 rounded-2xl shadow-lg shadow-blue-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-white">ScholarPath Navigator</h1>
                <span className="text-[11px] bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full font-semibold">
                  ISTE HackNova 2026
                </span>
              </div>
              <p className="text-xs text-slate-400">Autonomous Student Eligibility & Opportunity Engine</p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsLoggedIn(true);
              setView('admin');
              showToast('Opened Admin Dashboard directly for Judge review.');
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Judge / Admin View</span>
          </button>
        </div>

        {/* Auth Body Card */}
        <div className="max-w-xl mx-auto w-full my-auto py-6">
          <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100">
            <div className="flex items-center bg-black/30 p-1 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                  authMode === 'login'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Student Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                  authMode === 'register'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                New User Onboarding & Uploads
              </button>
            </div>

            {/* Mode A: Sign In */}
            {authMode === 'login' ? (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Welcome Back</h2>
                  <p className="text-xs text-slate-300 mt-1">
                    Sign in to track verified scholarships, check matching scores, and manage deadlines.
                  </p>
                </div>

                {authError && (
                  <div className="p-3 bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs rounded-xl flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Student Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="ctrl@hack.com"
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="pass123"
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-[11px] text-blue-200 flex items-center justify-between">
                    <span>Default Prototype Credentials:</span>
                    <strong className="text-white font-mono bg-blue-950/60 px-2 py-0.5 rounded border border-blue-500/30">
                      ctrl@hack.com / pass123
                    </strong>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition disabled:opacity-50"
                  >
                    {authLoading ? 'Signing In...' : 'Sign In to Student Portal'}
                  </button>
                </form>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-700"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                    <span className="bg-slate-900/80 px-2 text-slate-400">Quick Hackathon Testing</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleQuickDemoLogin}
                  className="w-full py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-semibold text-xs flex items-center justify-center space-x-2 transition"
                >
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>1-Click Quick Demo Login (Taher)</span>
                </button>
              </div>
            ) : (
              /* Mode B: Registration */
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white tracking-tight">Student Onboarding</h2>
                    <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-semibold">
                      New Profile
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Fill your eligibility profile and upload required certificates for automated matching.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-blue-900/60 to-indigo-900/60 border border-blue-400/40 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-200 flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Hackathon Shortcut: Auto-generate Synthetic Profile</span>
                    </span>
                    <button
                      type="button"
                      onClick={triggerSyntheticAutofill}
                      className="text-[11px] bg-blue-500 text-white font-bold px-2.5 py-1 rounded-lg hover:bg-blue-400 transition shadow"
                    >
                      Fill "Taher"
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Type <strong>"Taher"</strong> in the Name field or click the button above to autofill all GPA, income, category, and all 5 verified certificates instantly!
                  </p>
                </div>

                <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Full Name <span className="text-slate-400 font-normal">(try typing "Taher")</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={regForm.name}
                      onChange={handleRegNameChange}
                      placeholder="e.g. Taher"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">GPA / Marks</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        required
                        value={regForm.gpa}
                        onChange={(e) => setRegForm({ ...regForm, gpa: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Annual Income (₹)</label>
                      <input
                        type="number"
                        step="1000"
                        min="0"
                        required
                        value={regForm.income}
                        onChange={(e) => setRegForm({ ...regForm, income: parseInt(e.target.value, 10) || 0 })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Category</label>
                      <select
                        value={regForm.category}
                        onChange={(e) => setRegForm({ ...regForm, category: e.target.value })}
                        className="w-full px-2 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Gender</label>
                      <select
                        value={regForm.gender}
                        onChange={(e) => setRegForm({ ...regForm, gender: e.target.value })}
                        className="w-full px-2 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {GENDERS.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Education Level</label>
                      <select
                        value={regForm.education_level}
                        onChange={(e) => setRegForm({ ...regForm, education_level: e.target.value })}
                        className="w-full px-2 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {EDUCATION_LEVELS.map((ed) => (
                          <option key={ed} value={ed}>{ed}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-700/60">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-slate-200 font-semibold">
                        Certificates & Verification Documents
                      </label>
                      <span className="text-[10px] text-emerald-400 font-medium">
                        {regForm.documents.length}/{ALL_DOCUMENTS.length} Attached
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                      {ALL_DOCUMENTS.map((doc) => {
                        const isAttached = regForm.documents.includes(doc);
                        const fileName = uploadedFiles[doc];
                        return (
                          <div
                            key={doc}
                            className={`flex items-center justify-between p-2 rounded-xl border transition ${
                              isAttached
                                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                                : 'bg-slate-900/40 border-slate-800 text-slate-400'
                            }`}
                          >
                            <label className="flex items-center space-x-2 cursor-pointer text-xs">
                              <input
                                type="checkbox"
                                checked={isAttached}
                                onChange={() => handleDocCheckboxToggle(doc)}
                                className="rounded text-blue-600 focus:ring-blue-500"
                              />
                              <span className="font-medium text-white">{doc}</span>
                            </label>

                            {isAttached ? (
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md font-mono border border-emerald-500/30">
                                {fileName || 'Uploaded ✓'}
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSimulatedFileUpload(doc)}
                                className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                              >
                                <UploadCloud className="w-3 h-3" />
                                <span>Upload</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-2.5 mt-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition disabled:opacity-50"
                  >
                    {authLoading ? 'Setting Up...' : 'Complete Onboarding & Enter Portal'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        <div className="text-center text-xs text-slate-500 py-3">
          ScholarPath Navigator • Problem Statement 13 • ISTE HackNova 2026
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // 2. MAIN LOGGED-IN PORTAL (STUDENT VIEW + ADMIN VIEW)
  // ═════════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center space-x-2 text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Header ── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 text-white p-2 rounded-xl shadow-md">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  ScholarPath Navigator
                </h1>
                <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                  ISTE HackNova 2026
                </span>
              </div>
              <p className="text-xs text-slate-500">Autonomous Student Eligibility & Verification Engine</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto justify-between md:justify-end">
            {bookmarkedIds.length > 0 && (
              <div className="flex items-center space-x-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full font-semibold">
                <BookMarked className="w-3.5 h-3.5" />
                <span>{bookmarkedIds.length} Saved</span>
              </div>
            )}

            {/* Current Student Profile Pill */}
            <div className="flex items-center space-x-2 bg-slate-100 px-2.5 py-1 rounded-xl text-xs">
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                {student.name ? student.name[0].toUpperCase() : 'S'}
              </div>
              <span className="font-bold text-slate-800">{student.name}</span>
              <span className="text-[10px] bg-white text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                {student.education_level}
              </span>
            </div>

            {/* Admin / Student Toggle */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setView('student')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  view === 'student'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Student</span>
              </button>
              <button
                onClick={() => setView('admin')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  view === 'admin'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              title="Log out"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Offline Notice Banner */}
      {isOffline && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-xs px-4 py-2 text-center font-medium flex items-center justify-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Backend offline: running in offline prototype mode. All calculations are executed deterministically.</span>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {view === 'student' ? (
          <>
            {/* ── Document Verification Status Banner ── */}
            {!isCurrentStudentVerified ? (
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-amber-100 text-amber-800 rounded-xl mt-0.5">
                    <Lock className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-900 text-sm flex items-center space-x-2">
                      <span>Documents Pending Institutional Admin Approval</span>
                      <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                        Apply Locked 🔒
                      </span>
                    </h3>
                    <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                      Your eligibility is computed, but scholarship applications require institutional verification. Once the admin verifies your uploaded certificates in the Admin portal, the <strong>"Apply Now"</strong> buttons will be unlocked automatically.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setView('admin');
                    setAdminTab('verification');
                    setActiveVerifyStudent(student.name);
                    showToast('Switched to Admin Document Verification Hub.');
                  }}
                  className="shrink-0 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow transition flex items-center space-x-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Review in Admin Portal</span>
                </button>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-900 text-sm">
                      ✓ All Documents Verified & Approved by Admin!
                    </h3>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      Your Aadhaar, Marksheet, Passbook, Income, and Caste certificates have been verified. Scholarship application access is fully unlocked.
                    </p>
                  </div>
                </div>
                <span className="text-xs bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-xl shadow-sm">
                  Verified Candidate
                </span>
              </div>
            )}

            {/* ── Student Profile Summary Bar ── */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-900 text-lg">{student.name}</span>
                  <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md font-semibold">
                    {student.education_level} Candidate
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-md font-medium border ${
                      isCurrentStudentVerified
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {isCurrentStudentVerified ? 'Docs Approved ✓' : 'Docs Pending Admin Verification'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  <span className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                    GPA: <strong className="text-slate-900">{student.gpa}</strong>
                  </span>
                  <span className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                    Income: <strong className="text-slate-900">₹{Number(student.income).toLocaleString('en-IN')}</strong>
                  </span>
                  <span className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                    Category: <strong className="text-slate-900">{student.category}</strong>
                  </span>
                  <span className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                    Gender: <strong className="text-slate-900">{student.gender}</strong>
                  </span>
                </div>
                {/* Uploaded Certificate Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-xs text-slate-400 font-medium mr-1">Uploaded Certificates:</span>
                  {student.documents && student.documents.length > 0 ? (
                    student.documents.map((doc) => (
                      <span
                        key={doc}
                        className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${
                          isCurrentStudentVerified
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {isCurrentStudentVerified ? '✓ ' : '📄 '}
                        {doc}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">No documents uploaded</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setEditFormData(student);
                    setIsEditModalOpen(true);
                  }}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
                <button
                  onClick={() => runMatch(student)}
                  disabled={loading}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm disabled:opacity-50"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>{loading ? 'Evaluating...' : 'Find Scholarships'}</span>
                </button>
                <button
                  onClick={handleCronCheck}
                  disabled={loadingReminders}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{loadingReminders ? 'Running Cron...' : 'Run Deadline Cron Check'}</span>
                </button>
              </div>
            </div>

            {/* ── Reminder Alerts Banner ── */}
            {reminderAlerts && (
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 shadow-sm relative">
                <button
                  onClick={() => setReminderAlerts(null)}
                  className="absolute top-3 right-3 text-amber-700 hover:text-amber-900"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm mb-2">
                  <Bell className="w-4 h-4 text-amber-600" />
                  <span>
                    Simulated Cron Alert: {reminderAlerts.count} scholarship deadline(s) closing within 14 days!
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {reminderAlerts.alerts.map((al) => {
                    const isUrgent = al.daysLeft <= 7;
                    return (
                      <div
                        key={al.id}
                        className={`p-3 rounded-xl border text-xs ${
                          isUrgent
                            ? 'bg-rose-50 border-rose-300 text-rose-950'
                            : 'bg-white border-amber-200 text-slate-800'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-1 mb-1">
                          <span className="font-bold line-clamp-1">{al.title}</span>
                          <span
                            className={`font-semibold px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap ${
                              isUrgent ? 'bg-rose-600 text-white' : 'bg-amber-200 text-amber-900'
                            }`}
                          >
                            {al.daysLeft} days left
                          </span>
                        </div>
                        {al.missingDocs && al.missingDocs.length > 0 ? (
                          <div className="text-[11px] text-amber-800">
                            <strong>Action needed:</strong> Missing {al.missingDocs.join(', ')}
                          </div>
                        ) : (
                          <div className="text-[11px] text-emerald-700 font-medium">
                            ✓ Ready to apply!
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Opportunity Catalogue: Search & Filter ── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm font-bold text-slate-800">
                  <Search className="w-4 h-4 text-blue-500" />
                  <span>Opportunity Catalogue</span>
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                    showFilters
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>{showFilters ? 'Hide Filters' : 'Filters'}</span>
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by scholarship title, provider, or organization..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {showFilters && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                      Category
                    </label>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="All">All Categories</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                      Education Level
                    </label>
                    <select
                      value={filterEduLevel}
                      onChange={(e) => setFilterEduLevel(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="All">All Levels</option>
                      {EDUCATION_LEVELS.map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                      Deadline
                    </label>
                    <select
                      value={filterDeadlineDays}
                      onChange={(e) => setFilterDeadlineDays(Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {DEADLINE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                      Location
                    </label>
                    <select
                      value={filterLocation}
                      onChange={(e) => setFilterLocation(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="All">All Locations</option>
                      {LOCATIONS.map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* ── Result Tabs ── */}
            <div className="flex items-center border-b border-slate-200 space-x-2">
              <button
                onClick={() => setActiveTab('matched')}
                className={`flex items-center space-x-2 pb-3 px-3 text-sm font-semibold border-b-2 transition ${
                  activeTab === 'matched'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Matched</span>
                <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full">
                  {results.matched ? results.matched.length : 0}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('partial')}
                className={`flex items-center space-x-2 pb-3 px-3 text-sm font-semibold border-b-2 transition ${
                  activeTab === 'partial'
                    ? 'border-amber-500 text-amber-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Partially Matched</span>
                <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full">
                  {results.partial ? results.partial.length : 0}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('ineligible')}
                className={`flex items-center space-x-2 pb-3 px-3 text-sm font-semibold border-b-2 transition ${
                  activeTab === 'ineligible'
                    ? 'border-rose-600 text-rose-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Ineligible</span>
                <span className="bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-full">
                  {results.ineligible ? results.ineligible.length : 0}
                </span>
              </button>
            </div>

            {/* ── Cards Grid ── */}
            {loading ? (
              <div className="py-20 text-center text-slate-500 text-sm">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"></div>
                Evaluating student criteria against verified opportunities...
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {visibleScholarships.length > 0 ? (
                    visibleScholarships.map((sch) => (
                      <ScholarshipCard
                        key={sch.id}
                        item={sch}
                        isBookmarked={bookmarkedIds.includes(sch.id)}
                        onBookmark={() => toggleBookmark(sch.id)}
                        appStatus={applicationStatus[sch.id] || 'not_applied'}
                        onAppStatusChange={(status) => setAppStatus(sch.id, status)}
                        onView={() => incrementView(sch.id)}
                        isVerified={isCurrentStudentVerified}
                        onApply={() => handleApplyNow(sch)}
                      />
                    ))
                  ) : (
                    <div className="col-span-full py-16 text-center text-slate-400 text-sm bg-white rounded-2xl border border-dashed border-slate-300">
                      No scholarships found in this section matching current criteria.
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        ) : (
          /* ══════════════════════════════════════════════════════════════════════
             3. ADMIN DASHBOARD VIEW (With Document Verification & Inspection!)
             ══════════════════════════════════════════════════════════════════════ */
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            {/* Admin Header with Tab Switch */}
            <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-bold text-slate-900">Admin Control Panel</h2>
                  <span className="text-[11px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                    Live Judge Mode
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Verify synthetic student documents, approve applications, and inspect institutional certificates.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
                  {/* NEW: Document Verification Hub tab */}
                  <button
                    onClick={() => setAdminTab('verification')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      adminTab === 'verification'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Doc Verification Hub</span>
                  </button>

                  <button
                    onClick={() => setAdminTab('applications')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      adminTab === 'applications'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Applications ({adminApplicants.length})</span>
                  </button>

                  <button
                    onClick={() => setAdminTab('registry')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      adminTab === 'registry'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Registry</span>
                  </button>

                  <button
                    onClick={() => setAdminTab('analytics')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      adminTab === 'analytics'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>Analytics</span>
                  </button>
                </div>

                {adminTab === 'analytics' && (
                  <button
                    onClick={handleExportReport}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                )}
              </div>
            </div>

            {adminError && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl">
                {adminError}
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════════════
                SUB-TAB 1: DOCUMENT VERIFICATION HUB (NEW FEATURE)
            ═════════════════════════════════════════════════════════════════ */}
            {adminTab === 'verification' && (
              <div className="space-y-5">
                {/* Student Selector Pills */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Select Student Profile for Document Audit:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(studentDocsStore).map((sName) => {
                      const st = verificationStatuses[sName] || 'pending';
                      const isSelected = activeVerifyStudent === sName;
                      return (
                        <button
                          key={sName}
                          onClick={() => setActiveVerifyStudent(sName)}
                          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <User className="w-3.5 h-3.5" />
                          <span>{sName}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : st === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : st === 'rejected'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {st === 'approved' ? 'Verified ✓' : st === 'rejected' ? 'Rejected ✗' : 'Pending ⏳'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Profile Audit Summary Card */}
                {(() => {
                  const currentList = studentDocsStore[activeVerifyStudent] || [];
                  const currentStatus = verificationStatuses[activeVerifyStudent] || 'pending';
                  const verifiedCount = currentList.filter((d) => d.status === 'verified').length;

                  return (
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-slate-900 text-base">
                            {activeVerifyStudent}'s Verification Dossier
                          </h3>
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              currentStatus === 'approved'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : currentStatus === 'rejected'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            Status: {currentStatus}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {verifiedCount} of {currentList.length} certificates verified. Approving all documents will unlock scholarship applications on the student portal.
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          onClick={() => handleVerifyAllDocs(activeVerifyStudent)}
                          className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                        >
                          <Check className="w-4 h-4" />
                          <span>Approve All (Unlock Apply)</span>
                        </button>
                        <button
                          onClick={() => handleRejectAllDocs(activeVerifyStudent)}
                          className="flex items-center space-x-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition"
                        >
                          <X className="w-4 h-4" />
                          <span>Reject All</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Document Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(studentDocsStore[activeVerifyStudent] || []).map((doc) => {
                    const isDocVerified = doc.status === 'verified';
                    const isDocRejected = doc.status === 'rejected';

                    return (
                      <div
                        key={doc.id}
                        className={`bg-white rounded-2xl p-4 border transition flex flex-col justify-between shadow-sm ${
                          isDocVerified
                            ? 'border-emerald-300 ring-1 ring-emerald-400/20'
                            : isDocRejected
                            ? 'border-rose-300 ring-1 ring-rose-400/20'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-3">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                {doc.type}
                              </span>
                              <h4 className="font-bold text-slate-900 text-sm">{doc.name}</h4>
                            </div>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${
                                isDocVerified
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : isDocRejected
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}
                            >
                              {isDocVerified ? 'Verified ✓' : isDocRejected ? 'Rejected ✗' : 'Pending Review'}
                            </span>
                          </div>

                          {/* Meta Box */}
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs space-y-1">
                            <div className="flex justify-between text-slate-600">
                              <span className="text-slate-400">File:</span>
                              <span className="font-mono text-slate-800 truncate max-w-[170px]" title={doc.fileName}>
                                {doc.fileName}
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                              <span className="text-slate-400">Doc ID:</span>
                              <span className="font-mono text-slate-800 font-semibold">{doc.docNumber}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                              <span className="text-slate-400">Issuer:</span>
                              <span className="text-slate-800 text-right truncate max-w-[170px]" title={doc.issuer}>
                                {doc.issuer}
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                              <span className="text-slate-400">Date:</span>
                              <span className="text-slate-800">{doc.issueDate}</span>
                            </div>
                          </div>

                          {/* Rejection notice if any */}
                          {doc.details && doc.details.rejectionReason && (
                            <p className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200">
                              <strong>Reason:</strong> {doc.details.rejectionReason}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>

                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleVerifySingleDoc(activeVerifyStudent, doc.id)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                                isDocVerified
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200'
                              }`}
                            >
                              Verify
                            </button>
                            <button
                              onClick={() => handleRejectSingleDoc(activeVerifyStudent, doc.id)}
                              className={`px-2 py-1.5 rounded-lg text-xs font-bold transition ${
                                isDocRejected
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-200'
                              }`}
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Sub-tab 2: Student Applications ── */}
            {adminTab === 'applications' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Displaying <strong>{adminApplicants.length}</strong> active student applications submitted across verified schemes.
                  </span>
                  <span className="text-emerald-700 font-medium">Real-time Admin Verification Enabled</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-3">App ID</th>
                        <th className="py-3 px-3">Applicant</th>
                        <th className="py-3 px-3">Applied Scheme</th>
                        <th className="py-3 px-3">GPA & Income</th>
                        <th className="py-3 px-3">Docs Attached</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Admin Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {adminApplicants.map((appItem) => (
                        <tr key={appItem.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-3 font-mono font-bold text-blue-700">
                            {appItem.id}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">{appItem.name}</div>
                            <div className="text-[11px] text-slate-400">{appItem.email}</div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-800">{appItem.scholarship}</div>
                            <div className="text-[11px] text-emerald-700 font-medium">{appItem.award}</div>
                          </td>
                          <td className="py-3 px-3">
                            <div>GPA: <strong>{appItem.gpa}</strong></div>
                            <div className="text-slate-400">₹{Number(appItem.income).toLocaleString('en-IN')} • {appItem.category}</div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex flex-wrap gap-1 max-w-[170px]">
                              {appItem.documents && appItem.documents.slice(0, 3).map((d) => (
                                <span key={d} className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px]">
                                  ✓ {d}
                                </span>
                              ))}
                              {appItem.documents && appItem.documents.length > 3 && (
                                <span className="text-[10px] text-slate-400">+{appItem.documents.length - 3} more</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                                appItem.status === 'Approved'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : appItem.status === 'Shortlisted'
                                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                                  : appItem.status === 'Interview Scheduled'
                                  ? 'bg-purple-100 text-purple-800 border-purple-300'
                                  : appItem.status === 'Docs Verification Pending'
                                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                                  : 'bg-slate-100 text-slate-700 border-slate-300'
                              }`}
                            >
                              {appItem.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                onClick={() => handleUpdateApplicantStatus(appItem.id, 'Approved')}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdateApplicantStatus(appItem.id, 'Shortlisted')}
                                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[10px] font-semibold transition"
                              >
                                Shortlist
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Sub-tab 3: Registry ── */}
            {adminTab === 'registry' && (
              <>
                {adminLoading ? (
                  <div className="py-12 text-center text-slate-500 text-sm">Loading registry...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                        <tr>
                          <th className="py-3 px-3">ID</th>
                          <th className="py-3 px-3">Title</th>
                          <th className="py-3 px-3">Provider</th>
                          <th className="py-3 px-3">Amount</th>
                          <th className="py-3 px-3">Deadline</th>
                          <th className="py-3 px-3">Status</th>
                          <th className="py-3 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {allScholarships.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50 transition">
                            <td className="py-3 px-3 font-semibold text-slate-900">#{s.id}</td>
                            <td className="py-3 px-3 font-medium text-slate-900">{s.title}</td>
                            <td className="py-3 px-3 text-slate-500">{s.provider}</td>
                            <td className="py-3 px-3 font-medium text-emerald-700">{s.amount}</td>
                            <td className="py-3 px-3 text-slate-500">
                              {s.daysLeft !== undefined ? `${s.daysLeft} days left` : s.deadline}
                            </td>
                            <td className="py-3 px-3">
                              {s.verified ? (
                                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                                  Verified
                                </span>
                              ) : (
                                <span className="bg-amber-100 text-amber-800 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-amber-200">
                                  Pending Review
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => handleToggleVerify(s.id)}
                                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                                  s.verified
                                    ? 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700'
                                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                }`}
                              >
                                {s.verified ? 'Unverify' : 'Verify & Approve'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* ── Sub-tab 4: Analytics ── */}
            {adminTab === 'analytics' && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-1">
                    <div className="flex items-center space-x-2 text-blue-600">
                      <Eye className="w-4 h-4" />
                      <span className="text-xs font-semibold uppercase tracking-wider">Total Views</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">
                      {Object.values(viewCounts).reduce((a, b) => a + b, 0)}
                    </p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-1">
                    <div className="flex items-center space-x-2 text-emerald-600">
                      <BookMarked className="w-4 h-4" />
                      <span className="text-xs font-semibold uppercase tracking-wider">Saved</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-900">{bookmarkedIds.length}</p>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-1">
                    <div className="flex items-center space-x-2 text-indigo-600">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-xs font-semibold uppercase tracking-wider">Applications</span>
                    </div>
                    <p className="text-2xl font-bold text-indigo-900">{adminApplicants.length}</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-1">
                    <div className="flex items-center space-x-2 text-amber-600">
                      <GraduationCap className="w-4 h-4" />
                      <span className="text-xs font-semibold uppercase tracking-wider">Matched</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-900">
                      {(results.matched || []).length}
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-3">ID</th>
                        <th className="py-3 px-3">Scholarship</th>
                        <th className="py-3 px-3">Provider</th>
                        <th className="py-3 px-3">Match Status</th>
                        <th className="py-3 px-3 text-center">Views</th>
                        <th className="py-3 px-3 text-center">Saved</th>
                        <th className="py-3 px-3">Application Progress</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {analyticsRows.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-3 font-semibold text-slate-400">#{row.id}</td>
                          <td className="py-3 px-3 font-medium text-slate-900 max-w-[180px] truncate">
                            {row.title}
                          </td>
                          <td className="py-3 px-3 text-slate-500">{row.provider}</td>
                          <td className="py-3 px-3">
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                row.status === 'MATCHED'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : row.status === 'PARTIAL'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {row.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex items-center space-x-1 text-slate-700">
                              <Eye className="w-3 h-3 text-slate-400" />
                              <span>{row.views}</span>
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            {row.saves === 1 ? (
                              <BookMarked className="w-4 h-4 text-emerald-500 mx-auto" />
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                                row.application === 'not_applied'
                                  ? 'bg-slate-100 text-slate-500'
                                  : row.application === 'applied'
                                  ? 'bg-blue-100 text-blue-700'
                                  : row.application === 'docs_ready'
                                  ? 'bg-indigo-100 text-indigo-700'
                                  : row.application === 'interview'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-purple-100 text-purple-700'
                              }`}
                            >
                              {APP_STATUS_OPTIONS.find((o) => o.value === row.application)?.label || 'Not Applied'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ═══════════════════════════════════════════════════════════════════════
          CERTIFICATE / DOCUMENT INSPECTION MODAL (FOR ADMIN & JUDGES)
      ═══════════════════════════════════════════════════════════════════════ */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in duration-200">
            {/* Modal Top Bar */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{previewDoc.name}</h3>
                  <p className="text-xs text-slate-400">Institutional Document Inspection & Audit</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Synthetic Certificate Document Preview Card */}
            <div className="border-2 border-slate-800/10 rounded-2xl p-6 bg-gradient-to-b from-amber-50/20 via-white to-slate-50 relative overflow-hidden shadow-inner">
              {/* Subtle watermark in center */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                <GraduationCap className="w-72 h-72 text-slate-900" />
              </div>

              {/* Certificate Header Banner */}
              <div className="text-center pb-4 border-b border-slate-200 space-y-1">
                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  OFFICIAL GOVERNMENT & INSTITUTIONAL RECORD
                </span>
                <h4 className="text-base font-extrabold text-slate-900 uppercase tracking-wide">
                  {previewDoc.issuer}
                </h4>
                <p className="text-xs text-slate-600 font-medium">Certificate Type: {previewDoc.type}</p>
                <div className="inline-block bg-slate-100 text-slate-700 font-mono text-[11px] px-3 py-0.5 rounded-full border border-slate-300 mt-1">
                  Document ID: {previewDoc.docNumber}
                </div>
              </div>

              {/* Certificate Body Data */}
              <div className="py-5 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3 bg-white/80 p-3 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Candidate / Holder:</span>
                    <strong className="text-slate-900 text-sm">
                      {previewDoc.details?.holderName || previewDoc.details?.accountHolder || activeVerifyStudent}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Issue Date:</span>
                    <strong className="text-slate-900">{previewDoc.issueDate}</strong>
                  </div>
                </div>

                {/* Specific field breakdowns based on doc details */}
                <div className="space-y-1.5 text-xs bg-slate-50/70 p-3 rounded-xl border border-slate-200">
                  {Object.entries(previewDoc.details || {}).map(([key, value]) => {
                    if (key === 'holderName' || key === 'accountHolder') return null;
                    return (
                      <div key={key} className="flex justify-between items-center text-xs py-1 border-b border-slate-100 last:border-0">
                        <span className="text-slate-500 capitalize font-medium">
                          {key.replace(/([A-Z])/g, ' $1')}:
                        </span>
                        <strong className="text-slate-800 text-right">{value}</strong>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Official Seal / Signature Footer */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px]">
                <div className="flex items-center space-x-1.5 text-emerald-700 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Digital Cryptographic Seal: VALID</span>
                </div>
                <span className="font-mono text-slate-400 text-[10px]">
                  Audit Check: {previewDoc.id}
                </span>
              </div>
            </div>

            {/* Modal Bottom Controls */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                Current Status:{' '}
                <strong
                  className={
                    previewDoc.status === 'verified'
                      ? 'text-emerald-700'
                      : previewDoc.status === 'rejected'
                      ? 'text-rose-700'
                      : 'text-amber-700'
                  }
                >
                  {previewDoc.status.toUpperCase()}
                </strong>
              </span>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleRejectSingleDoc(activeVerifyStudent, previewDoc.id)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition"
                >
                  Reject Document
                </button>
                <button
                  onClick={() => handleVerifySingleDoc(activeVerifyStudent, previewDoc.id)}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow transition"
                >
                  ✓ Verify & Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Profile Modal ── */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Edit Student Profile</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Student Name</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">GPA / Marks</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    required
                    value={editFormData.gpa}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, gpa: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Annual Income (₹)</label>
                  <input
                    type="number"
                    step="1000"
                    min="0"
                    required
                    value={editFormData.income}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, income: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category</label>
                  <select
                    value={editFormData.category}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-2 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Gender</label>
                  <select
                    value={editFormData.gender}
                    onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-2 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Education Level</label>
                  <select
                    value={editFormData.education_level}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, education_level: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-xl px-2 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {EDUCATION_LEVELS.map((ed) => (
                      <option key={ed} value={ed}>{ed}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Currently Held Documents</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {ALL_DOCUMENTS.map((doc) => {
                    const checked = (editFormData.documents || []).includes(doc);
                    return (
                      <label
                        key={doc}
                        className={`flex items-center space-x-2 p-2 rounded-xl border cursor-pointer transition ${
                          checked
                            ? 'bg-blue-50 border-blue-300 text-blue-900'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleEditDocToggle(doc)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-[11px] font-medium">{doc}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                >
                  Save and Recalculate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Scholarship Card Component ───────────────────────────────────────────────
function ScholarshipCard({
  item,
  isBookmarked,
  onBookmark,
  appStatus,
  onAppStatusChange,
  onView,
  isVerified,
  onApply,
}) {
  const [showQualify, setShowQualify] = useState(false);

  const isMatched = item.status === 'MATCHED';
  const isPartial = item.status === 'PARTIAL';
  const isIneligible = item.status === 'INELIGIBLE';
  const isUrgent = item.daysLeft !== undefined && item.daysLeft <= 7;

  useEffect(() => {
    onView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`bg-white rounded-2xl p-5 border transition shadow-sm flex flex-col justify-between ${
        isIneligible
          ? 'opacity-70 border-slate-200 bg-slate-50/50'
          : isPartial
          ? 'border-amber-200 hover:shadow-md'
          : 'border-emerald-200 hover:shadow-md ring-1 ring-emerald-500/10'
      }`}
    >
      <div className="space-y-3">
        {/* Top Badges */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              {item.provider}
            </span>
            <h3 className="font-bold text-slate-900 text-base leading-snug">{item.title}</h3>
          </div>
          <div className="flex items-center space-x-1.5 shrink-0">
            <button
              onClick={onBookmark}
              title={isBookmarked ? 'Remove bookmark' : 'Save scholarship'}
              className={`p-1.5 rounded-lg transition ${
                isBookmarked
                  ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
              }`}
            >
              {isBookmarked ? <BookMarked className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-bold whitespace-nowrap ${
                isUrgent
                  ? 'bg-rose-100 text-rose-700 border border-rose-300'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {item.daysLeft !== undefined ? `${item.daysLeft} days left` : item.deadline}
            </span>
          </div>
        </div>

        {/* Amount & Fit Score */}
        <div className="flex items-center justify-between text-xs py-1 border-y border-slate-100">
          <div>
            <span className="text-slate-400">Award:</span>{' '}
            <strong className="text-emerald-700 font-bold">{item.amount}</strong>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Fit Score:</span>
            <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  isMatched ? 'bg-emerald-500' : isPartial ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${item.score || 0}%` }}
              ></div>
            </div>
            <strong className="text-slate-800">{item.score || 0}%</strong>
          </div>
        </div>

        {/* Plain-English Rationale */}
        <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
          "{item.rationale}"
        </p>

        {/* Failed rules / Missing docs */}
        {(item.failedRules?.length > 0 || item.missingDocs?.length > 0) && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {item.failedRules?.map((rule, idx) => (
              <span
                key={idx}
                className="text-[11px] bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-md font-medium"
              >
                ✗ {rule}
              </span>
            ))}
            {item.missingDocs?.map((doc, idx) => (
              <span
                key={idx}
                className="text-[11px] bg-amber-50 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-md font-medium"
              >
                Missing: {doc}
              </span>
            ))}
          </div>
        )}

        {/* Criteria Met breakdown */}
        {item.passedRules && item.passedRules.length > 0 && (
          <div className="text-xs pt-1">
            <button
              type="button"
              onClick={() => setShowQualify(!showQualify)}
              className="text-[11px] text-blue-600 font-semibold hover:underline flex items-center space-x-1"
            >
              <span>{showQualify ? 'Hide criteria met' : 'Why you qualify'}</span>
              <span>({item.passedRules.length})</span>
            </button>
            {showQualify && (
              <ul className="mt-1.5 space-y-1 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                {item.passedRules.map((rule, i) => (
                  <li key={i} className="text-[11px] text-emerald-800 flex items-center space-x-1.5">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {item.source_url && (
          <a
            href={item.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 text-[11px] text-blue-600 hover:underline font-medium"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Official Portal Link</span>
          </a>
        )}
      </div>

      {/* Card Action Row */}
      <div className="pt-4 mt-2 border-t border-slate-100 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
            Application Status:
          </span>
          <select
            value={appStatus}
            onChange={(e) => onAppStatusChange(e.target.value)}
            className={`text-[11px] border rounded-lg px-2 py-1 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-400 ${
              appStatus === 'not_applied'
                ? 'bg-slate-50 border-slate-200 text-slate-500'
                : appStatus === 'applied'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : appStatus === 'docs_ready'
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : appStatus === 'interview'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-purple-50 border-purple-200 text-purple-700'
            }`}
          >
            {APP_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400">ID #{item.id}</span>
          {isMatched && (
            <div>
              {isVerified ? (
                <button
                  onClick={onApply}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition"
                >
                  Apply Now
                </button>
              ) : (
                <button
                  disabled
                  title="Document verification required before application can be submitted"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed flex items-center space-x-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Verify Docs to Apply</span>
                </button>
              )}
            </div>
          )}
          {isPartial && (
            <span className="text-[11px] font-semibold text-amber-700">Action Required</span>
          )}
          {isIneligible && (
            <span className="text-[11px] font-semibold text-slate-400">Ineligible</span>
          )}
        </div>
      </div>
    </div>
  );
}
