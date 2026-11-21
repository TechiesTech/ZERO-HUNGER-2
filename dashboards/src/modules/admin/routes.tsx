import { Navigate, Route, Routes } from 'react-router-dom';
import { NotFound } from '@core/ui/NotFound';
import { AdminLayout } from './layout/AdminLayout';
import { Dashboard } from './pages/Dashboard';
import { Kitchens } from './pages/Kitchens';
import { Meals } from './pages/Meals';
import { Orders } from './pages/Orders';
import { Riders } from './pages/Riders';

export function AdminRoutes() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="meals" element={<Meals />} />
        <Route path="orders" element={<Orders />} />
        <Route path="riders" element={<Riders />} />
        <Route path="kitchens" element={<Kitchens />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
