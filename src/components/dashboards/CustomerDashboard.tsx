import React from 'react';
import { 
  ShoppingBag, 
  Heart, 
  MapPin, 
  CreditCard, 
  Clock, 
  Star, 
  ChevronRight, 
  Package, 
  Truck,
  RotateCcw,
  MessageSquare,
  Utensils
} from 'lucide-react';
import { motion } from 'motion/react';

export function CustomerDashboard({ profile }: { profile: any }) {
  const stats = [
    { label: 'Pedidos Totais', value: '12', icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Favoritos', value: '24', icon: Heart, color: 'text-red-500', bg: 'bg-red-50' },
    { label: 'Pontos Moz', value: '850', icon: Star, color: 'text-orange', bg: 'bg-orange/10' },
  ];

  const recentOrders = [
    { id: '#4829', date: 'Hoje, 14:30', status: 'Em Entrega', items: '2x Pizza Pepperoni', total: '1.200 MT', type: 'food' },
    { id: '#4812', date: 'Ontem', status: 'Entregue', items: 'Samsung Galaxy A54', total: '18.500 MT', type: 'product' },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-[32px] shadow-soft border border-slate-100 flex items-center gap-4"
          >
            <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
              <stat.icon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-2xl font-black text-navy">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Active tracking */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-navy uppercase tracking-tight flex items-center gap-2">
              <Truck className="w-5 h-5 text-orange" />
              Rastreio Activo
            </h3>
            <button className="text-[10px] font-black text-orange uppercase tracking-widest hover:underline">Ver Mapa</button>
          </div>
          
          <div className="bg-navy rounded-[32px] p-6 text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-orange/40 transition-colors" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pedido #4829</p>
                  <p className="text-xl font-bold">Pizza Pepperoni + Sumos</p>
                </div>
                <div className="px-3 py-1 bg-orange rounded-full text-[10px] font-black uppercase tracking-widest">Em Caminho</div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <p className="text-xs text-slate-300 font-medium">O estafeta está a 5 min de distância</p>
                  <p className="text-2xl font-black">05:00</p>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '75%' }}
                    className="h-full bg-orange shadow-[0_0_15px_rgba(255,100,0,0.5)]"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Chat Estafeta
                </button>
                <button className="flex-1 py-3 bg-white text-navy rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all">
                  Detalhes
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Orders */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-navy uppercase tracking-tight flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange" />
              Histórico Recente
            </h3>
            <button className="text-[10px] font-black text-orange uppercase tracking-widest hover:underline">Ver Todo</button>
          </div>

          <div className="space-y-3">
            {recentOrders.map((order) => (
              <button key={order.id} className="w-full bg-white p-4 rounded-[24px] shadow-soft border border-slate-100 flex items-center gap-4 hover:border-orange transition-all group">
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-navy group-hover:bg-orange/10 group-hover:text-orange transition-colors">
                  {order.type === 'food' ? <Utensils className="w-6 h-6" /> : <Package className="w-6 h-6" />}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{order.id}</p>
                    <p className="text-[10px] font-bold text-slate-500 italic uppercase">{order.date}</p>
                  </div>
                  <p className="font-bold text-navy text-sm leading-none mb-1">{order.items}</p>
                  <p className="text-[10px] font-black text-orange uppercase tracking-tighter">{order.total}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <RotateCcw className="w-4 h-4 text-slate-300 group-hover:text-orange transition-colors" />
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${order.status === 'Entregue' ? 'bg-green-100 text-green-600' : 'bg-orange/10 text-orange'}`}>
                    {order.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Grid of other sections */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Endereços', icon: MapPin, color: 'bg-purple-500' },
          { label: 'Pagamentos', icon: CreditCard, color: 'bg-emerald-500' },
          { label: 'Carteira', icon: Star, color: 'bg-amber-500' },
          { label: 'Suporte', icon: MessageSquare, color: 'bg-blue-500' },
        ].map((item) => (
          <button key={item.label} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-soft flex flex-col items-center gap-3 hover:border-orange hover:-translate-y-1 transition-all group">
            <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
              <item.icon className="w-6 h-6" />
            </div>
            <span className="font-black text-navy text-[10px] uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
