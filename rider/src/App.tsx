import React from 'react';
import { RiderProvider } from './context/RiderContext';
import { useAuth } from './hooks/useAuth';
import { AuthScreens } from './components/AuthScreens';
import { RiderDashboard } from './components/RiderDashboard';

function AppContent() {
  const { authChecking, user } = useAuth();

  if (authChecking) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400 text-sm font-medium">
        Loading Rider Partner Portal...
      </div>
    );
  }

  if (!user) {
    return <AuthScreens />;
  }

  return <RiderDashboard />;
}

export default function App() {
  return (
    <RiderProvider>
      <AppContent />
    </RiderProvider>
  );
}

