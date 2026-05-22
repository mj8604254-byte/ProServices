import React from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  Wallet, 
  Ticket, 
  ShieldCheck,
  ChevronLeft,
  Settings
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';

export function AdminLayout() {
  const { profile, loading } = useAuth();

  if (loading) return null;
  if (!profile || profile.role !== UserRole.ADMIN) {
    return <Navigate to="/" />;
  }

  const menuItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Geral', end: true },
    { to: '/admin/users', icon: Users, label: 'Utilizadores' },
    { to: '/admin/products', icon: ShoppingBag, label: 'Produtos' },
    { to: '/admin/finance', icon: Wallet, label: 'Financeiro' },
    { to: '/admin/tickets', icon: Ticket, label: 'Suporte' },
    { to: '/admin/settings', icon: Settings, label: 'Definições' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-navy text-white flex flex-col h-auto md:h-screen md:sticky md:top-0 transition-all z-50">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange rounded-2xl flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col -space-y-1">
              <span className="font-black text-xl tracking-tighter uppercase">Moz</span>
              <span className="font-black text-[10px] tracking-[0.2em] text-orange uppercase">Admin Panel</span>
            </div>
          </div>
          <NavLink to="/" className="md:hidden p-2 hover:bg-white/5 rounded-xl transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </NavLink>
        </div>

        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `
                flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all group
                ${isActive 
                  ? 'bg-orange text-white shadow-lg shadow-orange/20' 
                  : 'text-white/40 hover:text-white hover:bg-white/5'}
              `}
            >
              <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-8 border-t border-white/5">
          <div className="flex items-center gap-3 p-4 bg-white/5 rounded-3xl border border-white/5">
            <div className="w-10 h-10 bg-orange/20 rounded-xl flex items-center justify-center text-orange font-black text-sm">
              {profile.displayName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-[11px] font-black uppercase tracking-tight truncate">{profile.displayName}</p>
              <p className="text-orange text-[9px] font-black uppercase tracking-widest">Super Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 max-w-[1600px] mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}
