import { useEffect, useRef, type ReactNode } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@core/auth/useAuth';
import type { PortalRole } from '@core/auth/types';
import { LoadingScreen } from '@core/ui/LoadingScreen';

interface RoleRouteProps {
  role?: 'admin' | 'kitchen';
  allowPasswordChange?: boolean;
  root?: boolean;
  children?: ReactNode;
}

function isPortalRole(role: string): role is 'admin' | 'kitchen' {
  return role === 'admin' || role === 'kitchen';
}

function homeForRole(role: PortalRole | string) {
  return role === 'admin' ? '/admin/dashboard' : '/kitchen/orders';
}

function RejectPortalAccount() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void logout()
      .catch((error: unknown) => {
        console.error('Unable to complete logout for a non-portal account.', error);
      })
      .finally(() => {
        navigate('/login', {
          replace: true,
          state: { portalError: 'This portal is for admin and kitchen accounts only' },
        });
      });
  }, [logout, navigate]);

  return <LoadingScreen />;
}

export function RoleRoute({ role, allowPasswordChange = false, root = false, children }: RoleRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (user.status !== 'active' || !isPortalRole(user.role)) {
    return <RejectPortalAccount />;
  }
  if (role && user.role !== role) {
    return <Navigate to={homeForRole(user.role)} replace />;
  }
  if (user.mustChangePassword) {
    return allowPasswordChange ? children : <Navigate to="/change-password" replace />;
  }
  if (allowPasswordChange || root) {
    return <Navigate to={homeForRole(user.role)} replace />;
  }
  return children;
}
