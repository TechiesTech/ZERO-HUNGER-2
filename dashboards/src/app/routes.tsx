import { Route, Routes } from 'react-router-dom';
import { RoleRoute } from './RoleRoute';
import { ChangePassword } from '@features/auth/ChangePassword';
import { ForgotPassword } from '@features/auth/ForgotPassword';
import { Login } from '@features/auth/Login';
import { NotFound } from '@features/auth/NotFound';
import { Unauthorized } from '@features/auth/Unauthorized';

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
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
