import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, KeyRound, LogOut, Menu, ShoppingBag, UserRound, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { SupportTab } from './SupportModal';
import { useMealProgram } from '../context/MealProgramContext';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenSupport: (tab?: SupportTab) => void;
}

const NAV_ITEMS = [
  { label: 'Home', path: '/', hideOnCompact: false },
  { label: 'Meal Box', path: '/meal-box', hideOnCompact: false },
  { label: 'Celebrate & Give', path: '/celebrate-and-give', hideOnCompact: false },
  { label: 'Track Meal', path: '/track-meal', hideOnCompact: false },
  { label: 'Contact', path: '/contact', hideOnCompact: true },
];

export const Navbar: React.FC<NavbarProps> = ({ onOpenSupport }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aboutDropdownOpen, setAboutDropdownOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [accountError, setAccountError] = useState('');
  const [accountLoading, setAccountLoading] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { cartCount, setIsCartOpen } = useMealProgram();
  const {
    user,
    changePassword,
    signOut,
  } = useAuth();

  const submitChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setAccountError('');
    if (newPassword.length < 8 || newPassword.length > 72) {
      setAccountError('Use a new password between 8 and 72 characters.');
      return;
    }
    if (newPassword !== passwordConfirmation) {
      setAccountError('New passwords do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setAccountError('The new password must differ from the current password.');
      return;
    }

    setAccountLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setAccountMenuOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setPasswordConfirmation('');
      setPasswordChanged(true);
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : 'Could not change your password.');
    } finally {
      setAccountLoading(false);
    }
  };

  const handleSignOut = async () => {
    setAccountError('');
    setAccountLoading(true);
    try {
      await signOut();
      setAccountMenuOpen(false);
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : 'Could not sign out.');
    } finally {
      setAccountLoading(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${isScrolled || mobileMenuOpen
        ? 'bg-[#080808]/95 backdrop-blur-md border-b border-white/10 py-3.5 shadow-lg'
        : 'bg-[#080808]/85 backdrop-blur-xs border-b border-white/10 py-4'
        }`}
    >
      <div className="relative max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 flex items-center justify-between">
        {/* Zone 1: Brand Wordmark */}
        <Link
          to="/"
          className="flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#49E619]"
        >
          <img
            src="/assets/images/Logo.png"
            alt="Zero Hunger"
            className="h-12 sm:h-16 w-auto"
          />
        </Link>

        {/* Zone 2: Primary Navigation Links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-6 lg:gap-8"
        >
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `${item.hideOnCompact ? 'hidden xl:inline-block' : ''
                } relative py-1 text-sm font-medium tracking-tight whitespace-nowrap transition-colors duration-200 group ${isActive
                  ? 'text-[#49E619]'
                  : 'text-white/80 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span>{item.label}</span>
                  <span
                    className={`absolute left-0 right-0 -bottom-0.5 h-[2px] transition-transform duration-200 origin-left ${isActive
                      ? 'scale-x-100 bg-[#49E619]'
                      : 'scale-x-0 group-hover:scale-x-100 bg-[#B9FF2C]'
                      }`}
                  />
                </>
              )}
            </NavLink>
          ))}

          {/* About Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setAboutDropdownOpen(!aboutDropdownOpen)}
              className="flex items-center gap-1 py-1 text-sm font-medium tracking-tight whitespace-nowrap transition-colors duration-200 text-white/80 hover:text-white"
            >
              <span>About</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${aboutDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {aboutDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 mt-2 w-56 bg-[#080808] border border-white/15 rounded-lg shadow-2xl overflow-hidden z-50"
                >
                  <Link
                    to="/about"
                    onClick={() => setAboutDropdownOpen(false)}
                    className="block px-4 py-3 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    About Zero Hunger
                  </Link>
                  <Link
                    to="/csr-tax-benefits"
                    onClick={() => setAboutDropdownOpen(false)}
                    className="block px-4 py-3 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors border-t border-white/10"
                  >
                    CSR & Tax Benefits
                  </Link>
                  <Link
                    to="/projects"
                    onClick={() => setAboutDropdownOpen(false)}
                    className="block px-4 py-3 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors border-t border-white/10"
                  >
                    Projects & Impact
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* Zone 3: Primary Actions + Mobile Hamburger */}
        <div className="flex items-center gap-3">
          {cartCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setIsCartOpen(true);
                if (pathname !== '/meal-box') navigate('/meal-box');
              }}
              aria-label={`View Meal Box Cart with ${cartCount} items`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] text-xs font-mono-tabular font-bold border border-[#49E619]/40 bg-[#122023] text-white hover:border-[#49E619] hover:bg-[#49E619] hover:text-[#080808] transition-colors whitespace-nowrap group cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#49E619] group-hover:text-[#080808]" />
              <span>{cartCount}</span>
            </button>
          )}

          {user && (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setAccountMenuOpen((open) => !open);
                  setAccountError('');
                }}
                aria-expanded={accountMenuOpen}
                className="inline-flex max-w-[150px] items-center gap-2 rounded-[8px] border border-white/20 px-3 py-2 text-xs font-bold text-white hover:border-[#49E619] hover:text-[#49E619]"
              >
                <UserRound className="h-4 w-4 shrink-0" />
                <span className="truncate">{user.name}</span>
              </button>
              {accountMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-[10px] border border-white/15 bg-[#122023] p-2 text-white shadow-2xl">
                  {accountError && (
                    <p role="alert" className="px-3 py-2 text-xs text-red-300">{accountError}</p>
                  )}
                  <button
                    type="button"
                    disabled={accountLoading}
                    onClick={() => {
                      setAccountError('');
                      setPasswordChanged(false);
                      setAccountMenuOpen(false);
                      setChangePasswordOpen(true);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm hover:bg-white/10 disabled:opacity-50"
                  >
                    <KeyRound className="h-4 w-4" /> Change password
                  </button>
                  <button
                    type="button"
                    disabled={accountLoading}
                    onClick={() => void handleSignOut()}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm text-red-300 hover:bg-white/10 disabled:opacity-50"
                  >
                    <LogOut className="h-4 w-4" /> {accountLoading ? 'Please wait...' : 'Sign out'}
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => onOpenSupport('donate')}
            className="hidden md:inline-flex items-center justify-center px-5 py-2.5 rounded-[10px] text-xs sm:text-sm font-bold tracking-tight whitespace-nowrap bg-[#49E619] text-[#080808] hover:bg-[#B9FF2C] transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#49E619]"
          >
            Support the Mission
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label={
              mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'
            }
            className="md:hidden w-11 h-11 flex items-center justify-center text-white hover:text-[#49E619] transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden bg-[#122023] border-b border-white/10 px-5 pt-4 pb-8 shadow-2xl"
          >
            <nav
              aria-label="Mobile Navigation"
              className="flex flex-col divide-y divide-white/10"
            >
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `py-3.5 text-lg font-display-sans uppercase font-black tracking-tight flex items-center justify-between ${isActive ? 'text-[#49E619]' : 'text-white'
                    }`
                  }
                >
                  <span>{item.label}</span>
                  <span className="text-xs font-mono-tabular text-[#49E619]">
                    →
                  </span>
                </NavLink>
              ))}

              {/* About Section with Sub-items */}
              <div className="py-3.5">
                <div className="text-lg font-display-sans uppercase font-black tracking-tight text-white flex items-center justify-between mb-4">
                  <span>About</span>
                  <ChevronDown className="w-5 h-5 text-[#49E619]" />
                </div>
                <div className="pl-4 space-y-3">
                  <Link
                    to="/about"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 text-base text-white/80 hover:text-white"
                  >
                    About Zero Hunger
                  </Link>
                  <Link
                    to="/csr-tax-benefits"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 text-base text-white/80 hover:text-white"
                  >
                    CSR & Tax Benefits
                  </Link>
                  <Link
                    to="/projects"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 text-base text-white/80 hover:text-white"
                  >
                    Projects & Impact
                  </Link>
                </div>
              </div>
            </nav>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSupport('donate');
                }}
                className="w-full py-3.5 rounded-[10px] bg-[#49E619] text-[#080808] text-sm font-bold tracking-tight hover:bg-[#B9FF2C] transition-colors cursor-pointer"
              >
                Support the Mission
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {changePasswordOpen && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#080808]/80 p-4 backdrop-blur-xs">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-password-title"
            className="w-full max-w-md space-y-4 rounded-[16px] bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#188D44]">Account security</p>
                <h2 id="change-password-title" className="mt-1 text-2xl font-black text-[#122023]">Change password</h2>
              </div>
              <button
                type="button"
                disabled={accountLoading}
                onClick={() => setChangePasswordOpen(false)}
                aria-label="Close change password"
                className="text-2xl leading-none text-[#122023]/60 hover:text-[#122023] disabled:opacity-50"
              >
                ×
              </button>
            </div>
            {passwordChanged ? (
              <>
                <p role="status" className="text-sm text-[#122023]">
                  Password changed. You are signed out. Sign in again when you proceed to checkout.
                </p>
                <button
                  type="button"
                  onClick={() => setChangePasswordOpen(false)}
                  className="w-full rounded-[8px] bg-[#49E619] px-4 py-3 text-sm font-bold text-[#080808] hover:bg-[#B9FF2C]"
                >
                  Close
                </button>
              </>
            ) : (
              <form onSubmit={(event) => void submitChangePassword(event)} className="space-y-4">
                <p className="text-sm text-[#6F6F6F]">You will be signed out after changing your password.</p>
                {accountError && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{accountError}</p>}
                <label className="block space-y-1.5 text-xs font-semibold uppercase tracking-wider text-[#6F6F6F]">
                  Current password
                  <input
                    className="w-full rounded-[8px] border border-[#122023]/20 px-3 py-2.5 text-sm text-[#080808] focus:border-[#122023] focus:outline-none"
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    required
                  />
                </label>
                <label className="block space-y-1.5 text-xs font-semibold uppercase tracking-wider text-[#6F6F6F]">
                  New password
                  <input
                    className="w-full rounded-[8px] border border-[#122023]/20 px-3 py-2.5 text-sm text-[#080808] focus:border-[#122023] focus:outline-none"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={72}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                  />
                </label>
                <label className="block space-y-1.5 text-xs font-semibold uppercase tracking-wider text-[#6F6F6F]">
                  Confirm new password
                  <input
                    className="w-full rounded-[8px] border border-[#122023]/20 px-3 py-2.5 text-sm text-[#080808] focus:border-[#122023] focus:outline-none"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={72}
                    value={passwordConfirmation}
                    onChange={(event) => setPasswordConfirmation(event.target.value)}
                    required
                  />
                </label>
                <button
                  type="submit"
                  disabled={accountLoading}
                  className="w-full rounded-[8px] bg-[#49E619] px-4 py-3 text-sm font-bold text-[#080808] hover:bg-[#B9FF2C] disabled:opacity-50"
                >
                  {accountLoading ? 'Please wait...' : 'Change password'}
                </button>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};
