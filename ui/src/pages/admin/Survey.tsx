import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { config } from '../../config/env';

interface Survey {
  id: string;
  name: string;
  actual_url: string;
  pass_mark_percent: number;
  invite_uuid: string;
  is_active: boolean;
}

interface Question {
  id: string;
  survey_id: string;
  question_text: string;
  control_type: 'radio' | 'checkbox' | 'true_false';
  correct_answers: string[];
  display_order: number;
}

const CONTROL_TYPES = ['radio', 'checkbox', 'true_false'] as const;

export default function AdminSurveyPage() {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [surveyForm, setSurveyForm] = useState({ name: '', actualUrl: '', passMarkPercent: 80, isActive: true });
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [qForm, setQForm] = useState({ questionText: '', controlType: 'radio' as string, correctAnswers: '', displayOrder: 0 });
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [error, setError] = useState('');

  async function fetchSurvey() {
    const [sRes, qRes] = await Promise.all([
      fetch(`${config.apiBaseUrl}/api/admin/surveys/${surveyId}`, { credentials: 'include' }),
      fetch(`${config.apiBaseUrl}/api/admin/surveys/${surveyId}/questions`, { credentials: 'include' }),
    ]);
    const s = await sRes.json();
    const q = await qRes.json();
    setSurvey(s);
    setSurveyForm({ name: s.name, actualUrl: s.actual_url, passMarkPercent: s.pass_mark_percent, isActive: s.is_active });
    setQuestions(q);
    setLoading(false);
  }

  useEffect(() => {
    fetchSurvey();
  }, [surveyId]);

  async function handleSaveSurvey(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${config.apiBaseUrl}/api/admin/surveys/${surveyId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(surveyForm),
      });
      if (!res.ok) throw new Error('Failed to update survey');
      const data = await res.json();
      setSurvey(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddQuestion(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const correctAnswers = qForm.correctAnswers.split(',').map((s) => s.trim()).filter(Boolean);
    if (correctAnswers.length === 0) {
      setError('At least one correct answer is required.');
      return;
    }
    try {
      const res = await fetch(`${config.apiBaseUrl}/api/admin/surveys/${surveyId}/questions`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...qForm, correctAnswers }),
      });
      if (!res.ok) throw new Error('Failed to add question');
      setShowAddQuestion(false);
      setQForm({ questionText: '', controlType: 'radio', correctAnswers: '', displayOrder: 0 });
      await fetchSurvey();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  }

  async function handleUpdateQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!editingQuestion) return;
    setError('');
    const correctAnswers = qForm.correctAnswers.split(',').map((s) => s.trim()).filter(Boolean);
    try {
      const res = await fetch(`${config.apiBaseUrl}/api/admin/questions/${editingQuestion.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...qForm, correctAnswers }),
      });
      if (!res.ok) throw new Error('Failed to update question');
      setEditingQuestion(null);
      await fetchSurvey();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  }

  async function handleDeleteQuestion(id: string) {
    if (!window.confirm('Delete this question?')) return;
    await fetch(`${config.apiBaseUrl}/api/admin/questions/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    await fetchSurvey();
  }

  function startEdit(q: Question) {
    setEditingQuestion(q);
    setQForm({
      questionText: q.question_text,
      controlType: q.control_type,
      correctAnswers: q.correct_answers.join(', '),
      displayOrder: q.display_order,
    });
  }

  if (loading) return <div style={styles.center}><p>Loading...</p></div>;

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <button onClick={() => navigate('/admin/dashboard')} style={styles.backButton}>← Dashboard</button>
        <span style={styles.logo}>PreGate</span>
      </nav>

      <main style={styles.main}>
        {error && <p style={styles.error}>{error}</p>}

        {/* Survey Details */}
        <section style={styles.section}>
          <h2 style={styles.sectionHeading}>Survey Details</h2>
          <form onSubmit={handleSaveSurvey} style={styles.form}>
            <div style={styles.grid2}>
              <div style={styles.field}>
                <label style={styles.label}>Name</label>
                <input style={styles.input} value={surveyForm.name}
                  onChange={(e) => setSurveyForm((f) => ({ ...f, name: e.target.value }))} required />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Pass Mark (%)</label>
                <input style={styles.input} type="number" min={1} max={100}
                  value={surveyForm.passMarkPercent}
                  onChange={(e) => setSurveyForm((f) => ({ ...f, passMarkPercent: Number(e.target.value) }))} required />
              </div>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Actual Survey URL</label>
              <input style={styles.input} type="url" value={surveyForm.actualUrl}
                onChange={(e) => setSurveyForm((f) => ({ ...f, actualUrl: e.target.value }))} required />
            </div>
            <div style={styles.field}>
              <label style={styles.checkLabel}>
                <input type="checkbox" checked={surveyForm.isActive}
                  onChange={(e) => setSurveyForm((f) => ({ ...f, isActive: e.target.checked }))} />
                <span>Active</span>
              </label>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Invite URL</label>
              <code style={styles.codeBlock}>{window.location.origin}/s/{survey?.invite_uuid}</code>
            </div>
            <button type="submit" disabled={saving} style={styles.primaryButton}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </section>

        {/* Questions */}
        <section style={styles.section}>
          <div style={styles.topBar}>
            <h2 style={styles.sectionHeading}>Questions</h2>
            <button onClick={() => setShowAddQuestion(true)} style={styles.primaryButton}>+ Add Question</button>
          </div>

          {(showAddQuestion || editingQuestion) && (
            <div style={styles.questionForm}>
              <h3 style={styles.subHeading}>{editingQuestion ? 'Edit Question' : 'New Question'}</h3>
              <form onSubmit={editingQuestion ? handleUpdateQuestion : handleAddQuestion} style={styles.form}>
                <div style={styles.field}>
                  <label style={styles.label}>Question Text</label>
                  <textarea style={styles.textarea} value={qForm.questionText}
                    onChange={(e) => setQForm((f) => ({ ...f, questionText: e.target.value }))} required rows={3} />
                </div>
                <div style={styles.grid2}>
                  <div style={styles.field}>
                    <label style={styles.label}>Control Type</label>
                    <select style={styles.input} value={qForm.controlType}
                      onChange={(e) => setQForm((f) => ({ ...f, controlType: e.target.value }))}>
                      {CONTROL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Display Order</label>
                    <input style={styles.input} type="number" min={0} value={qForm.displayOrder}
                      onChange={(e) => setQForm((f) => ({ ...f, displayOrder: Number(e.target.value) }))} />
                  </div>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Correct Answers (comma-separated)</label>
                  <input style={styles.input} value={qForm.correctAnswers}
                    onChange={(e) => setQForm((f) => ({ ...f, correctAnswers: e.target.value }))}
                    placeholder="e.g. True  or  Option A, Option C"
                    required />
                </div>
                <div style={styles.buttonRow}>
                  <button type="button" onClick={() => { setShowAddQuestion(false); setEditingQuestion(null); }} style={styles.secondaryButton}>Cancel</button>
                  <button type="submit" style={styles.primaryButton}>{editingQuestion ? 'Update' : 'Add'}</button>
                </div>
              </form>
            </div>
          )}

          {questions.length === 0 ? (
            <p style={styles.muted}>No questions yet. Add your first question above.</p>
          ) : (
            <div style={styles.questionList}>
              {questions.map((q, i) => (
                <div key={q.id} style={styles.questionCard}>
                  <div style={styles.questionHeader}>
                    <span style={styles.questionNumber}>Q{i + 1}</span>
                    <span style={styles.controlTypeBadge}>{q.control_type}</span>
                  </div>
                  <p style={styles.questionText}>{q.question_text}</p>
                  <p style={styles.answers}>Correct: {q.correct_answers.join(', ')}</p>
                  <div style={styles.questionActions}>
                    <button onClick={() => startEdit(q)} style={styles.linkButton}>Edit</button>
                    <button onClick={() => handleDeleteQuestion(q.id)} style={{ ...styles.linkButton, color: '#e53e3e' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#f5f7fa' },
  nav: {
    background: '#fff',
    borderBottom: '1px solid #e2e8f0',
    padding: '0 2rem',
    height: 56,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: { fontWeight: 800, color: '#4361ee', fontSize: '1rem' },
  backButton: {
    background: 'none',
    border: 'none',
    color: '#4361ee',
    cursor: 'pointer',
    fontSize: '0.9rem',
    padding: 0,
  },
  main: { maxWidth: 760, margin: '0 auto', padding: '2rem 1rem' },
  section: { background: '#fff', borderRadius: 10, padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  sectionHeading: { fontSize: '1.1rem', fontWeight: 700, color: '#1a1a2e', margin: '0 0 1.25rem' },
  subHeading: { fontSize: '1rem', fontWeight: 700, color: '#1a1a2e', margin: '0 0 1rem' },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.375rem' },
  label: { fontSize: '0.875rem', fontWeight: 500, color: '#4a5568' },
  checkLabel: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#4a5568', cursor: 'pointer' },
  input: {
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: '0.625rem 0.875rem',
    fontSize: '0.875rem',
    outline: 'none',
    color: '#1a1a2e',
  },
  textarea: {
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: '0.625rem 0.875rem',
    fontSize: '0.875rem',
    outline: 'none',
    color: '#1a1a2e',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  codeBlock: {
    display: 'block',
    background: '#f7fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: '0.625rem 0.875rem',
    fontSize: '0.8rem',
    color: '#4a5568',
    wordBreak: 'break-all',
  },
  primaryButton: {
    background: '#4361ee',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '0.5rem 1.25rem',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    alignSelf: 'flex-start',
  },
  secondaryButton: {
    background: '#fff',
    color: '#4a5568',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: '0.5rem 1.25rem',
    fontSize: '0.875rem',
    cursor: 'pointer',
  },
  buttonRow: { display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' },
  error: {
    color: '#e53e3e',
    fontSize: '0.875rem',
    background: '#fff5f5',
    padding: '0.75rem 1rem',
    borderRadius: 8,
    marginBottom: '1rem',
  },
  muted: { color: '#718096', fontSize: '0.9rem' },
  questionForm: { background: '#f7fafc', borderRadius: 10, padding: '1.25rem', marginBottom: '1rem', border: '1px solid #e2e8f0' },
  questionList: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  questionCard: { border: '1px solid #e2e8f0', borderRadius: 8, padding: '1rem' },
  questionHeader: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' },
  questionNumber: { fontWeight: 700, color: '#4361ee', fontSize: '0.875rem' },
  controlTypeBadge: {
    background: '#ebf4ff',
    color: '#2b6cb0',
    fontSize: '0.7rem',
    fontWeight: 600,
    padding: '0.1rem 0.5rem',
    borderRadius: 999,
    textTransform: 'uppercase',
  },
  questionText: { fontSize: '0.9rem', color: '#1a1a2e', margin: '0 0 0.25rem' },
  answers: { fontSize: '0.8rem', color: '#718096', margin: '0 0 0.75rem' },
  questionActions: { display: 'flex', gap: '0.75rem' },
  linkButton: { background: 'none', border: 'none', color: '#4361ee', cursor: 'pointer', fontSize: '0.875rem', padding: 0 },
  center: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' },
};
