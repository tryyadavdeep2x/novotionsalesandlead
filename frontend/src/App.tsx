import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ToastProvider } from './components/Toast.js';
import { Login } from './pages/Login.js';
import { LeadDashboard } from './pages/LeadDashboard.js';
import { SalesDashboard } from './pages/SalesDashboard.js';
import { AdminDashboard } from './pages/AdminDashboard.js';
import { NovotionLogo } from './components/NovotionLogo.js';
import { UpdateNotification } from './components/UpdateNotification.js';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center text-muted">
        <div className="relative mb-6">
          <div className="h-16 w-16 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <NovotionLogo variant="icon" size="sm" className="animate-pulse" />
          </div>
        </div>
        <h2 className="text-xs font-bold tracking-widest text-foreground/80 uppercase animate-pulse">
          Establishing Secure Session...
        </h2>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  switch (user.role) {
    case 'LEAD_TEAM':
      return <LeadDashboard />;
    case 'SALES_TEAM':
      return <SalesDashboard />;
    case 'ADMIN':
      return <AdminDashboard />;
    default:
      return (
        <div className="min-h-screen bg-canvas flex flex-col items-center justify-center text-rose-500">
          <h2 className="text-lg font-bold">Access Unauthorized</h2>
          <p className="text-xs text-muted mt-2">Your session role configuration is not recognized.</p>
        </div>
      );
  }
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
        <UpdateNotification />
      </AuthProvider>
    </ToastProvider>
  );
}
