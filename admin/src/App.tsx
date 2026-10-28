import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Dashboard } from '@/pages/Dashboard';
import { Meals } from '@/pages/Meals';
import { Orders } from '@/pages/Orders';
import { Riders } from '@/pages/Riders';

/**
 * Admin App — routing shell.
 *
 * TODO (auth): Wrap routes with a <ProtectedRoute> component that checks
 * for a valid admin session / JWT token before rendering the dashboard.
 * Example:
 *   import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
 *   <Route element={<ProtectedRoute />}>
 *     ... all admin routes ...
 *   </Route>
 */
export default function App(): React.ReactElement {
  return (
    <BrowserRouter>
      <Routes>
        {/* All admin routes share the AdminLayout (sidebar + content area) */}
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/meals" element={<Meals />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/riders" element={<Riders />} />
          {/* Catch-all → dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
