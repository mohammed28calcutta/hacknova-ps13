import { mockEvaluate, mockReminders } from './mock';

export async function evaluate(student) {
  try {
    const res = await fetch('/api/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student }),
    });
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
    const res = await fetch('/api/reminders/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student }),
    });
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const data = await res.json();
    return { offline: false, data };
  } catch (err) {
    console.warn('API triggerReminders unavailable, using mock fallback:', err.message);
    return { offline: true, data: mockReminders };
  }
}

export async function getScholarships() {
  const res = await fetch('/api/scholarships');
  if (!res.ok) throw new Error(`Server returned ${res.status}`);
  return await res.json();
}

export async function toggleVerify(id) {
  const res = await fetch(`/api/scholarships/${id}/verify`, {
    method: 'PATCH',
  });
  if (!res.ok) throw new Error(`Server returned ${res.status}`);
  return await res.json();
}
