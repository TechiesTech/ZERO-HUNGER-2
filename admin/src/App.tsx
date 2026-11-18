import React, { lazy, Suspense } from 'react';
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

const KitchenProfile = lazy(() => import('@/pages/KitchenProfile').then(({ KitchenProfile: Page }) => ({ default: Page })));

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
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/meals" element={<Meals />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/riders" element={<Riders />} />
            <Route path="/kitchens" element={<Kitchens />} />
            <Route
              path="/kitchen-profile"
              element={
                <Suspense fallback={<div className="py-16 text-center text-sm text-white/45">Loading kitchen map…</div>}>
                  <KitchenProfile />
                </Suspense>
              }
            />
            {/* Catch-all → dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
