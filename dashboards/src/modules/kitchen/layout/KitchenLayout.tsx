import React, { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  ChefHat,
  MapPin,
  LogOut,
  KeyRound,
  X,
  Lock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Menu,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '@core/auth/useAuth';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const KITCHEN_NAV_ITEMS: NavItem[] = [
  { to: '/kitchen/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/kitchen/orders',    label: 'Orders',    icon: <ShoppingBag size={18} /> },
  { to: '/kitchen/meals',     label: 'Meals',     icon: <UtensilsCrossed size={18} /> },
  { to: '/kitchen/profile',   label: 'Profile',   icon: <MapPin size={18} /> },
];

export function KitchenLayout(): React.ReactElement {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout, changePassword } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const currentPage = KITCHEN_NAV_ITEMS.find((n) => pathname.startsWith(n.to))?.label ?? 'Dashboard';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const openPasswordModal = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordSuccess('');
    setIsPasswordModalOpen(true);
  };

  const closePasswordModal = () => {
    if (!isChangingPassword) {
      setIsPasswordModalOpen(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setIsChangingPassword(true);

    try {
      const msg = await changePassword(currentPassword, newPassword);
      setPasswordSuccess(msg);
      setTimeout(() => {
        setIsPasswordModalOpen(false);
      }, 1800);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] flex text-white font-sans antialiased">
      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden lg:flex w-64 bg-[#0D1719] border-r border-white/8 flex-col shrink-0 select-none">
        {/* Brand header */}
        <div className="p-6 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#49E619]/10 border border-[#49E619]/20 flex items-center justify-center text-[#49E619]">
              <ChefHat size={20} />
            </div>
            <div>
              <span className="font-bold text-base tracking-wider uppercase text-white block">
                Zero<span className="text-[#49E619]">Hunger</span>
              </span>
              <span className="text-[10px] tracking-widest uppercase text-[#49E619] font-semibold block">
                Kitchen Portal
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {KITCHEN_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#49E619]/15 text-[#49E619] border border-[#49E619]/30 font-semibold shadow-sm shadow-[#49E619]/5'
                    : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User profile & actions */}
        <div className="p-4 border-t border-white/8 bg-[#0D1719]/50 space-y-2">
          <div className="px-3 py-2 rounded-xl bg-[#122023] border border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#49E619] animate-pulse shrink-0" />
              <p className="text-xs font-medium text-white truncate">{user?.name || 'Kitchen'}</p>
            </div>
            <p className="text-[10px] text-white/40 truncate mt-0.5 pl-4">{user?.email}</p>
          </div>

          <div className="flex items-center gap-1.5 pt-1">
            <button
              onClick={openPasswordModal}
              title="Change Password"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/5 border border-white/5 transition-colors cursor-pointer"
            >
              <KeyRound size={13} />
              <span>Password</span>
            </button>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="flex items-center justify-center p-2 rounded-lg text-xs text-red-400/80 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors cursor-pointer"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MOBILE MENU OVERLAY ── */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-64 max-w-[80vw] bg-[#0D1719] border-r border-white/10 flex flex-col z-10">
            <div className="p-5 border-b border-white/8 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#49E619]/10 border border-[#49E619]/20 flex items-center justify-center text-[#49E619]">
                  <ChefHat size={18} />
                </div>
                <span className="font-bold text-sm tracking-wider uppercase text-white">
                  Zero<span className="text-[#49E619]">Hunger</span>
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg text-white/50 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {KITCHEN_NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[#49E619]/15 text-[#49E619] border border-[#49E619]/30 font-semibold'
                        : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                    }`
                  }
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="p-4 border-t border-white/8 space-y-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openPasswordModal();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#122023] text-xs text-white/80 hover:text-white border border-white/5"
              >
                <KeyRound size={14} />
                <span>Change Password</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 text-xs text-red-400 hover:bg-red-500/20 border border-red-500/20"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 px-6 bg-[#0D1719]/60 backdrop-blur border-b border-white/8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-[#122023] border border-white/5 text-white/70 hover:text-white cursor-pointer"
            >
              <Menu size={18} />
            </button>
            <h2 className="text-base font-semibold text-white tracking-wide">
              {currentPage}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#49E619]/10 border border-[#49E619]/20 text-[11px] font-medium text-[#49E619]">
              <ChefHat size={12} />
              Kitchen Operational
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* ── CHANGE PASSWORD MODAL (Step 3: POST /api/auth/changePassword) ── */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-[#0D1719] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/8">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#49E619]/10 border border-[#49E619]/20 flex items-center justify-center text-[#49E619]">
                  <KeyRound size={16} />
                </div>
                <h3 className="text-base font-semibold text-white">Change Kitchen Password</h3>
              </div>
              <button
                type="button"
                onClick={closePasswordModal}
                disabled={isChangingPassword}
                className="p-1 rounded-lg text-white/40 hover:text-white transition-colors cursor-pointer disabled:opacity-30"
              >
                <X size={18} />
              </button>
            </div>

            {passwordError && (
              <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-xs">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="flex items-start gap-2 p-3 bg-[#49E619]/10 border border-[#49E619]/25 rounded-xl text-[#49E619] text-xs">
                <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/70 uppercase tracking-wider mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-9 pr-11 py-2.5 bg-[#080808] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#49E619]/50 transition-colors"
                    placeholder="Enter current password"
                  />
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-[#122023] hover:bg-[#1a2d32] border border-white/10 text-white/80 hover:text-[#49E619] transition-all cursor-pointer z-10 flex items-center justify-center shadow-sm"
                  >
                    {showCurrentPassword ? <EyeOff size={15} className="text-[#49E619]" /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/70 uppercase tracking-wider mb-1.5">
                  New Password (Min 8 characters)
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-11 py-2.5 bg-[#080808] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#49E619]/50 transition-colors"
                    placeholder="Enter new password"
                  />
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-[#122023] hover:bg-[#1a2d32] border border-white/10 text-white/80 hover:text-[#49E619] transition-all cursor-pointer z-10 flex items-center justify-center shadow-sm"
                  >
                    {showNewPassword ? <EyeOff size={15} className="text-[#49E619]" /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/70 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-11 py-2.5 bg-[#080808] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#49E619]/50 transition-colors"
                    placeholder="Re-enter new password"
                  />
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-[#122023] hover:bg-[#1a2d32] border border-white/10 text-white/80 hover:text-[#49E619] transition-all cursor-pointer z-10 flex items-center justify-center shadow-sm"
                  >
                    {showConfirmPassword ? <EyeOff size={15} className="text-[#49E619]" /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={closePasswordModal}
                  disabled={isChangingPassword}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#49E619] text-[#080808] hover:bg-[#3dd111] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Updating…</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

