import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, KeyRound, Lock, Mail } from 'lucide-react';
import { useAuth } from '@core/auth/useAuth';

interface LoginState {
  from?: { pathname?: string };
  portalError?: string;
}

function isPortalRole(role: string): role is 'admin' | 'kitchen' {
  return role === 'admin' || role === 'kitchen';
}

export function Login() {
  const [identifier, setIdentifier] = useState('admin@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, logout, user, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LoginState | null;

  useEffect(() => {
    if (!user || isAuthLoading || !isPortalRole(user.role)) return;
    if (user.status !== 'active') return;
    if (user.mustChangePassword) {
      navigate('/change-password', { replace: true });
      return;
    }
    const home = user.role === 'admin' ? '/admin/dashboard' : '/kitchen/orders';
    const requested = locationState?.from?.pathname;
    const returnTo = requested?.startsWith(`/${user.role}/`) ? requested : home;
    navigate(returnTo, { replace: true });
  }, [user, isAuthLoading, locationState, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const currentUser = await login(identifier, password);
      if (currentUser.status !== 'active' || !isPortalRole(currentUser.role)) {
        setError('This portal is for admin and kitchen accounts only');
        try {
          await logout();
        } catch (logoutError) {
          console.error('Unable to complete logout for a non-portal account.', logoutError);
        }
        return;
      }

      if (currentUser.mustChangePassword) {
        navigate('/change-password', { replace: true });
        return;
      }

      const home = currentUser.role === 'admin' ? '/admin/dashboard' : '/kitchen/orders';
      const requested = locationState?.from?.pathname;
      const returnTo = requested?.startsWith(`/${currentUser.role}/`) ? requested : home;
      navigate(returnTo, { replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080808] p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/8 bg-[#0D1719] p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[#49E619]/20 bg-[#49E619]/10 text-[#49E619]">
            <KeyRound size={22} />
          </div>
          <h1 className="text-2xl font-bold uppercase tracking-wider text-[#49E619]">ZeroHunger</h1>
          <p className="mt-1 text-xs uppercase tracking-widest text-white/40">Admin &amp; Kitchen Portal</p>
        </div>

        {(error || locationState?.portalError) && (
          <div role="alert" className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-500/25 bg-red-500/10 p-3.5 text-xs leading-relaxed text-red-400">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error || locationState?.portalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="identifier" className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/70">
              Email or Mobile Number
            </label>
            <div className="relative">
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#080808] py-3 pl-10 pr-4 text-sm text-white placeholder-white/20 transition-colors focus:border-[#49E619]/50 focus:outline-none"
                placeholder="admin@gmail.com"
                required
              />
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="password" className="block text-xs font-medium uppercase tracking-wider text-white/70">Password</label>
              <Link to="/forgot-password" className="cursor-pointer text-xs text-[#49E619] hover:underline">Forgot Password?</Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#080808] py-3 pl-10 pr-12 text-sm text-white placeholder-white/20 transition-colors focus:border-[#49E619]/50 focus:outline-none"
                placeholder="••••••••"
                required
              />
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <button
                type="button"
                onClick={() => setShowPassword((shown) => !shown)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/5 hover:text-[#49E619]"
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full cursor-pointer rounded-xl bg-[#49E619] py-3.5 text-sm font-bold uppercase tracking-wider text-[#080808] shadow-lg shadow-[#49E619]/10 transition-colors hover:bg-[#3dd111] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-8 text-center text-[11px] text-white/20">Zero Hunger Portal &copy; 2026</p>
      </div>
    </div>
  );
}
