import { lazy, Suspense } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './components/NotificationContainer';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Lazy load all page components for code splitting
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Publishers = lazy(() => import('./pages/Publishers'));
const ControlCenter = lazy(() => import('./pages/ControlCenter'));
const Alerts = lazy(() => import('./pages/Alerts'));
const Profile = lazy(() => import('./pages/Profile'));
const Reports = lazy(() => import('./pages/Reports'));
const MFABuster = lazy(() => import('./pages/MFABuster'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const InviteAcceptance = lazy(() => import('./pages/InviteAcceptance'));
const Layout = lazy(() => import('./components/Layout'));
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute'));

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#0B0C0E] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#48a77f]"></div>
        <p className="mt-4 text-gray-400 text-sm">Loading...</p>
      </div>
    </div>
  );
}

function AppContent() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public routes */}
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/invite/*" element={<InviteAcceptance />} />
        <Route path="/accept-invite" element={<InviteAcceptance />} />
        <Route
          path="/login"
          element={
            <ProtectedRoute requireAuth={false}>
              <Login />
            </ProtectedRoute>
          }
        />

        {/* Protected routes with Layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute requireAuth={false}>
              <Login />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/publishers"
          element={
            <ProtectedRoute>
              <Layout>
                <Publishers />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/mcm-parents"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
              <Layout>
                <ControlCenter />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/alerts"
          element={
            <ProtectedRoute>
              <Layout>
                <Alerts />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Layout>
                <Reports />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/mfa-buster"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
              <Layout>
                <MFABuster />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin', 'partner']}>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
              <Layout>
                <AuditLogs />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
