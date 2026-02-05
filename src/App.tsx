import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import LoginDigestoDemo from '@/pages/LoginDigestoDemo';
import Analytics from '@/pages/Analytics';
import Matches from '@/pages/Matches';
import MyBets from '@/pages/MyBets';
import Admin from '@/pages/Admin';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/login-digesto-demo" element={<LoginDigestoDemo />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/analytics" replace />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="matches" element={<Matches />} />
          <Route path="my-bets" element={<MyBets />} />
          <Route path="admin" element={<Admin />} />
        </Route>
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;