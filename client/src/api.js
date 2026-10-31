import { mockEvaluate, mockReminders, mockApplications } from './mock';
import { DEFAULT_STUDENT, STUDENT_DOCUMENTS } from './presets';

// Helper with timeout to eliminate any UI lag if backend is not started
async function fetchWithTimeout(url, options = {}, timeoutMs = 1200) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

export async function loginUser(email, password) {
  try {
    const res = await fetchWithTimeout('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }, 1200);
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const data = await res.json();
    return { success: true, user: data.user };
  } catch (err) {
    console.warn('API login offline, using mock fallback:', err.message);
    if (email.trim().toLowerCase() === 'ctrl@hack.com' && password === 'pass123') {
      return { success: true, user: DEFAULT_STUDENT };
    }
    return {
      success: true,
      user: {
        ...DEFAULT_STUDENT,
        name: email.split('@')[0] || 'Taher',
        email,
      }
    };
  }
}

export async function registerUser(profile) {
  try {
    const res = await fetchWithTimeout('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    }, 1200);
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const data = await res.json();
    return { success: true, user: data.user };
  } catch (err) {
    console.warn('API register offline, using client fallback:', err.message);
    return { success: true, user: profile };
  }
}

export async function evaluate(student) {
  try {
    const res = await fetchWithTimeout('/api/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student }),
    }, 1200);
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const data = await res.json();
    return { offline: false, data };
  } catch (err) {
    console.warn('API evaluate unavailable, using mock fallback:', err.message);
    return { offline: true, data: mockEvaluate };
  }
}

export async function triggerReminders(student) {
  try {
    const res = await fetchWithTimeout('/api/reminders/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student }),
    }, 1200);
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const data = await res.json();
    return { offline: false, data };
  } catch (err) {
    console.warn('API triggerReminders unavailable, using mock fallback:', err.message);
    return { offline: true, data: mockReminders };
  }
}

export async function getScholarships() {
  const res = await fetchWithTimeout('/api/scholarships', {}, 1500);
  if (!res.ok) throw new Error(`Server returned ${res.status}`);
  return await res.json();
}

export async function toggleVerify(id) {
  const res = await fetchWithTimeout(`/api/scholarships/${id}/verify`, {
    method: 'PATCH',
  }, 1500);
  if (!res.ok) throw new Error(`Server returned ${res.status}`);
  return await res.json();
}

export async function getApplications() {
  try {
    const res = await fetchWithTimeout('/api/applications', {}, 1200);
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    return await res.json();
  } catch (err) {
    return mockApplications;
  }
}

export async function submitApplication(appData) {
  try {
    const res = await fetchWithTimeout('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appData),
    }, 1200);
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    return await res.json();
  } catch (err) {
    return {
      id: 'APP-' + Math.floor(Math.random() * 900 + 100),
      ...appData,
      status: 'Under Review',
      appliedDate: 'Just now',
    };
  }
}

export async function updateApplicationStatus(id, status) {
  try {
    const res = await fetchWithTimeout(`/api/applications/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }, 1200);
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    return await res.json();
  } catch (err) {
    return { id, status };
  }
}

// ── Document Verification API Helpers ──
export async function getStudentDocuments(studentName) {
  try {
    const res = await fetchWithTimeout(`/api/documents/${encodeURIComponent(studentName)}`, {}, 1200);
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    return await res.json();
  } catch (err) {
    return {
      documents: STUDENT_DOCUMENTS[studentName] || STUDENT_DOCUMENTS['Taher'] || [],
      status: studentName === 'Taher' ? 'pending' : 'approved',
    };
  }
}

export async function updateDocumentStatus(studentName, docId, status) {
  try {
    const res = await fetchWithTimeout(`/api/documents/${encodeURIComponent(studentName)}/${docId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }, 1200);
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    return await res.json();
  } catch (err) {
    return { success: true, status };
  }
}

export async function verifyAllStudentDocuments(studentName) {
  try {
    const res = await fetchWithTimeout(`/api/documents/${encodeURIComponent(studentName)}/verify-all`, {
      method: 'PATCH',
    }, 1200);
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    return await res.json();
  } catch (err) {
    return { success: true, status: 'approved' };
  }
}

export async function rejectAllStudentDocuments(studentName) {
  try {
    const res = await fetchWithTimeout(`/api/documents/${encodeURIComponent(studentName)}/reject-all`, {
      method: 'PATCH',
    }, 1200);
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    return await res.json();
  } catch (err) {
    return { success: true, status: 'rejected' };
  }
}
