import React from 'react';
import { 
  TrendingUp, 
  Link as LinkIcon, 
  Users, 
  DollarSign, 
  MousePointer2, 
  BarChart3, 
  Award, 
  ShoppingBag,
  History,
  Copy,
  ChevronRight,
  Target
} from 'lucide-react';
import { motion } from 'motion/react';

export function AffiliateDashboard({ profile }: { profile: any }) {
  const stats = [
    { label: 'Ganhos Totais', value: '15.200 MT', icon: DollarSign, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Cliques', value: '1.240', icon: MousePointer2, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Conversões', value: '45', icon: Target, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Comissão Média', value: '10%', icon: TrendingUp, color: 'text-orange', bg: 'bg-orange/10' },
  ];

  const recentPerformance = [
    { product: 'Samsung Galaxy A54', clicks: 120, conversions: 5, commission: '925 MT', date: 'Hoje' },
    { product: 'Curso Marketing IA', clicks: 85, conversions: 12, commission: '2.400 MT', date: 'Ontem' },
    { product: 'Pizza Napolitana', clicks: 450, conversions: 28, commission: '1.400 MT', date: 'Esta semana' },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Link copiado!');
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Link Card */}
      <div className="bg-navy rounded-[40px] p-8 text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange/20 rounded-full blur-3xl -mr-32 -mt-32" />
        
        <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Nível: <span className="text-white">Afiliado Pro</span></p>
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight mb-2">O Teu Link de <span className="text-orange underline decoration-4 underline-offset-4">Afiliado</span></h2>
            <p className="text-slate-400 text-sm font-medium leading-relaxed">Partilha este link e ganha comissões em cada venda realizada através de ti.</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Link Principal</label>
            <div className="flex items-center gap-2 bg-black/20 rounded-2xl p-2 border border-white/5">
              <input 
                readOnly
                value={`mozpro.co/ref/${profile?.uid?.slice(0, 8)}`}
                className="flex-1 bg-transparent border-none text-xs font-mono text-slate-300 focus:ring-0"
              />
              <button 
                onClick={() => copyToClipboard(`mozpro.co/ref/${profile?.uid?.slice(0, 8)}`)}
                className="p-3 bg-white text-navy rounded-xl hover:bg-orange hover:text-white transition-all shadow-lg"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-4 flex gap-4">
              <div className="flex-1">
                <p className="text-[20px] font-black">1.2k</p>
                <p className="text-[9px] font-black text-slate-400 uppercase">Total Visitas</p>
              </div>
              <div className="w-px h-8 bg-white/10 mt-2" />
              <div className="flex-1 text-right">
                <p className="text-[20px] font-black">45</p>
                <p className="text-[9px] font-black text-slate-400 uppercase">Conversões</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-5 rounded-[32px] shadow-soft border border-slate-100"
          >
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-xl font-black text-navy">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Performance List */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-navy uppercase tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-orange" />
              Performance Detalhada
            </h3>
            <button className="text-[10px] font-black text-orange uppercase tracking-widest hover:underline">Download CSV</button>
          </div>

          <div className="bg-white rounded-[32px] shadow-soft border border-slate-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Campanha</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliques</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Conv.</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Comissão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentPerformance.map((item) => (
                  <tr key={item.product} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-[11px] font-bold text-navy leading-none">{item.product}</p>
                      <p className="text-[9px] text-slate-400 font-medium italic mt-1">{item.date}</p>
                    </td>
                    <td className="px-6 py-4 text-[11px] font-bold text-navy">{item.clicks}</td>
                    <td className="px-6 py-4 text-[11px] font-bold text-navy text-center">{item.conversions}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-[11px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-lg">{item.commission}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Payout & Settings */}
        <section className="space-y-4">
          <h3 className="text-lg font-black text-navy uppercase tracking-tight flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-orange" />
            Levantamento
          </h3>
          <div className="bg-white p-6 rounded-[32px] shadow-soft border border-slate-100">
            <div className="mb-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo Disponível</p>
              <h4 className="text-3xl font-black text-navy">2.400 MT</h4>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-slate-400">Em processamento</span>
                <span className="text-navy">1.200 MT</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-slate-400">Próximo pagamento</span>
                <span className="text-navy">25 Maio</span>
              </div>
            </div>

            <button className="w-full py-4 bg-orange text-white rounded-2xl font-black uppercase tracking-widest hover:bg-orange/90 transition-all shadow-lg shadow-orange/20 mb-3">
              Solicitar Saque
            </button>
            <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-tighter">Mínimo para saque: 500 MT</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-soft flex flex-col items-center gap-2 hover:border-orange transition-all group">
              <History className="w-5 h-5 text-navy group-hover:text-orange" />
              <span className="text-[9px] font-black text-navy uppercase">Histórico</span>
            </button>
            <button className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-soft flex flex-col items-center gap-2 hover:border-orange transition-all group">
              <ShoppingBag className="w-5 h-5 text-navy group-hover:text-orange" />
              <span className="text-[9px] font-black text-navy uppercase">Campanhas</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
