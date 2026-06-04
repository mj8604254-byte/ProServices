import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { TopNav, BottomNav } from './components/Navigation';
import { Home } from './pages/Home';
import { Marketplace } from './pages/Marketplace';
import { Services, IFood, Profile, Infoproducts } from './pages/Placeholders';
import { useAuth } from './contexts/AuthContext';
import { Landing } from './pages/Landing';
import { RoleSelection } from './pages/RoleSelection';
import { Settings } from './pages/Settings';
import { AdminChat } from './components/AdminChat';
import { AddProduct } from './pages/AddProduct';
import { Auth } from './pages/Auth';
import { Onboarding } from './pages/Onboarding';
import AuthCallback from './pages/AuthCallback';
import { Search } from './pages/Search';
import { Support } from './pages/Support';
import { UserRole } from './types';
import { AdminLayout } from './pages/Admin/AdminLayout';
import { AdminDashboard } from './pages/Admin/AdminDashboard';
import { UsersManager } from './pages/Admin/UsersManager';
import { ProductModeration } from './pages/Admin/ProductModeration';
import { FinanceDashboard } from './pages/Admin/FinanceDashboard';

function Layout() {
  const { user, profile, loading, hasConnectionIssue } = useAuth();
  const [guestMode, setGuestMode] = React.useState(() => sessionStorage.getItem('guest_mode') === 'true');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Redirect to Landing if not signed in and not in guest mode
  if (!user && !guestMode) {
    return <Landing onGuestAccess={() => {
      sessionStorage.setItem('guest_mode', 'true');
      setGuestMode(true);
    }} />;
  }

  // Redirect to Role Selection if profile doesn't exist
  if (user && !profile) {
    return <RoleSelection />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <TopNav />
      {hasConnectionIssue && (
        <div className="bg-amber-600 text-white font-sans font-bold text-xs py-2.5 px-4 text-center flex items-center justify-center gap-2 relative z-50">
          <span>⚠️ <strong>Modo Offline Ativo:</strong> Ligação à base de dados lenta ou em manutenção. Pode navegar livremente em modo de demonstração.</span>
        </div>
      )}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 sm:py-8 mb-20 sm:mb-0">
        <Outlet />
      </main>
      <BottomNav />
      <AdminChat />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="products" element={<Marketplace />} />
          <Route path="services" element={<Services />} />
          <Route path="ifood" element={<IFood />} />
          <Route path="infoproducts" element={<Infoproducts />} />
          <Route path="products/add" element={<AddProduct />} />
          <Route path="onboarding" element={<Onboarding />} />
          <Route path="search" element={<Search />} />
          <Route path="support" element={<Support />} />
          <Route path="profile" element={<Settings />} />
          <Route path="legacy-profile" element={<Profile />} />
        </Route>
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UsersManager />} />
          <Route path="products" element={<ProductModeration />} />
          <Route path="finance" element={<FinanceDashboard />} />
          <Route path="tickets" element={<Support />} /> {/* Using existing support for now */}
        </Route>

        <Route path="/auth/role" element={<RoleSelection />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth" element={<Auth />} />
      </Routes>
    </Router>
  );
}

