import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

import { PRESETS, CATEGORIES, GENDERS, EDUCATION_LEVELS, ALL_DOCUMENTS } from './presets';
import { evaluate, triggerReminders, getScholarships, toggleVerify } from './api';

export default function App() {
  const [activePresetKey, setActivePresetKey] = useState('ananya');
  const [student, setStudent] = useState(PRESETS.ananya);
  const [view, setView] = useState('student'); // 'student' | 'admin'
  const [activeTab, setActiveTab] = useState('matched'); // 'matched' | 'partial' | 'ineligible'

  // Results & API State
  const [results, setResults] = useState({ matched: [], partial: [], ineligible: [] });
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState(PRESETS.ananya);

  // Reminders Alert Banner State
  const [reminderAlerts, setReminderAlerts] = useState(null);
  const [loadingReminders, setLoadingReminders] = useState(false);

  // Admin View State
  const [allScholarships, setAllScholarships] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState(null);

  // Toast / Alert notification
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Run evaluation
  const runMatch = async (currentStudent) => {
    setLoading(true);
    const res = await evaluate(currentStudent);
    setIsOffline(res.offline);
    setResults(res.data);
    setLoading(false);
  };

  // Run reminders check
  const handleCronCheck = async () => {
    setLoadingReminders(true);
    const res = await triggerReminders(student);
    setReminderAlerts(res.data);
    setLoadingReminders(false);
  };

  // Load Admin Scholarships
  const loadAdminScholarships = async () => {
    setAdminLoading(true);
    setAdminError(null);
    try {
      const data = await getScholarships();
      setAllScholarships(data);
    } catch (err) {
      setAdminError('Could not connect to backend server. Make sure port 5001 is running.');
    } finally {
      setAdminLoading(false);
    }
  };

  // Toggle Verification
  const handleToggleVerify = async (id) => {
    try {
      await toggleVerify(id);
      await loadAdminScholarships();
      await runMatch(student);
      showToast(`Scholarship #${id} status updated!`);
    } catch (err) {
      alert('Verification update failed: ' + err.message);
    }
  };

  // Initial load
  useEffect(() => {
    runMatch(PRESETS.ananya);
  }, []);

  // When switching to admin view
  useEffect(() => {
    if (view === 'admin') {
      loadAdminScholarships();
    }
  }, [view]);

  // Handle preset click
  const selectPreset = (key) => {
    setActivePresetKey(key);
    const selected = PRESETS[key];
    setStudent(selected);
    setEditFormData(selected);
    runMatch(selected);
    setReminderAlerts(null);
  };

  // Handle Edit Profile Save
  const handleSaveProfile = (e) => {
    e.preventDefault();
    setStudent(editFormData);
    setIsEditModalOpen(false);
    runMatch(editFormData);
    showToast('Profile updated & match recalculated!');
  };

  const handleDocToggle = (doc) => {
    const current = editFormData.documents || [];
    if (current.includes(doc)) {
      setEditFormData({
        ...editFormData,
        documents: current.filter((d) => d !== doc),
      });
    } else {
      setEditFormData({
        ...editFormData,
        documents: [...current, doc],
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center space-x-2 text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
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
              <p className="text-xs text-slate-500">Autonomous Student Eligibility & Deadline Engine</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto justify-between md:justify-end">
            {/* Presets */}
            <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl">
              {['ananya', 'rohan', 'priya'].map((key) => (
                <button
                  key={key}
                  onClick={() => selectPreset(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                    activePresetKey === key
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>

            {/* View Switch */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
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
          </div>
        </div>
      </header>

      {/* Offline Notice Banner */}
      {isOffline && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-xs px-4 py-2 text-center font-medium flex items-center justify-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Backend offline: showing sample fallback data (Ananya preset). Start server on port 5001 for live API.</span>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-6 space-x-0 space-y-6">
        {view === 'student' ? (
          <>
            {/* Student Profile Bar */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-900 text-lg">{student.name}</span>
                  <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                    {student.education_level}
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
                {/* Document Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-xs text-slate-400 font-medium mr-1">Held Documents:</span>
                  {student.documents && student.documents.length > 0 ? (
                    student.documents.map((doc) => (
                      <span
                        key={doc}
                        className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium"
                      >
                        ✓ {doc}
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

            {/* Reminder Alerts Banner (Simulated Scheduled Job) */}
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

            {/* Tabs */}
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

            {/* Tab Cards Content */}
            {loading ? (
              <div className="py-20 text-center text-slate-500 text-sm">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"></div>
                Analyzing scholarship eligibility criteria...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results[activeTab] && results[activeTab].length > 0 ? (
                  results[activeTab].map((sch) => (
                    <ScholarshipCard key={sch.id} item={sch} onApply={() => showToast('Demo Only: Direct Application link simulated!')} />
                  ))
                ) : (
                  <div className="col-span-full py-16 text-center text-slate-400 text-sm bg-white rounded-2xl border border-dashed border-slate-300">
                    No scholarships found in this section for the current profile.
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          /* Admin View */
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Scholarship Registry & Verification</h2>
                <p className="text-xs text-slate-500">
                  Admins can verify new partner listings to automatically release them into student matching.
                </p>
              </div>
              <button
                onClick={loadAdminScholarships}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-50"
              >
                Refresh
              </button>
            </div>

            {adminError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {adminError}
              </div>
            )}

            {adminLoading ? (
              <div className="py-12 text-center text-slate-500 text-sm">Loading scholarships...</div>
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
          </div>
        )}
      </main>

      {/* Edit Profile Modal */}
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
                    onChange={(e) => setEditFormData({ ...editFormData, gpa: parseFloat(e.target.value) || 0 })}
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
                    onChange={(e) => setEditFormData({ ...editFormData, income: parseInt(e.target.value, 10) || 0 })}
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
                    onChange={(e) => setEditFormData({ ...editFormData, education_level: e.target.value })}
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
                          onChange={() => handleDocToggle(doc)}
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
                  Save and Match
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Scholarship Card Helper Component
function ScholarshipCard({ item, onApply }) {
  const [showQualify, setShowQualify] = useState(false);

  const isMatched = item.status === 'MATCHED';
  const isPartial = item.status === 'PARTIAL';
  const isIneligible = item.status === 'INELIGIBLE';
  const isUrgent = item.daysLeft !== undefined && item.daysLeft <= 7;

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
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              {item.provider}
            </span>
            <h3 className="font-bold text-slate-900 text-base leading-snug">{item.title}</h3>
          </div>
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

        {/* Amount & Match Progress Score */}
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
                ✕ {rule}
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

        {/* Collapsible Why You Qualify */}
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
      </div>

      {/* Card Footer / Action */}
      <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[10px] text-slate-400">ID #{item.id}</span>
        {isMatched && (
          <button
            onClick={onApply}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition"
          >
            Apply Now
          </button>
        )}
        {isPartial && (
          <span className="text-[11px] font-semibold text-amber-700">Action Required</span>
        )}
        {isIneligible && (
          <span className="text-[11px] font-semibold text-slate-400">Ineligible</span>
        )}
      </div>
    </div>
  );
}
