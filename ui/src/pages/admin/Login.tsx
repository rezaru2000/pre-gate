import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../components/AuthContext';

export default function AdminLoginPage() {
  const { login, email, loading } = useAuth();
  const navigate = useNavigate();
  const [formEmail, setFormEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && email) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [email, loading, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(formEmail, password);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>PreGate</div>
        <h1 style={styles.heading}>Admin Login</h1>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              style={styles.input}
              required
              autoComplete="email"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
              autoComplete="current-password"
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={submitting} style={styles.button}>
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#f5f7fa',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  },
  card: {
    background: '#fff',
    borderRadius: 12,
    padding: '2.5rem',
    maxWidth: 400,
    width: '100%',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  },
  logo: {
    fontSize: '1.1rem',
    fontWeight: 800,
    color: '#4361ee',
    letterSpacing: '-0.5px',
    marginBottom: '1.5rem',
  },
  heading: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#1a1a2e',
    margin: '0 0 2rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#4a5568',
  },
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
  button: {
    background: '#4361ee',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '0.75rem',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '0.25rem',
  },
};
