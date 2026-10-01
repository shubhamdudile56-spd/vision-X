import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { LoadingBlock } from './ErrorBanner.jsx';

/**
 * Route guard. Waits for the initial `/auth/me` probe before deciding, so a
 * hard refresh on `/dashboard` does not bounce a signed-in user to the sign-in
 * screen. The attempted path is preserved for post-login redirect.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, checking } = useAuth();
  const location = useLocation();

  if (checking) return <LoadingBlock label="Verifying session…" />;
  if (!isAuthenticated) return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  return children;
}
