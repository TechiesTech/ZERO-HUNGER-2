import React from 'react';
import { HeaderBar } from './HeaderBar';
import { StatusBanner } from './StatusBanner';
import { MapView } from './MapView';
import { AvailableOrders } from './AvailableOrders';
import { ActiveDeliveryPanel } from './ActiveDeliveryPanel';
import { DeliveryPhotoModal } from './DeliveryPhotoModal';
import { ProfilePage } from './ProfilePage';
import { EditProfilePage } from './EditProfilePage';
import { SummaryPage } from './SummaryPage';
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
    releaseOrder,
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
  const [showMenu, setShowMenu] = React.useState(false);
  const [currentView, setCurrentView] = React.useState<'dashboard' | 'profile' | 'editProfile' | 'summary'>('dashboard');

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

  const handleReleaseOrder = async () => {
    if (!activeDelivery) return;
    setBannerMessage(null);
    try {
      await releaseOrder(activeDelivery.orderNumber);
      setBannerMessage({ type: 'info', message: 'Order released successfully' });
    } catch (err: any) {
      setBannerMessage({ type: 'error', message: err.message });
    }
  };

  const handleCompleteDelivery = async (photoFile: File, otp: string) => {
    setPhotoSubmitting(true);
    setBannerMessage(null);
    try {
      await markDelivered(photoFile, otp);
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

  const handleMenuClick = () => {
    setShowMenu(true);
  };

  const handleMenuClose = () => {
    setShowMenu(false);
  };

  const handleProfileClick = () => {
    setShowMenu(false);
    setCurrentView('profile');
  };

  const handleEditProfileClick = () => {
    setCurrentView('editProfile');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  const handleBackToProfile = () => {
    setCurrentView('profile');
  };

  const handleSaveProfile = async (data: any) => {
    // TODO: Call API to update profile
    // Profile saved successfully
    setCurrentView('profile');
  };

  const handleSummaryClick = () => {
    setShowMenu(false);
    setCurrentView('summary');
  };

  // ============ Render Helpers ============

  const getMapStatusText = () => {
    if (activeDelivery) {
      const isPickedUp = activeDelivery.customerMealStatus === 'outfordelivery';
      return isPickedUp ? `Delivering #${activeDelivery.orderNumber}` : `Pickup #${activeDelivery.orderNumber}`;
    }
    if (isOnline) return 'Waiting for nearby orders';
    return 'Offline';
  };

  const getKitchenCoords = () => {
    if (!activeDelivery?.kitchen?.location) return null;
    // Only show kitchen before pickup
    if (activeDelivery.customerMealStatus === 'outfordelivery') return null;
    return { latitude: activeDelivery.kitchen.location.latitude, longitude: activeDelivery.kitchen.location.longitude, name: activeDelivery.kitchen.name } as any;
  };

  const getCustomerCoords = () => {
    if (!activeDelivery?.deliveryAddress?.location) return null;
    // Only show customer after pickup
    if (activeDelivery.customerMealStatus !== 'outfordelivery') return null;
    return { latitude: activeDelivery.deliveryAddress.location.latitude, longitude: activeDelivery.deliveryAddress.location.longitude, address: activeDelivery.deliveryAddress.area } as any;
  };

  // ============ Render ============

  // Show Profile Page
  if (currentView === 'profile') {
    return (
      <ProfilePage
        user={user}
        onBack={handleBackToDashboard}
        onEditProfile={handleEditProfileClick}
      />
    );
  }

  // Show Edit Profile Page
  if (currentView === 'editProfile') {
    return (
      <EditProfilePage
        user={user}
        onBack={handleBackToProfile}
        onSave={handleSaveProfile}
      />
    );
  }

  // Show Summary Page
  if (currentView === 'summary') {
    return (
      <SummaryPage
        user={user}
        onBack={handleBackToDashboard}
      />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col max-w-md mx-auto relative select-none">
      <HeaderBar
        riderName={user?.name || ''}
        isOnline={isOnline}
        onToggleOnline={toggleOnline}
        onMenuClick={handleMenuClick}
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
          eta={null}
        />
      </div>

      {/* Scrollable Orders Section */}
      {activeDelivery ? (
        <ActiveDeliveryPanel
          delivery={activeDelivery}
          onMarkPickedUp={handleMarkPickedUp}
          onReleaseOrder={handleReleaseOrder}
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

      {/* Menu Side Panel */}
      <>
        {/* Overlay */}
        <div
          className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 ${showMenu ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={handleMenuClose}
        />
        {/* Side Panel */}
        <div className={`fixed top-0 left-0 h-full w-64 max-w-[80vw] bg-zinc-900 z-50 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${showMenu ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-6 border-b border-zinc-800">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Menu</h2>
              <button
                type="button"
                onClick={handleMenuClose}
                className="text-zinc-400 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <button
              onClick={handleProfileClick}
              className="w-full p-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-left flex items-center justify-between transition-all active:scale-95"
            >
              <span className="text-sm font-semibold text-white">Profile</span>
              <span className="text-zinc-400">→</span>
            </button>
            <button
              onClick={handleSummaryClick}
              className="w-full p-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-left flex items-center justify-between transition-all active:scale-95"
            >
              <span className="text-sm font-semibold text-white">Delivery Summary</span>
              <span className="text-zinc-400">→</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full p-4 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 text-left flex items-center justify-between transition-all active:scale-95"
            >
              <span className="text-sm font-semibold text-rose-400">Sign Out</span>
              <span className="text-rose-400">→</span>
            </button>
          </div>
        </div>
      </>
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
