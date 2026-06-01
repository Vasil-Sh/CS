import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import LoginDigestoDemo from '@/pages/LoginDigestoDemo';
import Analytics from '@/pages/Analytics';
import Matches from '@/pages/Matches';
import Profile from '@/pages/Profile';
import MyBets from '@/pages/MyBets';
import Strategy from '@/pages/Strategy';
import Admin from '@/pages/Admin';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/login-digesto-demo" element={<LoginDigestoDemo />} />

        {/* Protected routes */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/app/analytics" replace />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="matches" element={<Matches />} />
          <Route path="profile" element={<Profile />} />
          <Route path="my-bets" element={<MyBets />} />
          <Route path="strategy" element={<Strategy />} />
          <Route path="admin" element={<Admin />} />
        </Route>
      </Routes>
      <Toaster />
      <SonnerToaster position="top-center" richColors closeButton duration={4000} />
    </Router>
  );
}

export default App;