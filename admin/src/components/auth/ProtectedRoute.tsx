import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, admin } = useAuth();
  const location = useLocation();
  const role = admin?.role || 'admin';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="text-white/40 text-sm">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Kitchen users can only access the Orders page
  if (role === 'kitchen' && location.pathname !== '/orders' && location.pathname !== '/') {
    return <Navigate to="/orders" replace />;
  }

  return <>{children}</>;
}
