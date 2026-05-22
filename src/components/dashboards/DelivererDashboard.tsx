import React, { useState } from 'react';
import { 
  Truck, 
  MapPin, 
  Navigation, 
  Clock, 
  DollarSign, 
  Star, 
  Power, 
  History, 
  CreditCard, 
  Shield, 
  MessageSquare,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function DelivererDashboard({ profile }: { profile: any }) {
  const [isOnline, setIsOnline] = useState(false);
  
  const stats = [
    { label: 'Ganhos Hoje', value: '450 MT', icon: DollarSign, color: 'text-green-500' },
    { label: 'Entregas Hoje', value: '12', icon: Truck, color: 'text-orange' },
    { label: 'Avaliação', value: '4.9', icon: Star, color: 'text-amber-400' },
  ];

  const activeDeliveries = [
    { id: '#4829', restaurant: 'MozBurguer', address: 'Av. Eduardo Mondlane, 24', time: '12 min', earnings: '50 MT' },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Status & Quick Toggle */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-8 rounded-[40px] shadow-soft border border-slate-100">
        <div className="flex items-center gap-6">
          <div className="relative">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" className="w-20 h-20 rounded-full border-4 border-slate-50 shadow-inner" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-20 h-20 bg-navy rounded-full flex items-center justify-center text-white text-2xl font-black">
                {profile?.displayName?.charAt(0)}
              </div>
            )}
            <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-4 border-white ${isOnline ? 'bg-green-500' : 'bg-slate-300'}`} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-navy uppercase tracking-tight">{profile?.displayName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{profile?.vehicleType || 'Mota'}</span>
              <span className="w-1 h-1 bg-slate-200 rounded-full" />
              <span className="text-[10px] font-black text-orange uppercase tracking-widest">{profile?.licensePlate || 'MOT-1234'}</span>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setIsOnline(!isOnline)}
          className={`px-10 py-5 rounded-3xl font-black uppercase tracking-widest flex items-center gap-3 transition-all ${
            isOnline 
              ? 'bg-green-500 text-white shadow-xl shadow-green-500/20 hover:bg-green-600' 
              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
          }`}
        >
          <Power className="w-6 h-6" />
          {isOnline ? 'Em Trabalho' : 'Ficar Online'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <div key={stat.label} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-soft flex items-center gap-5">
            <div className={`w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-2xl font-black text-navy">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Real-time Logistics Map Visualization */}
        <section className="space-y-4">
          <h3 className="text-lg font-black text-navy uppercase tracking-tight flex items-center gap-2">
            <Navigation className="w-5 h-5 text-orange" />
            Navegação & Rotas
          </h3>
          <div className="aspect-video bg-slate-200 rounded-[40px] relative overflow-hidden group shadow-inner border-2 border-white">
            <div className="absolute inset-0 bg-[url('https://api.dicebear.com/7.x/shapes/svg?seed=map')] opacity-20" />
            
            {/* Mock Map Elements */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute top-1/3 left-1/3 p-3 bg-white rounded-2xl shadow-xl z-10 border border-orange/20"
            >
              <div className="relative">
                <Truck className="w-6 h-6 text-orange" />
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
              </div>
            </motion.div>

            <div className="absolute bottom-1/4 right-1/4 p-3 bg-navy text-white rounded-2xl shadow-xl z-10">
              <MapPin className="w-6 h-6" />
            </div>

            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <motion.path 
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, repeat: Infinity }}
                d="M150 100 Q 250 150, 400 300"
                fill="none"
                stroke="rgba(255,100,0,0.5)"
                strokeWidth="4"
                strokeDasharray="8 4"
              />
            </svg>

            <div className="absolute bottom-6 left-6 right-6">
              <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl flex items-center justify-between border border-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange rounded-xl flex items-center justify-center text-white">
                    <Navigation className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">Destino Próximo</p>
                    <p className="text-xs font-bold text-navy truncate">Av. Eduardo Mondlane, 24</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-navy text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Abrir GPS</button>
              </div>
            </div>
          </div>
        </section>

        {/* Deliveries & Availability */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-navy uppercase tracking-tight flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange" />
              Pedidos Disponíveis
            </h3>
            <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">Procurando...</span>
          </div>

          <div className="space-y-4">
            {activeDeliveries.map((delivery) => (
              <div key={delivery.id} className="bg-white rounded-[32px] p-6 shadow-soft border border-slate-100 hover:border-orange transition-all group overflow-hidden relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-navy group-hover:bg-orange/10 group-hover:text-orange transition-colors">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{delivery.id}</p>
                      <p className="text-sm font-bold text-navy">{delivery.restaurant}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-green-600">+{delivery.earnings}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">{delivery.time}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl mb-6">
                  <MapPin className="w-4 h-4 text-orange" />
                  <p className="text-xs font-bold text-navy truncate">{delivery.address}</p>
                </div>

                <div className="flex gap-3">
                  <button className="flex-1 py-4 bg-orange text-white rounded-2xl font-black uppercase tracking-widest hover:bg-orange/90 transition-all shadow-lg shadow-orange/20">
                    Aceitar Pedido
                  </button>
                  <button className="px-6 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-colors">
                    Ignorar
                  </button>
                </div>
              </div>
            ))}
            
            {!isOnline && (
              <div className="p-12 text-center bg-white rounded-[32px] border-2 border-dashed border-slate-200">
                <Power className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Fica online para ver pedidos</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Footer Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Histórico', icon: History, color: 'bg-blue-500' },
          { label: 'Ganhos', icon: DollarSign, color: 'bg-green-500' },
          { label: 'Carteira', icon: CreditCard, color: 'bg-amber-500' },
          { label: 'Suporte', icon: Shield, color: 'bg-slate-700' },
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
