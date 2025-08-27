import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ROUTES } from './utils/constants';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { CookieNotice } from './components/common/CookieNotice';

// Pages
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import ConditionsPage from './pages/ConditionsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';

// Auth Components
import { PasswordReset } from './components/auth/PasswordReset';
import { EmailConfirmationPendingPage } from './pages/EmailConfirmationPendingPage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={ROUTES.HOME} />;
  }

  return <>{children}</>;
};

// Public Route Component (redirect to dashboard if already logged in)
interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (user) {
    return <Navigate to={ROUTES.DASHBOARD} />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route path={ROUTES.HOME} element={<HomePage />} />
              <Route path={ROUTES.CONDITIONS} element={<ConditionsPage />} />
              <Route path={ROUTES.PRIVACY} element={<PrivacyPolicyPage />} />
              
              {/* Auth Routes - redirect to dashboard if already logged in */}
              <Route 
                path={ROUTES.RESET_PASSWORD} 
                element={
                  <PublicRoute>
                    <PasswordReset />
                  </PublicRoute>
                } 
              />
              
              {/* Email Confirmation Pending - Public route */}
              <Route 
                path={ROUTES.EMAIL_CONFIRMATION_PENDING} 
                element={<EmailConfirmationPendingPage />} 
              />

              {/* Protected Routes */}
              <Route
                path={ROUTES.DASHBOARD}
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.PROFILE}
                element={<Navigate to={`${ROUTES.DASHBOARD}?tab=perfil`} />}
              />

              {/* Catch all route - redirect to home */}
              <Route path="*" element={<Navigate to={ROUTES.HOME} />} />
            </Routes>

            {/* Toast Notifications */}
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />

            {/* Cookie Notice */}
            <CookieNotice />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;