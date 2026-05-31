import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  ShoppingBag, 
  Truck, 
  Utensils, 
  Wrench, 
  User, 
  Bell, 
  LogOut, 
  LayoutGrid, 
  Home,
  BookOpen, 
  SlidersHorizontal, 
  MapPin, 
  Tag, 
  Percent, 
  Filter, 
  Mic, 
  RefreshCw, 
  ChevronRight, 
  X, 
  Check,
  History,
  TrendingUp,
  Award,
  ShieldCheck
} from 'lucide-react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { CATEGORIES } from '../constants';
import { RoleSwitchModal } from './RoleSwitchModal';

export function TopNav() {
  const { profile, user } = useAuth();
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = () => navigate('/auth');

  // Hardcoded notifications for demo
  const notifications = [
    { id: 1, title: 'Cupão Moz Exclusivo!', message: 'Usa o código MOZPRO10 e ganha 10% de desconto.', time: 'agora', read: false },
    { id: 2, title: 'Pedido #4829 Aceite', message: 'O vendedor aceitou o seu pedido e está a preparar.', time: '15 min atrás', read: false },
    { id: 3, title: 'Fatura Disponível', message: 'A fatura do seu último serviço já está disponível para download.', time: '2h atrás', read: true },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-soft">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 h-20 flex items-center justify-between gap-2 sm:gap-4">
        {/* Separated Logo & Category Toggle */}
        <div className="flex items-center gap-3 relative">
          {/* Explorer Button (Navy Box) */}
          <button 
            onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
            className="w-11 h-11 bg-navy rounded-2xl flex items-center justify-center hover:rotate-6 hover:bg-navy/90 transition-all shadow-soft group"
            title="Explorar"
          >
            <LayoutGrid className={`w-5 h-5 text-orange transition-transform duration-500 ${isCategoriesOpen ? 'rotate-90' : 'group-hover:scale-110'}`} />
          </button>

          {/* Brand Logo Link */}
          <NavLink to="/" className="flex flex-col -space-y-1 items-start group">
            <span className="font-black text-xl tracking-tighter text-navy uppercase group-hover:text-orange transition-colors">Moz</span>
            <span className="font-black text-[10px] tracking-[0.2em] text-slate-400 uppercase">ProServices</span>
          </NavLink>

          <AnimatePresence>
            {isCategoriesOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsCategoriesOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-16 left-0 w-[480px] bg-white rounded-[32px] shadow-2xl border border-slate-100 p-8 z-50 origin-top-left"
                >
                  <div className="grid grid-cols-2 gap-8">
                    {/* Products & Food */}
                    <div className="space-y-8">
                      <div>
                        <h4 className="flex items-center gap-2 text-[10px] font-black text-navy uppercase tracking-[0.2em] mb-4 border-b border-slate-100 pb-2">
                          <ShoppingBag className="w-4 h-4 text-orange" /> Lojas & Produtos
                        </h4>
                        <div className="grid gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                          {CATEGORIES.products.map(cat => (
                            <Link key={cat} to={`/products?category=${cat}`} onClick={() => setIsCategoriesOpen(false)} className="text-xs font-bold text-slate-500 hover:text-orange transition-colors">{cat}</Link>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="flex items-center gap-2 text-[10px] font-black text-navy uppercase tracking-[0.2em] mb-4 border-b border-slate-100 pb-2 border-dashed">
                          <Utensils className="w-4 h-4 text-orange" /> iFood & Delivery
                        </h4>
                        <div className="grid gap-2 max-h-44 overflow-y-auto pr-2 custom-scrollbar">
                          {CATEGORIES.ifood.map(cat => (
                            <Link key={cat} to={`/ifood?category=${cat}`} onClick={() => setIsCategoriesOpen(false)} className="text-xs font-bold text-slate-500 hover:text-orange transition-colors">{cat}</Link>
                          ))}
                        </div>
                      </div>
                    </div>
                    {/* Services & Info */}
                    <div className="space-y-8">
                      <div>
                        <h4 className="flex items-center gap-2 text-[10px] font-black text-navy uppercase tracking-[0.2em] mb-4 border-b border-slate-100 pb-2">
                          <Wrench className="w-4 h-4 text-orange" /> Serviços & Profissionais
                        </h4>
                        <div className="grid gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                          {CATEGORIES.services.map(cat => (
                            <Link key={cat} to={`/services?category=${cat}`} onClick={() => setIsCategoriesOpen(false)} className="text-xs font-bold text-slate-500 hover:text-orange transition-colors">{cat}</Link>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="flex items-center gap-2 text-[10px] font-black text-navy uppercase tracking-[0.2em] mb-4 border-b border-slate-100 pb-2 border-dashed">
                          <BookOpen className="w-4 h-4 text-orange" /> Infoprodutos & Cursos
                        </h4>
                        <div className="grid gap-2 max-h-44 overflow-y-auto pr-2 custom-scrollbar">
                          {CATEGORIES.infoproducts.map(cat => (
                            <Link key={cat} to={`/infoproducts?category=${cat}`} onClick={() => setIsCategoriesOpen(false)} className="text-xs font-bold text-slate-500 hover:text-orange transition-colors">{cat}</Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                   
                   <div className="mt-10 pt-6 border-t border-slate-50 flex items-center justify-between">
                     <Link to="/products" onClick={() => setIsCategoriesOpen(false)} className="px-6 py-3 bg-navy text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange transition-all">Ver Todo o Catálogo</Link>
                     <div className="flex items-center gap-2 text-[9px] font-bold text-slate-300 uppercase italic">
                       <Award className="w-4 h-4" /> Qualidade Garantida
                     </div>
                   </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Global Search Bar - Redirects to Search Page */}
        <div className="flex-1 max-w-xl hidden sm:block">
           <button 
            onClick={() => navigate('/search')}
            className="w-full bg-slate-50 hover:bg-slate-100 border-none rounded-2xl py-3 px-12 text-sm font-medium text-slate-400 flex items-center gap-4 transition-all group"
          >
            <Search className="w-5 h-5 group-hover:text-orange transition-colors" />
            <span>O que procuras hoje?</span>
            <div className="ml-auto flex items-center gap-2">
              <Mic className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </div>
          </button>
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
          {/* Mobile Search Icon */}
          <button 
            onClick={() => navigate('/search')}
            className="sm:hidden w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-50 text-navy hover:bg-orange/10 hover:text-orange transition-all"
          >
            <Search className="w-5 h-5" />
          </button>

          <div className="relative">
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className={`w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-2xl transition-all relative ${isNotificationsOpen ? 'bg-orange/5 text-orange' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <Bell className="w-6 h-6" />
              {notifications.some(n => !n.read) && (
                <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-orange rounded-full border-2 border-white animate-pulse" />
              )}
            </button>

            <AnimatePresence>
              {isNotificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-14 right-0 w-80 bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden z-50 origin-top-right p-2"
                  >
                    <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                      <h3 className="font-black text-navy text-[10px] uppercase tracking-widest">Notificações</h3>
                      <button className="text-[9px] font-black text-slate-300 uppercase hover:text-orange">Lido</button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map(n => (
                        <button key={n.id} className="w-full text-left p-4 hover:bg-slate-50 transition-colors flex gap-4 rounded-2xl relative">
                          {!n.read && <div className="absolute top-4 left-1 w-1.5 h-1.5 bg-orange rounded-full" />}
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${n.read ? 'bg-slate-100 text-slate-400' : 'bg-orange/10 text-orange'}`}>
                            <Bell className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-navy text-[12px] leading-tight mb-1">{n.title}</p>
                            <p className="text-[10px] text-slate-400 leading-snug">{n.message}</p>
                            <span className="text-[8px] font-black uppercase text-slate-200 mt-2 block">{n.time}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                    <Link to="/profile" onClick={() => setIsNotificationsOpen(false)} className="block w-full py-3 bg-slate-50 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-100 transition-all rounded-2xl mt-2">Ver Painel Completo</Link>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {user ? (
            <div className="flex items-center gap-3">
              {/* Role Switcher in Top Nav */}
              <button 
                onClick={() => setIsRoleModalOpen(true)}
                className="w-12 h-12 flex items-center justify-center rounded-2xl text-slate-400 hover:bg-orange/5 hover:text-orange transition-all group"
                title="Trocar Role"
              >
                <RefreshCw className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
              </button>

              {profile?.role === UserRole.ADMIN && (
                <Link 
                  to="/admin" 
                  className="hidden md:flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-xl hover:bg-orange transition-all group"
                >
                  <ShieldCheck className="w-4 h-4 text-orange group-hover:text-white transition-colors" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Admin</span>
                </Link>
              )}

              <Link to="/profile" className="flex items-center gap-1 sm:gap-3 group px-1.5 sm:px-2 py-1.5 rounded-2xl hover:bg-slate-50 transition-all shrink-0">
                <div className="text-right hidden sm:block">
                  <p className="text-[11px] font-black text-navy uppercase tracking-tight leading-none mb-0.5">{profile?.displayName}</p>
                  <p className="text-[8px] font-black text-orange uppercase tracking-[0.15em]">{profile?.role.replace('_', ' ')}</p>
                </div>
                <div className="relative">
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="" className="w-10 h-10 rounded-2xl border-2 border-transparent group-hover:border-orange transition-all shadow-soft overflow-hidden object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-10 h-10 bg-navy rounded-2xl flex items-center justify-center text-white text-xs font-black group-hover:bg-orange transition-all shadow-soft">
                      {profile?.displayName?.charAt(0)}
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm" />
                </div>
              </Link>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              className="px-6 py-3 bg-navy text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange hover:shadow-xl transition-all"
            >
              Entrar
            </button>
          )}
        </div>
      </div>
      
      <RoleSwitchModal isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)} currentProfile={profile} />
    </header>
  );
}

export function BottomNav() {
  const { profile } = useAuth();
  
  const links = [
    { to: '/', icon: Home, label: 'Início', color: 'text-blue-500' },
    { to: '/products', icon: ShoppingBag, label: 'Lojas', color: 'text-purple-500' },
    { to: '/services', icon: Wrench, label: 'Serviços', color: 'text-amber-500' },
    { to: '/ifood', icon: Utensils, label: 'Delivery', color: 'text-orange' },
    { to: '/search', icon: Search, label: 'Busca', color: 'text-navy' },
    { to: '/profile', icon: User, label: 'Painel', color: 'text-slate-800' },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 px-4 py-3 flex justify-between items-end z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
      {links.map(({ to, icon: Icon, label, color }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1.5 transition-all relative ${
              isActive ? color : 'text-slate-400'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.div 
                  layoutId="active-tab"
                  className={`absolute -top-3 w-1.5 h-1.5 rounded-full ${color.replace('text-', 'bg-')}`}
                />
              )}
              <div className={`p-2 rounded-2xl transition-all ${isActive ? `${color.replace('text-', 'bg-')}/10` : 'hover:bg-slate-50'}`}>
                <Icon className={`w-6 h-6 stroke-[2.5px]`} />
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest`}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
