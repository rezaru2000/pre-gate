import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ScreeningPage from './pages/Screening';
import AdminLoginPage from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminSurveyPage from './pages/admin/Survey';
import AdminResponsesPage from './pages/admin/Responses';
import { AuthProvider } from './components/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import NotFound from './pages/NotFound';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/s/:inviteUuid" element={<ScreeningPage />} />

          {/* Admin */}
          <Route path="/admin" element={<AdminLoginPage />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/surveys/:surveyId"
            element={
              <ProtectedRoute>
                <AdminSurveyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/surveys/:surveyId/responses"
            element={
              <ProtectedRoute>
                <AdminResponsesPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
