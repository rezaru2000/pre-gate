import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { config } from '../../config/env';

interface Response {
  id: string;
  user_session_id: string;
  answers: Record<string, unknown>;
  score_percent: string;
  passed: boolean;
  ip_address: string;
  user_agent: string;
  submitted_at: string;
}

export default function AdminResponsesPage() {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${config.apiBaseUrl}/api/admin/surveys/${surveyId}/responses`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setResponses(data);
        setLoading(false);
      });
  }, [surveyId]);

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <button onClick={() => navigate(`/admin/surveys/${surveyId}`)} style={styles.backButton}>← Survey</button>
        <span style={styles.logo}>PreGate</span>
      </nav>

      <main style={styles.main}>
        <h1 style={styles.heading}>Audit Log</h1>

        {loading ? (
          <p style={styles.muted}>Loading...</p>
        ) : responses.length === 0 ? (
          <div style={styles.empty}><p>No responses yet.</p></div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Time</th>
                  <th style={styles.th}>Session</th>
                  <th style={styles.th}>Score</th>
                  <th style={styles.th}>Result</th>
                  <th style={styles.th}>IP</th>
                  <th style={styles.th}>Details</th>
                </tr>
              </thead>
              <tbody>
                {responses.map((r) => (
                  <React.Fragment key={r.id}>
                    <tr style={styles.tr}>
                      <td style={styles.td}>{new Date(r.submitted_at).toLocaleString()}</td>
                      <td style={styles.td}><code style={styles.code}>{r.user_session_id.slice(0, 8)}…</code></td>
                      <td style={styles.td}>{Number(r.score_percent).toFixed(1)}%</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, ...(r.passed ? styles.badgeGreen : styles.badgeRed) }}>
                          {r.passed ? 'Pass' : 'Fail'}
                        </span>
                      </td>
                      <td style={styles.td}><code style={styles.code}>{r.ip_address}</code></td>
                      <td style={styles.td}>
                        <button onClick={() => setExpanded(expanded === r.id ? null : r.id)} style={styles.linkButton}>
                          {expanded === r.id ? 'Hide' : 'Show'}
                        </button>
                      </td>
                    </tr>
                    {expanded === r.id && (
                      <tr>
                        <td colSpan={6} style={styles.expandedCell}>
                          <div style={styles.expandedContent}>
                            <p style={styles.expandLabel}>User Agent</p>
                            <p style={styles.expandValue}>{r.user_agent}</p>
                            <p style={styles.expandLabel}>Answers</p>
                            <pre style={styles.pre}>{JSON.stringify(r.answers, null, 2)}</pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
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
  backButton: { background: 'none', border: 'none', color: '#4361ee', cursor: 'pointer', fontSize: '0.9rem', padding: 0 },
  main: { maxWidth: 1000, margin: '0 auto', padding: '2rem 1rem' },
  heading: { fontSize: '1.5rem', fontWeight: 700, color: '#1a1a2e', marginBottom: '1.5rem' },
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
  td: { padding: '0.875rem 1rem', fontSize: '0.875rem', color: '#2d3748' },
  badge: { display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600 },
  badgeGreen: { background: '#f0fff4', color: '#276749' },
  badgeRed: { background: '#fff5f5', color: '#c53030' },
  code: { fontFamily: 'monospace', fontSize: '0.8rem', color: '#4a5568' },
  linkButton: { background: 'none', border: 'none', color: '#4361ee', cursor: 'pointer', fontSize: '0.875rem', padding: 0 },
  expandedCell: { padding: 0, background: '#f7fafc' },
  expandedContent: { padding: '1rem 1.5rem' },
  expandLabel: { fontSize: '0.75rem', fontWeight: 600, color: '#718096', textTransform: 'uppercase', margin: '0 0 0.25rem' },
  expandValue: { fontSize: '0.85rem', color: '#4a5568', margin: '0 0 0.75rem' },
  pre: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: '0.75rem',
    fontSize: '0.8rem',
    color: '#4a5568',
    overflow: 'auto',
    margin: 0,
  },
};
