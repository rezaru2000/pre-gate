import React from 'react';

export default function NotFound() {
  return (
    <div style={styles.center}>
      <div style={styles.card}>
        <h1 style={styles.heading}>404</h1>
        <p style={styles.body}>Page not found.</p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  center: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: '#f5f7fa',
  },
  card: {
    textAlign: 'center',
    padding: '2rem',
  },
  heading: {
    fontSize: '4rem',
    fontWeight: 800,
    color: '#e2e8f0',
    margin: '0 0 0.5rem',
  },
  body: {
    color: '#718096',
  },
};
