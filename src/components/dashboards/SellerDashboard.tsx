import React from 'react';
import { 
  TrendingUp, 
  Package, 
  ShoppingBag, 
  Users, 
  DollarSign, 
  ChevronRight, 
  MoreHorizontal,
  Plus,
  ArrowUpRight,
  Truck,
  Settings,
  PieChart
} from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export function SellerDashboard({ profile }: { profile: any }) {
  const navigate = useNavigate();
  
  const stats = [
    { label: 'Vendas Totais', value: '45.890 MT', change: '+12.5%', icon: DollarSign, color: 'text-green-500' },
    { label: 'Pedidos Pendentes', value: '08', change: '-2', icon: ShoppingBag, color: 'text-orange' },
    { label: 'Stock Baixo', value: '03', change: 'Crítico', icon: Package, color: 'text-red-500' },
    { label: 'Novos Clientes', value: '14', change: '+5', icon: Users, color: 'text-blue-500' },
  ];

  const recentOrders = [
    { id: '#6021', customer: 'João Paulo', date: 'Há 5 min', status: 'pendente', total: '2.500 MT' },
    { id: '#6019', customer: 'Maria Silva', date: 'Há 20 min', status: 'preparando', total: '850 MT' },
    { id: '#6018', customer: 'Alice Mundlovo', date: 'Há 45 min', status: 'enviado', total: '12.300 MT' },
  ];

  const products = [
    { name: 'Samsung Galaxy A54', stock: 12, price: '18.500 MT', status: 'Em Stock' },
    { name: 'iPhone 13 Pro', stock: 2, price: '65.000 MT', status: 'Stock Baixo' },
    { name: 'Xiaomi Redmi Note 12', stock: 45, price: '12.000 MT', status: 'Em Stock' },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-navy uppercase tracking-tight">Painel de Controlo</h2>
          <p className="text-slate-400 text-sm font-medium">Gestão da Loja: <span className="text-orange">{profile?.businessName || 'Minha Loja'}</span></p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/products/add')}
            className="flex-1 md:flex-none px-6 py-3 bg-orange text-white rounded-2xl font-black uppercase tracking-widest hover:bg-orange/90 transition-all shadow-lg shadow-orange/20 flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Novo Produto
          </button>
          <button className="flex-1 md:flex-none px-6 py-3 bg-navy text-white rounded-2xl font-black uppercase tracking-widest hover:bg-navy/90 transition-all flex items-center justify-center gap-2">
            <PieChart className="w-5 h-5" />
            Relatórios
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white p-5 rounded-[28px] shadow-soft border border-slate-100 group hover:border-orange transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center ${stat.color} group-hover:bg-orange/10 transition-colors`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                {stat.change}
              </span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-xl font-black text-navy">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Orders Table */}
        <section className="bg-white rounded-[32px] shadow-soft border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-black text-navy uppercase tracking-widest flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-orange" />
              Pedidos Recentes
            </h3>
            <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-orange transition-colors">Gerir Todos</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors cursor-pointer group">
                    <td className="px-6 py-4 text-[11px] font-bold text-navy">{order.id}</td>
                    <td className="px-6 py-4">
                      <p className="text-[11px] font-bold text-navy leading-none">{order.customer}</p>
                      <p className="text-[9px] text-slate-400 font-medium italic mt-1">{order.date}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full ${
                        order.status === 'pendente' ? 'bg-orange/10 text-orange' :
                        order.status === 'preparando' ? 'bg-blue-100 text-blue-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[11px] font-black text-navy">{order.total}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-slate-300 hover:text-orange transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Product Stock */}
        <section className="bg-white rounded-[32px] shadow-soft border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-black text-navy uppercase tracking-widest flex items-center gap-2">
              <Package className="w-4 h-4 text-orange" />
              Estado do Stock
            </h3>
            <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-orange transition-colors">Inventário</button>
          </div>
          <div className="p-2">
            {products.map((product) => (
              <div key={product.name} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors group">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-orange/10 group-hover:text-orange transition-colors">
                  <Package className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[12px] font-bold text-navy truncate">{product.name}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] font-black text-orange uppercase tracking-tight">{product.price}</span>
                    <span className="w-1 h-1 bg-slate-200 rounded-full" />
                    <span className="text-[10px] font-bold text-slate-400">{product.stock} unidades</span>
                  </div>
                </div>
                <span className={`text-[9px] font-black uppercase tracking-widest ${product.status === 'Stock Baixo' ? 'text-red-500' : 'text-green-500'}`}>
                  {product.status}
                </span>
              </div>
            ))}
          </div>
          <div className="p-4 bg-slate-50 mt-auto">
            <button className="w-full py-3 bg-navy text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-navy/90 transition-all flex items-center justify-center gap-2">
              Gestão de Inventário
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </div>

      {/* Grid of Other Modules */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { label: 'Finanças', icon: DollarSign, color: 'bg-green-500' },
          { label: 'Logística', icon: Truck, color: 'bg-amber-500' },
          { label: 'Marketing', icon: TrendingUp, color: 'bg-purple-500' },
          { label: 'Equipa', icon: Users, color: 'bg-blue-500' },
          { label: 'Estatísticas', icon: PieChart, color: 'bg-indigo-500' },
          { label: 'Configuração', icon: Settings, color: 'bg-slate-700' },
        ].map((item) => (
          <button key={item.label} className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-soft flex flex-col items-center gap-3 hover:border-orange hover:-translate-y-1 transition-all group text-center">
            <div className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
              <item.icon className="w-5 h-5" />
            </div>
            <span className="font-black text-navy text-[9px] uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
