import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { KeyRound, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getCurrentUser } from '../services/authService';
import type { AuthUser } from '../services/authService';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ open, onClose }) => {
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [passwordChanged, setPasswordChanged] = useState(false);
  const { changePassword, signOut } = useAuth();

  useEffect(() => {
    if (!open) return;

    let active = true;
    setProfile(null);
    setError('');
    setActionError('');
    setPasswordChanged(false);
    setCurrentPassword('');
    setNewPassword('');
    setPasswordConfirmation('');
    setLoading(true);
    getCurrentUser()
      .then((currentUser) => {
        if (active) setProfile(currentUser);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Could not load your profile.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, reload]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !actionLoading) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, actionLoading, onClose]);

  const submitChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setActionError('');
    if (newPassword.length < 8 || newPassword.length > 72) {
      setActionError('Use a new password between 8 and 72 characters.');
      return;
    }
    if (newPassword !== passwordConfirmation) {
      setActionError('New passwords do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setActionError('The new password must differ from the current password.');
      return;
    }

    setActionLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setPasswordConfirmation('');
      setPasswordChanged(true);
    } catch (changeError) {
      setActionError(changeError instanceof Error ? changeError.message : 'Could not change your password.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSignOut = async () => {
    setActionError('');
    setActionLoading(true);
    try {
      await signOut();
      onClose();
    } catch (signOutError) {
      setActionError(signOutError instanceof Error ? signOutError.message : 'Could not sign out.');
    } finally {
      setActionLoading(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#080808]/80 p-4 backdrop-blur-xs"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !actionLoading) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-title"
        className="flex max-h-[90vh] w-full max-w-md flex-col rounded-[16px] bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#122023]/10 p-5 sm:p-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#188D44]">Account</p>
            <h2 id="profile-title" className="mt-1 text-2xl font-black text-[#122023]">Profile</h2>
          </div>
          <button
            type="button"
            disabled={actionLoading}
            onClick={onClose}
            aria-label="Close profile"
            className="text-2xl leading-none text-[#122023]/60 hover:text-[#122023] disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
          {loading && <p role="status" className="py-4 text-center text-sm text-[#6F6F6F]">Loading profile...</p>}
          {error && (
            <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              <p>{error}</p>
              <button
                type="button"
                onClick={() => setReload((attempt) => attempt + 1)}
                className="mt-2 font-bold underline"
              >
                Try again
              </button>
            </div>
          )}
          {profile && (
            <>
              <dl className="space-y-4">
                {[
                  ['Name', profile.name],
                  ['Email', profile.email],
                  ['Phone', profile.phone],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs font-bold uppercase tracking-wider text-[#6F6F6F]">{label}</dt>
                    <dd className="mt-1 rounded-[8px] border border-[#122023]/10 bg-gray-50 px-3 py-2.5 text-sm text-[#122023]">
                      {value || 'Not provided'}
                    </dd>
                  </div>
                ))}
                <p className="text-xs text-[#6F6F6F]">These profile details can’t be changed here.</p>
              </dl>

              <section className="space-y-4 border-t border-[#122023]/10 pt-5">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-[#188D44]" />
                  <h3 className="text-sm font-bold text-[#122023]">Change password</h3>
                </div>
                {passwordChanged ? (
                  <div className="space-y-3">
                    <p role="status" className="text-sm text-[#122023]">
                      Password changed. You are signed out. Sign in again when you proceed to checkout.
                    </p>
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full rounded-[8px] bg-[#49E619] px-4 py-3 text-sm font-bold text-[#080808] hover:bg-[#B9FF2C]"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-[#6F6F6F]">You will be signed out after changing your password.</p>
                    {actionError && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{actionError}</p>}
                    <form onSubmit={(event) => void submitChangePassword(event)} className="space-y-4">
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
                        disabled={actionLoading}
                        className="w-full rounded-[8px] bg-[#49E619] px-4 py-3 text-sm font-bold text-[#080808] hover:bg-[#B9FF2C] disabled:opacity-50"
                      >
                        {actionLoading ? 'Please wait...' : 'Change password'}
                      </button>
                    </form>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => void handleSignOut()}
                      className="flex w-full items-center justify-center gap-2 rounded-[8px] border border-red-200 px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      <LogOut className="h-4 w-4" />
                      {actionLoading ? 'Please wait...' : 'Sign out'}
                    </button>
                  </>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
