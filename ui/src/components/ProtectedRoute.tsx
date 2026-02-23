import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { email, loading } = useAuth();

  if (loading) {
    return (
      <div style={styles.center}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!email) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}

const styles: Record<string, React.CSSProperties> = {
  center: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
  },
};
