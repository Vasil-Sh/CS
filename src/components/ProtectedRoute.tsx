import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const currentUser = localStorage.getItem('currentUser');

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}