import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../components/AuthContext';
import { config } from '../../config/env';

interface Survey {
  id: string;
  name: string;
  pass_mark_percent: number;
  invite_uuid: string;
  is_active: boolean;
  created_at: string;
  question_count?: number;
}

export default function AdminDashboard() {
  const { email, logout } = useAuth();
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: '',
    actualUrl: '',
    passMarkPercent: 80,
    questionsPerSession: 5,
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  async function fetchSurveys() {
    const res = await fetch(`${config.apiBaseUrl}/api/admin/surveys`, { credentials: 'include' });
    const data = await res.json();
    setSurveys(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchSurveys();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      const res = await fetch(`${config.apiBaseUrl}/api/admin/surveys`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to create survey');
      }
      setShowCreate(false);
      setForm({ name: '', actualUrl: '', passMarkPercent: 80, questionsPerSession: 5 });
      await fetchSurveys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create survey');
    } finally {
      setCreating(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/admin', { replace: true });
  }

  function inviteUrl(inviteUuid: string) {
    return `${window.location.origin}/s/${inviteUuid}`;
  }

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <span style={styles.logo}>PreGate</span>
        <div style={styles.navRight}>
          <span style={styles.navEmail}>{email}</span>
          <button onClick={handleLogout} style={styles.navButton}>Sign out</button>
        </div>
      </nav>

      <main style={styles.main}>
        <div style={styles.topBar}>
          <h1 style={styles.heading}>Surveys</h1>
          <button onClick={() => setShowCreate(true)} style={styles.primaryButton}>+ New Survey</button>
        </div>

        {showCreate && (
          <div style={styles.modal}>
            <div style={styles.modalCard}>
              <h2 style={styles.modalHeading}>Create Survey</h2>
              <p style={styles.createHint}>
                Each user will see <strong>{form.questionsPerSession}</strong> random questions from the global question pool.
              </p>
              <form onSubmit={handleCreate} style={{ ...styles.form, ...styles.createForm }}>
                <div style={styles.field}>
                  <label style={styles.label}>Survey Name</label>
                  <input
                    style={styles.input}
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Actual Survey URL</label>
                  <input
                    style={styles.input}
                    type="url"
                    value={form.actualUrl}
                    onChange={(e) => setForm((f) => ({ ...f, actualUrl: e.target.value }))}
                    required
                  />
                </div>
                <div style={styles.grid2}>
                  <div style={styles.field}>
                    <label style={styles.label}>Pass Mark (%)</label>
                    <input
                      style={styles.input}
                      type="number"
                      min={1}
                      max={100}
                      value={form.passMarkPercent}
                      onChange={(e) => setForm((f) => ({ ...f, passMarkPercent: Number(e.target.value) }))}
                      required
                    />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Questions per session</label>
                    <input
                      style={styles.input}
                      type="number"
                      min={0}
                      max={50}
                      value={form.questionsPerSession}
                      onChange={(e) => setForm((f) => ({ ...f, questionsPerSession: Number(e.target.value) }))}
                      title="Number of random questions shown to each user. 0 = show all."
                    />
                  </div>
                </div>
                {error && <p style={styles.error}>{error}</p>}
                <div style={styles.buttonRow}>
                  <button type="button" onClick={() => setShowCreate(false)} style={styles.secondaryButton}>Cancel</button>
                  <button type="submit" disabled={creating} style={styles.primaryButton}>
                    {creating ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <p style={styles.muted}>Loading...</p>
        ) : surveys.length === 0 ? (
          <div style={styles.empty}>
            <p>No surveys yet. Create your first survey to get started.</p>
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Pass Mark</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Created</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {surveys.map((s) => (
                  <tr key={s.id} style={styles.tr}>
                    <td style={styles.td}>
                      <strong>{s.name}</strong>
                      <br />
                      <small style={styles.inviteUrl}>
                        <span style={styles.shareLabel}>Share with User: </span>
                        <a
                          href={inviteUrl(s.invite_uuid)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.inviteLink}
                        >
                          {inviteUrl(s.invite_uuid)}
                        </a>
                      </small>
                    </td>
                    <td style={styles.td}>{s.pass_mark_percent}%</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, ...(s.is_active ? styles.badgeGreen : styles.badgeGray) }}>
                        {s.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={styles.td}>{new Date(s.created_at).toLocaleDateString()}</td>
                    <td style={styles.td}>
                      <button onClick={() => navigate(`/admin/surveys/${s.id}`)} style={styles.linkButton}>
                        Edit
                      </button>
                      {' · '}
                      <button onClick={() => navigate(`/admin/surveys/${s.id}/responses`)} style={styles.linkButton}>
                        Responses
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
  navRight: { display: 'flex', alignItems: 'center', gap: '1rem' },
  navEmail: { fontSize: '0.875rem', color: '#718096' },
  navButton: {
    background: 'none',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    padding: '0.375rem 0.75rem',
    fontSize: '0.875rem',
    cursor: 'pointer',
    color: '#4a5568',
  },
  main: { maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' },
  heading: { fontSize: '1.5rem', fontWeight: 700, color: '#1a1a2e', margin: 0 },
  primaryButton: {
    background: '#4361ee',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '0.5rem 1.25rem',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondaryButton: {
    background: '#fff',
    color: '#4a5568',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: '0.5rem 1.25rem',
    fontSize: '0.9rem',
    cursor: 'pointer',
  },
  modal: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: '1rem',
  },
  modalCard: { background: '#fff', borderRadius: 12, padding: '2rem', maxWidth: 480, width: '100%' },
  modalHeading: { fontSize: '1.2rem', fontWeight: 700, margin: '0 0 1.5rem', color: '#1a1a2e' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  createForm: {},
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.375rem' },
  label: { fontSize: '0.875rem', fontWeight: 500, color: '#4a5568' },
  hint: { fontSize: '0.75rem', color: '#718096', marginTop: '0.25rem', display: 'block' },
  createHint: { fontSize: '0.9rem', color: '#4a5568', marginBottom: '1rem' },
  warning: { fontSize: '0.8rem', color: '#c53030', marginTop: '0.25rem', display: 'block' },
  input: {
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: '0.625rem 0.875rem',
    fontSize: '0.95rem',
    outline: 'none',
    color: '#1a1a2e',
  },
  error: {
    color: '#e53e3e',
    fontSize: '0.875rem',
    margin: 0,
    background: '#fff5f5',
    padding: '0.625rem 0.875rem',
    borderRadius: 8,
  },
  buttonRow: { display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' },
  muted: { color: '#718096' },
  empty: { background: '#fff', borderRadius: 10, padding: '3rem', textAlign: 'center', color: '#718096' },
  tableWrapper: { background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '0.875rem 1rem',
    textAlign: 'left',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#718096',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid #e2e8f0',
  },
  tr: { borderBottom: '1px solid #f7fafc' },
  td: { padding: '1rem', fontSize: '0.9rem', color: '#2d3748', verticalAlign: 'middle' },
  inviteUrl: { color: '#a0aec0', fontFamily: 'monospace', fontSize: '0.75rem' },
  shareLabel: { color: '#718096', fontFamily: 'inherit', fontWeight: 500 },
  inviteLink: { color: '#4361ee', textDecoration: 'none' },
  badge: {
    display: 'inline-block',
    padding: '0.2rem 0.6rem',
    borderRadius: 999,
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  badgeGreen: { background: '#f0fff4', color: '#276749' },
  badgeGray: { background: '#f7fafc', color: '#718096' },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#4361ee',
    cursor: 'pointer',
    fontSize: '0.875rem',
    padding: 0,
  },
};
