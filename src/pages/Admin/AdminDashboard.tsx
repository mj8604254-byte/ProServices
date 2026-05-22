import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShoppingBag, 
  Wrench, 
  Wallet, 
  Ticket, 
  ShieldCheck, 
  AlertCircle,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { UserRole } from '../../types';
import { Navigate, Link } from 'react-router-dom';

export function AdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingProducts: 0,
    openTickets: 0,
    monthlyVolume: 0
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { count: productsCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('moderation_status', 'pending');
        
        setStats(prev => ({
          ...prev,
          totalUsers: usersCount || 0,
          pendingProducts: productsCount || 0
        }));
      } catch (err) {
        console.error(err);
      }
    }
    fetchStats();
  }, []);

  if (profile?.role !== UserRole.ADMIN) {
    return <Navigate to="/" />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header>
        <h1 className="text-3xl font-black text-navy uppercase tracking-tight">Painel de Controlo Central</h1>
        <p className="text-slate-500 font-medium">Bem-vindo, {profile?.displayName}. Aqui está o estado da plataforma Moz ProServices.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Users} 
          label="Total Utilizadores" 
          value={stats.totalUsers.toLocaleString()} 
          trend="+12%" 
          color="blue" 
        />
        <StatCard 
          icon={ShoppingBag} 
          label="Produtos Pendentes" 
          value={stats.pendingProducts.toLocaleString()} 
          trend="Urgente" 
          color="orange" 
        />
        <StatCard 
          icon={Ticket} 
          label="Tickets de Suporte" 
          value="18" 
          trend="2 novos" 
          color="purple" 
        />
        <StatCard 
          icon={Wallet} 
          label="Volume Mensal" 
          value="245,000 MT" 
          trend="+8%" 
          color="green" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[40px] shadow-soft border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-navy uppercase tracking-tight">Ações Prioritárias</h2>
              <button className="text-xs font-black text-orange uppercase tracking-widest hover:underline">Ver todas</button>
            </div>
            
            <div className="space-y-4">
              <PriorityItem 
                type="verification"
                title="Novo Pedido de Verificação"
                subtitle="João Silva (Vendedor Micro)"
                time="Há 5 minutos"
                icon={ShieldCheck}
                color="blue"
              />
              <PriorityItem 
                type="product"
                title="Produto aguardando aprovação"
                subtitle="Cadeira Ergonómica - Oficina do Móvel"
                time="Há 15 minutos"
                icon={ShoppingBag}
                color="orange"
              />
              <PriorityItem 
                type="ticket"
                title="Ticket Crítico: Problema no Pagamento"
                subtitle="Maria Santos"
                time="Há 32 minutos"
                icon={AlertCircle}
                color="red"
              />
            </div>
          </div>
        </div>

        {/* Quick Access Menu */}
        <div className="space-y-6">
          <div className="bg-navy text-white p-8 rounded-[40px] shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-orange/30 transition-colors" />
            <div className="relative z-10">
              <h3 className="text-lg font-black uppercase tracking-tight mb-6">Gestão Rápida</h3>
              <div className="grid grid-cols-2 gap-4">
                <QuickLink label="Utilizadores" icon={Users} to="/admin/users" />
                <QuickLink label="Produtos" icon={ShoppingBag} to="/admin/products" />
                <QuickLink label="Suporte" icon={Ticket} to="/admin/tickets" />
                <QuickLink label="Finanças" icon={Wallet} to="/admin/finance" />
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[40px] shadow-soft border border-slate-100">
            <h3 className="text-lg font-black text-navy uppercase tracking-tight mb-6">Estado dos Servidores</h3>
            <div className="space-y-4">
              <StatusRow label="Supabase (Auth/DB)" status="online" />
              <StatusRow label="Supabase (Storage)" status="online" />
              <StatusRow label="Gateway M-Pesa" status="online" />
              <StatusRow label="Sms Service" status="warning" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, trend, color }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600',
    orange: 'bg-orange/10 text-orange',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white p-6 rounded-[32px] shadow-soft border border-slate-100"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-12 h-12 ${colors[color]} rounded-2xl flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      </div>
      <div className="flex items-end justify-between">
        <h3 className="text-2xl font-black text-navy">{value}</h3>
        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${trend.includes('+') ? 'bg-green-50 text-green-600' : 'bg-orange/10 text-orange'}`}>
          {trend}
        </span>
      </div>
    </motion.div>
  );
}

function PriorityItem({ title, subtitle, time, icon: Icon, color }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600',
    orange: 'bg-orange/10 text-orange',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors group">
      <div className={`w-12 h-12 ${colors[color]} rounded-xl flex items-center justify-center shrink-0`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-black text-navy uppercase tracking-tight">{title}</p>
        <p className="text-[10px] text-slate-400 font-bold uppercase">{subtitle}</p>
      </div>
      <div className="text-right">
        <p className="text-[10px] font-bold text-slate-300 uppercase">{time}</p>
        <button className="text-[10px] font-black text-orange uppercase tracking-widest hover:underline mt-1">Tratar</button>
      </div>
    </div>
  );
}

function QuickLink({ label, icon: Icon, to }: any) {
  return (
    <Link to={to} className="flex flex-col items-center justify-center gap-3 p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/5 group">
      <Icon className="w-5 h-5 text-orange group-hover:scale-110 transition-transform" />
      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
    </Link>
  );
}

function StatusRow({ label, status }: any) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold text-slate-500">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black text-navy uppercase tracking-widest">{status}</span>
        <div className={`w-2 h-2 rounded-full ${status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-orange animate-pulse'}`} />
      </div>
    </div>
  );
}
