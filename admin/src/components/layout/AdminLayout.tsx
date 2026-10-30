import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, UtensilsCrossed, ShoppingBag, Bike } from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/meals',     label: 'Meals',     icon: <UtensilsCrossed size={18} /> },
  { to: '/orders',    label: 'Orders',    icon: <ShoppingBag size={18} /> },
  { to: '/riders',    label: 'Riders',    icon: <Bike size={18} /> },
];

export function AdminLayout(): React.ReactElement {
  const { pathname } = useLocation();
  const currentPage = NAV_ITEMS.find((n) => pathname.startsWith(n.to))?.label ?? 'Dashboard';

  return (
    <div className="flex min-h-screen bg-[#080808]">
      {/* ── Sidebar ── */}
      <aside className="w-56 flex-shrink-0 flex flex-col bg-[#0D1719] border-r border-white/8 sticky top-0 h-screen">
        {/* Logo / brand mark */}
        <div className="h-16 flex items-center px-5 border-b border-white/8">
          <span className="text-[#49E619] font-bold text-sm tracking-wider uppercase">
            ZeroHunger
          </span>
          <span className="ml-2 text-[10px] font-medium text-white/40 uppercase tracking-widest">
            Admin
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV_ITEMS.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
                  isActive
                    ? 'bg-[#122023] text-[#49E619]'
                    : 'text-white/60 hover:text-white hover:bg-white/5',
                ].join(' ')
              }
            >
              {icon}
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer note */}
        <div className="px-5 py-4 border-t border-white/8">
          <p className="text-[11px] text-white/25 leading-relaxed">
            Zero Hunger v0.1
          </p>
        </div>
      </aside>

      {/* ── Main content area ── */}
      <main className="flex-1 flex flex-col overflow-auto">
        {/* Top bar */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-white/8 bg-[#080808]/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-2 text-sm text-white/40 font-medium">
            <span className="text-white/20">Admin</span>
            <span className="text-white/15">/</span>
            <span className="text-white/60">{currentPage}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#122023] border border-[#49E619]/30 flex items-center justify-center text-[#49E619] text-xs font-bold">
              A
            </div>
          </div>
        </header>

        {/* Page content — rendered by child routes */}
        <div className="flex-1 p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
