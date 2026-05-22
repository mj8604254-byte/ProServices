import React from 'react';
import { 
  Wrench, 
  Calendar, 
  Users, 
  Wallet, 
  Star, 
  MessageSquare, 
  Plus, 
  ChevronRight,
  Clock,
  CheckCircle2,
  TrendingUp,
  Award
} from 'lucide-react';
import { motion } from 'motion/react';
import { UserProfile } from '../../types';

interface ServiceProviderDashboardProps {
  profile: UserProfile;
}

export function ServiceProviderDashboard({ profile }: ServiceProviderDashboardProps) {
  const stats = [
    { label: 'Trabalhos Ativos', value: '8', icon: Wrench, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Marcados', value: '12', icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Reputação', value: '4.9', icon: Star, color: 'text-orange', bg: 'bg-orange/10' },
    { label: 'Saldo Disponível', value: '12,450 MT', icon: Wallet, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  const recentBookings = [
    { id: 1, client: 'António Cuamba', service: 'Reparação Elétrica', date: 'Hoje, 14:30', status: 'confirmado' },
    { id: 2, client: 'Sofia Machava', service: 'Manutenção de AC', date: 'Amanhã, 09:00', status: 'pendente' },
    { id: 3, client: 'Lucas Muianga', service: 'Instalação Solar', date: '22 Maio', status: 'concluído' },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-[32px] shadow-soft border border-slate-100 group hover:border-orange transition-all"
          >
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-xl font-black text-navy">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Bookings & Schedule */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[40px] shadow-soft border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-black text-navy uppercase tracking-tight">Próximos Agendamentos</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Gestão de calendário e serviços</p>
              </div>
              <button className="p-3 bg-navy text-white rounded-2xl shadow-lg hover:bg-orange transition-all group">
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              </button>
            </div>

            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="p-5 bg-slate-50 rounded-[32px] border border-transparent hover:border-orange/20 hover:bg-white transition-all group flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                      <Clock className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-black text-navy uppercase text-sm tracking-tight">{booking.client}</p>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{booking.service} • {booking.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                      booking.status === 'confirmado' ? 'bg-blue-50 text-blue-600' : 
                      booking.status === 'pendente' ? 'bg-orange/10 text-orange' : 
                      'bg-green-50 text-green-600'
                    }`}>
                      {booking.status}
                    </span>
                    <button className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-300 group-hover:text-orange transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-navy text-white p-10 rounded-[48px] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange/20 rounded-full blur-[100px] -mr-32 -mt-32" />
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="w-20 h-20 bg-white/10 rounded-[32px] flex items-center justify-center backdrop-blur-md">
                <Award className="w-10 h-10 text-orange" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Perfil Verificado Pro</h3>
                <p className="text-slate-400 text-sm font-medium mb-6">Aumenta a tua visibilidade em 300% com o selo de recomendação Moz ProServices.</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                  <button className="px-8 py-4 bg-orange text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white hover:text-navy transition-all">Saber Mais</button>
                  <button className="px-8 py-4 bg-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/20 transition-all border border-white/5">Esconder</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Tasks/Messages */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[40px] shadow-soft border border-slate-100 text-center">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[32px] flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-black text-navy uppercase tracking-tight mb-2">Plano Profissional</h3>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6">Faltam 4 dias para renovar</p>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-8">
              <div className="h-full bg-indigo-600 w-[85%]" />
            </div>
            <button className="w-full py-4 bg-navy text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-orange transition-all">Renovar Plano</button>
          </div>

          <div className="bg-white p-8 rounded-[40px] shadow-soft border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-navy uppercase tracking-tight">Solicitações Rápidas</h3>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
            <div className="space-y-4">
              <QuickTask label="Reparação TV" time="15 min" icon={MessageSquare} />
              <QuickTask label="Culinária" time="45 min" icon={MessageSquare} />
              <QuickTask label="Informática" time="1h" icon={MessageSquare} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickTask({ label, time, icon: Icon }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group cursor-pointer hover:bg-navy transition-all">
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-indigo-600 group-hover:text-orange" />
        <span className="text-xs font-bold text-navy group-hover:text-white transition-colors">{label}</span>
      </div>
      <span className="text-[9px] font-black text-slate-300 group-hover:text-slate-400 uppercase">{time}</span>
    </div>
  );
}
