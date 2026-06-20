import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';

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
            <Suspense fallback={<PageLoader />}>
              <LoginDigestoDemo />
            </Suspense>
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
              <Suspense fallback={<PageLoader />}>
                <Navigate to="/app/analytics" replace />
              </Suspense>
            }
          />
          <Route
            path="analytics"
            element={
              <Suspense fallback={<PageLoader />}>
                <Analytics />
              </Suspense>
            }
          />
          <Route
            path="matches"
            element={
              <Suspense fallback={<PageLoader />}>
                <Matches />
              </Suspense>
            }
          />
          <Route
            path="profile"
            element={
              <Suspense fallback={<PageLoader />}>
                <Profile />
              </Suspense>
            }
          />
          <Route
            path="my-bets"
            element={
              <Suspense fallback={<PageLoader />}>
                <MyBets />
              </Suspense>
            }
          />
          <Route
            path="strategy"
            element={
              <Suspense fallback={<PageLoader />}>
                <Strategy />
              </Suspense>
            }
          />
          <Route
            path="admin"
            element={
              <Suspense fallback={<PageLoader />}>
                <Admin />
              </Suspense>
            }
          />
        </Route>

        {/* 404 catch-all */}
        <Route
          path="*"
          element={
            <Suspense fallback={<PageLoader />}>
              <NotFound />
            </Suspense>
          }
        />
      </Routes>
      <Toaster position="top-center" richColors closeButton duration={4000} />
    </Router>
  );
}

export default App;