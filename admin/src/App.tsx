import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { Meals } from '@/pages/Meals';
import { Orders } from '@/pages/Orders';
import { Riders } from '@/pages/Riders';
import { Kitchens } from '@/pages/Kitchens';

function RoleBasedRedirect() {
  const { admin } = useAuth();
  if (!admin) return <Navigate to="/login" replace />;
  return <Navigate to={admin.role === 'kitchen' ? '/orders' : '/dashboard'} replace />;
}

export default function App(): React.ReactElement {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* All admin routes share the AdminLayout (sidebar + content area) */}
          <Route
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<RoleBasedRedirect />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/meals" element={<Meals />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/riders" element={<Riders />} />
            <Route path="/kitchens" element={<Kitchens />} />
            {/* Catch-all → dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
