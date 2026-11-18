import React, { useState, useEffect, useCallback } from 'react';
import { HeaderBar } from './components/HeaderBar';
import { StatusBanner } from './components/StatusBanner';
import { MapView } from './components/MapView';
import { AvailableOrders } from './components/AvailableOrders';
import { ActiveDeliveryPanel } from './components/ActiveDeliveryPanel';
import { DeliveryPhotoModal } from './components/DeliveryPhotoModal';
import { LoginScreen } from './components/LoginScreen';
import { RegisterScreen } from './components/RegisterScreen';
import { useRiderLocation } from './hooks/useRiderLocation';
import { riderService } from './services/riderService';
import { hasRole } from './types/rider';
import type { RiderUser, AvailableOrder, ActiveDelivery } from './types/rider';
import { LogOut } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<RiderUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Remember online status across page refreshes until rider explicitly toggles offline
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    try {
      return localStorage.getItem('rider_online') === 'true';
    } catch {
      return false;
    }
  });
  const [toggleLoading, setToggleLoading] = useState(false);

  const [availableOrders, setAvailableOrders] = useState<AvailableOrder[]>([]);
  const [isRefreshingOrders, setIsRefreshingOrders] = useState(false);

  const [activeDelivery, setActiveDelivery] = useState<ActiveDelivery | null>(null);
  const [isDeliveryLoading, setIsDeliveryLoading] = useState(false);

  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoSubmitting, setPhotoSubmitting] = useState(false);

  const [bannerMessage, setBannerMessage] = useState<{
    type: 'warning' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Initial Auth Check
  useEffect(() => {
    riderService
      .getMe()
      .then((res) => {
        if (hasRole(res.user, 'rider')) {
          setUser(res.user);
          // Preserve online state if rider was online before refresh
          const wasOnline = localStorage.getItem('rider_online') === 'true';
          if (wasOnline) {
            setIsOnline(true);
            riderService.setAvailability(true).catch(() => {});
          } else if (res.user.isAvailable !== undefined) {
            setIsOnline(Boolean(res.user.isAvailable));
            localStorage.setItem('rider_online', String(Boolean(res.user.isAvailable)));
          }
        }
      })
      .catch(() => {
        // Not logged in
      })
      .finally(() => {
        setAuthChecking(false);
      });
  }, []);

  // GPS Tracking Hook
  // `gpsError` is the single source of truth for GPS problems: passing an inline
  // onError here duplicated the banner and recreated the watcher on every render.
  const { lastCoords, gpsError } = useRiderLocation({
    isOnline,
    hasActiveDelivery: Boolean(activeDelivery),
  });

  // Fetch Active Delivery
  const checkActiveDelivery = useCallback(async () => {
    if (!user) return;
    try {
      const active = await riderService.currentDelivery();
      setActiveDelivery(active);
      if (active) {
        setIsOnline(true);
        localStorage.setItem('rider_online', 'true');
      }
    } catch {
      setActiveDelivery(null);
    }
  }, [user]);

  // Fetch Available Orders
  const fetchAvailableOrders = useCallback(async () => {
    if (!user || !isOnline || activeDelivery) return;
    setIsRefreshingOrders(true);
    try {
      const orders = await riderService.getAvailableOrders();
      setAvailableOrders(orders);
    } catch (err: any) {
      console.warn('Could not load orders:', err.message);
    } finally {
      setIsRefreshingOrders(false);
    }
  }, [user, isOnline, activeDelivery]);

  // Periodic polling when online
  useEffect(() => {
    if (!user || !isOnline) return;

    checkActiveDelivery();
    fetchAvailableOrders();

    const interval = setInterval(() => {
      checkActiveDelivery();
      if (!activeDelivery) {
        fetchAvailableOrders();
      }
    }, 12000);

    return () => clearInterval(interval);
  }, [user, isOnline, activeDelivery, checkActiveDelivery, fetchAvailableOrders]);

  // Toggle Online/Offline
  const handleToggleOnline = async () => {
    if (activeDelivery) {
      setBannerMessage({
        type: 'warning',
        message: 'Cannot go offline while you have an active delivery!',
      });
      return;
    }

    setToggleLoading(true);
    setBannerMessage(null);
    try {
      const nextState = !isOnline;
      await riderService.setAvailability(nextState);
      setIsOnline(nextState);
      localStorage.setItem('rider_online', String(nextState));
      if (nextState) {
        fetchAvailableOrders();
      } else {
        setAvailableOrders([]);
      }
    } catch (err: any) {
      setBannerMessage({ type: 'error', message: err.message || 'Failed to update online status' });
    } finally {
      setToggleLoading(false);
    }
  };

  // Accept Order
  const handleAcceptOrder = async (orderNumber: string) => {
    setIsDeliveryLoading(true);
    setBannerMessage(null);
    try {
      await riderService.acceptOrder(orderNumber);
      await checkActiveDelivery();
    } catch (err: any) {
      setBannerMessage({ type: 'error', message: err.message || 'Could not accept order' });
    } finally {
      setIsDeliveryLoading(false);
    }
  };

  // Mark Picked Up
  const handleMarkPickedUp = async () => {
    if (!activeDelivery) return;
    setIsDeliveryLoading(true);
    setBannerMessage(null);
    try {
      await riderService.markPickedUp(activeDelivery.orderNumber);
      await checkActiveDelivery();
    } catch (err: any) {
      setBannerMessage({ type: 'error', message: err.message || 'Failed to update status' });
    } finally {
      setIsDeliveryLoading(false);
    }
  };

  // Complete Delivery with Photo Proof
  const handleCompleteDelivery = async (photoFile: File) => {
    if (!activeDelivery) return;
    setPhotoSubmitting(true);
    setBannerMessage(null);
    try {
      await riderService.markDelivered(activeDelivery.orderNumber, photoFile);
      setShowPhotoModal(false);
      setActiveDelivery(null);
      setBannerMessage({ type: 'info', message: 'Delivery completed successfully! Great job.' });
      fetchAvailableOrders();
    } catch (err: any) {
      setBannerMessage({ type: 'error', message: err.message || 'Delivery upload failed' });
    } finally {
      setPhotoSubmitting(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    if (activeDelivery) {
      setBannerMessage({ type: 'warning', message: 'Finish active delivery before logging out' });
      return;
    }
    await riderService.logout();
    setUser(null);
    setIsOnline(false);
    setActiveDelivery(null);
    localStorage.removeItem('rider_online');
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400 text-sm font-medium">
        Loading Rider Partner Portal...
      </div>
    );
  }

  // Auth Screens
  if (!user) {
    return authMode === 'login' ? (
      <LoginScreen
        onLoginSuccess={(u) => {
          setUser(u);
          const wasOnline = localStorage.getItem('rider_online') === 'true';
          setIsOnline(wasOnline);
        }}
        onSwitchToRegister={() => setAuthMode('register')}
      />
    ) : (
      <RegisterScreen onBackToLogin={() => setAuthMode('login')} />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col max-w-md mx-auto relative select-none">
      {/* 1. Sticky Header Bar */}
      <HeaderBar
        riderName={user.name}
        isOnline={isOnline}
        onToggleOnline={handleToggleOnline}
        isLoading={toggleLoading}
        hasActiveDelivery={Boolean(activeDelivery)}
      />

      {/* 2. Status & GPS Banners */}
      {gpsError && <StatusBanner type="error" message={gpsError} />}
      {bannerMessage && (
        <StatusBanner
          type={bannerMessage.type}
          message={bannerMessage.message}
          onDismiss={() => setBannerMessage(null)}
        />
      )}

      {/* 3. Map View */}
      <MapView
        riderCoords={lastCoords}
        gpsError={gpsError}
        kitchenCoords={activeDelivery?.kitchen ? { ...activeDelivery.kitchen.location, name: activeDelivery.kitchen.name } as any : null}
        customerCoords={
          activeDelivery?.deliveryAddress
            ? { ...activeDelivery.deliveryAddress.location, address: activeDelivery.deliveryAddress.area } as any
            : null
        }
        statusText={
          activeDelivery
            ? `Active Order #${activeDelivery.orderNumber}`
            : isOnline
            ? 'Waiting for nearby orders'
            : 'Offline'
        }
      />

      {/* 4. Active Delivery Bottom Sheet (Fixed over Map) */}
      {activeDelivery ? (
        <ActiveDeliveryPanel
          delivery={activeDelivery}
          onMarkPickedUp={handleMarkPickedUp}
          onOpenDeliveryProof={() => setShowPhotoModal(true)}
          isLoading={isDeliveryLoading}
        />
      ) : (
        /* 5. Available Orders List (When idle and online) */
        <div className="flex-1">
          {isOnline ? (
            <AvailableOrders
              orders={availableOrders}
              isRefreshing={isRefreshingOrders}
              onRefresh={fetchAvailableOrders}
              onAccept={handleAcceptOrder}
              isAccepting={isDeliveryLoading}
            />
          ) : (
            <div className="p-8 text-center text-zinc-500 mt-6">
              <p className="text-sm font-bold text-zinc-400">You are currently OFFLINE</p>
              <p className="text-xs text-zinc-600 mt-1">Tap GO ONLINE at the top to receive delivery requests.</p>

              {/* Logout Option */}
              <button
                onClick={handleLogout}
                className="mt-8 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-400 hover:text-white flex items-center gap-2 mx-auto active:scale-95"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}

      {/* 6. Proof of Delivery Camera Modal */}
      {activeDelivery && (
        <DeliveryPhotoModal
          orderNumber={activeDelivery.orderNumber}
          isOpen={showPhotoModal}
          onClose={() => setShowPhotoModal(false)}
          onSubmit={handleCompleteDelivery}
          isSubmitting={photoSubmitting}
        />
      )}
    </div>
  );
}

