import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import ErrorBoundary from '@/components/ErrorBoundary';

// Eagerly loaded (small / critical path)
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';

// Lazy-loaded (heavy pages — code split per route)
const LoginDigestoDemo = lazy(() => import('@/pages/LoginDigestoDemo'));
const Analytics = lazy(() => import('@/pages/Analytics'));
const Matches = lazy(() => import('@/pages/Matches'));
const Profile = lazy(() => import('@/pages/Profile'));
const MyBets = lazy(() => import('@/pages/MyBets'));
const Strategy = lazy(() => import('@/pages/Strategy'));
const TelegramPage = lazy(() => import('@/pages/Telegram'));
const Admin = lazy(() => import('@/pages/Admin'));
const NotFound = lazy(() => import('@/pages/NotFound'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/login-digesto-demo"
          element={
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <LoginDigestoDemo />
              </Suspense>
            </ErrorBoundary>
          }
        />

        {/* Protected routes */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <Navigate to="/app/analytics" replace />
                </Suspense>
              </ErrorBoundary>
            }
          />
          <Route
            path="analytics"
            element={
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <Analytics />
                </Suspense>
              </ErrorBoundary>
            }
          />
          <Route
            path="matches"
            element={
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <Matches />
                </Suspense>
              </ErrorBoundary>
            }
          />
          <Route
            path="profile"
            element={
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <Profile />
                </Suspense>
              </ErrorBoundary>
            }
          />
          <Route
            path="my-bets"
            element={
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <MyBets />
                </Suspense>
              </ErrorBoundary>
            }
          />
          <Route
            path="strategy"
            element={
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <Strategy />
                </Suspense>
              </ErrorBoundary>
            }
          />
          <Route
            path="telegram"
            element={
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <TelegramPage />
                </Suspense>
              </ErrorBoundary>
            }
          />
          <Route
            path="admin"
            element={
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <Admin />
                </Suspense>
              </ErrorBoundary>
            }
          />
        </Route>

        {/* 404 catch-all */}
        <Route
          path="*"
          element={
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <NotFound />
              </Suspense>
            </ErrorBoundary>
          }
        />
      </Routes>
      <Toaster position="top-center" richColors closeButton duration={4000} />
    </Router>
  );
}

export default App;