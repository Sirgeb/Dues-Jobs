import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthProvider';

export default function PublicRoute() {
  const { session, loading } = useAuth();

  if (loading) return <p>Loading...</p>;

  // If user is logged in → block access to auth pages
  if (session) {
    return <Navigate to='/dashboard' replace />;
  }

  return <Outlet />;
}
