import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { LoadingScreen } from '@core/ui/LoadingScreen';
import { RoleRoute } from './RoleRoute';
import { ChangePassword } from '@features/auth/ChangePassword';
import { ForgotPassword } from '@features/auth/ForgotPassword';
import { Login } from '@features/auth/Login';
import { NotFound } from '@features/auth/NotFound';
import { Unauthorized } from '@features/auth/Unauthorized';

const AdminRoutes = lazy(() =>
  import('@modules/admin').then((module) => ({ default: module.AdminRoutes }))
);

function RootRedirect() {
  return <RoleRoute root />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route
        path="/change-password"
        element={
          <RoleRoute allowPasswordChange>
            <ChangePassword />
          </RoleRoute>
        }
      />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route
        path="/admin/*"
        element={
          <RoleRoute role="admin">
            <Suspense fallback={<LoadingScreen />}>
              <AdminRoutes />
            </Suspense>
          </RoleRoute>
        }
      />
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
