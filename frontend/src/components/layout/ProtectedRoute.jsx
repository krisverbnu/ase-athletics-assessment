// Only lets logged-in users through; everyone else goes to /login.
// After logging in they're sent back to the page they wanted.
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../common/States';

export default function ProtectedRoute() {
  const { user, isReady } = useAuth();
  const location = useLocation();

  if (!isReady) return <Spinner label="Checking your session..." />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}
