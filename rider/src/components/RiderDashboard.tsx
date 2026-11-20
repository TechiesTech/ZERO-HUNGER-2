import React from 'react';
import { HeaderBar } from './HeaderBar';
import { StatusBanner } from './StatusBanner';
import { MapView } from './MapView';
import { AvailableOrders } from './AvailableOrders';
import { ActiveDeliveryPanel } from './ActiveDeliveryPanel';
import { DeliveryPhotoModal } from './DeliveryPhotoModal';
import { useRiderLocation } from '../hooks/useRiderLocation';
import { useRiderContext } from '../context/RiderContext';
import { useOnlineToggle } from '../hooks/useOnlineToggle';
import { useOrders } from '../hooks/useOrders';
import { LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const RiderDashboard: React.FC = () => {
  // State from context
  const { user, isOnline, bannerMessage, setBannerMessage, activeDelivery, availableOrders } = useRiderContext();

  // Hooks
  const { logout } = useAuth();
  const { toggleLoading, toggleOnline } = useOnlineToggle();
  const {
    isRefreshingOrders,
    isDeliveryLoading,
    fetchAvailableOrders,
    acceptOrder,
    markPickedUp: markOrderPickedUp,
    markDelivered,
  } = useOrders();
  const { lastCoords, gpsError } = useRiderLocation({
    isOnline,
    hasActiveDelivery: Boolean(activeDelivery),
  });

  // Local state
  const [showPhotoModal, setShowPhotoModal] = React.useState(false);
  const [photoSubmitting, setPhotoSubmitting] = React.useState(false);

  // ============ Handlers ============

  const handleAcceptOrder = async (orderNumber: string) => {
    setBannerMessage(null);
    try {
      await acceptOrder(orderNumber);
    } catch (err: any) {
      setBannerMessage({ type: 'error', message: err.message });
    }
  };

  const handleMarkPickedUp = async () => {
    setBannerMessage(null);
    try {
      await markOrderPickedUp();
    } catch (err: any) {
      setBannerMessage({ type: 'error', message: err.message });
    }
  };

  const handleCompleteDelivery = async (photoFile: File) => {
    setPhotoSubmitting(true);
    setBannerMessage(null);
    try {
      await markDelivered(photoFile);
      setShowPhotoModal(false);
      setBannerMessage({ type: 'info', message: 'Delivery completed successfully! Great job.' });
    } catch (err: any) {
      setBannerMessage({ type: 'error', message: err.message });
    } finally {
      setPhotoSubmitting(false);
    }
  };

  const handleLogout = async () => {
    if (activeDelivery) {
      setBannerMessage({ type: 'warning', message: 'Finish active delivery before logging out' });
      return;
    }
    await logout();
  };

  // ============ Render Helpers ============

  const getMapStatusText = () => {
    if (activeDelivery) return `Active Order #${activeDelivery.orderNumber}`;
    if (isOnline) return 'Waiting for nearby orders';
    return 'Offline';
  };

  const getKitchenCoords = () => {
    if (!activeDelivery?.kitchen) return null;
    return { ...activeDelivery.kitchen.location, name: activeDelivery.kitchen.name } as any;
  };

  const getCustomerCoords = () => {
    if (!activeDelivery?.deliveryAddress) return null;
    return { ...activeDelivery.deliveryAddress.location, address: activeDelivery.deliveryAddress.area } as any;
  };

  // ============ Render ============

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col max-w-md mx-auto relative select-none">
      <HeaderBar
        riderName={user?.name || ''}
        isOnline={isOnline}
        onToggleOnline={toggleOnline}
        isLoading={toggleLoading}
        hasActiveDelivery={Boolean(activeDelivery)}
      />

      {gpsError && <StatusBanner type="error" message={gpsError} />}
      {bannerMessage && (
        <StatusBanner type={bannerMessage.type} message={bannerMessage.message} onDismiss={() => setBannerMessage(null)} />
      )}

      {/* Sticky Map - Fixed position */}
      <div className="sticky top-0 z-10">
        <MapView
          riderCoords={lastCoords}
          gpsError={gpsError}
          kitchenCoords={getKitchenCoords()}
          customerCoords={getCustomerCoords()}
          statusText={getMapStatusText()}
        />
      </div>

      {/* Scrollable Orders Section */}
      {activeDelivery ? (
        <ActiveDeliveryPanel
          delivery={activeDelivery}
          onMarkPickedUp={handleMarkPickedUp}
          onOpenDeliveryProof={() => setShowPhotoModal(true)}
          isLoading={isDeliveryLoading}
        />
      ) : (
        <div className="flex-1 overflow-y-auto scroll-smooth">
          {isOnline ? (
            <AvailableOrders
              orders={availableOrders}
              isRefreshing={isRefreshingOrders}
              onRefresh={fetchAvailableOrders}
              onAccept={handleAcceptOrder}
              isAccepting={isDeliveryLoading}
            />
          ) : (
            <OfflineView onLogout={handleLogout} />
          )}
        </div>
      )}

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
};

// Extracted component for offline view
const OfflineView: React.FC<{ onLogout: () => void }> = ({ onLogout }) => (
  <div className="p-8 text-center text-zinc-500 mt-6">
    <p className="text-sm font-bold text-zinc-400">You are currently OFFLINE</p>
    <p className="text-xs text-zinc-600 mt-1">Tap GO ONLINE at the top to receive delivery requests.</p>

    <button
      onClick={onLogout}
      className="mt-8 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-400 hover:text-white flex items-center gap-2 mx-auto active:scale-95"
    >
      <LogOut className="w-4 h-4" />
      Sign Out
    </button>
  </div>
);
