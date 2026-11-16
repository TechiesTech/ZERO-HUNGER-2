import { Navigate, Route, Routes } from 'react-router-dom';
import { NotFound } from '@core/ui/NotFound';
import { KitchenLayout } from './layout/KitchenLayout';
import { Dashboard } from './pages/Dashboard';
import { Meals } from './pages/Meals';
import { Orders } from './pages/Orders';
import { Profile } from './pages/Profile';

export function KitchenRoutes() {
  return (
    <Routes>
      <Route element={<KitchenLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="orders" element={<Orders />} />
        <Route path="meals" element={<Meals />} />
        <Route path="profile" element={<Profile />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
