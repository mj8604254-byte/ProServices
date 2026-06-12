import React, { useState } from 'react';
import { ChevronLeft, DollarSign, Calendar, TrendingUp, ArrowUpRight, Award } from 'lucide-react';

interface SalesAnalyticsViewProps {
  orders: any[];
  onBack: () => void;
}

export function SalesAnalyticsView({ orders, onBack }: SalesAnalyticsViewProps) {
  const [timeframe, setTimeframe] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Calculates financial stats from real orders
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekStart = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const monthStart = now.getTime() - 30 * 24 * 60 * 60 * 1000;

  const getFilteredOrders = () => {
    return orders.filter(order => {
      const orderTime = new Date(order.created_at).getTime();
      if (timeframe === 'today') return orderTime >= todayStart;
      if (timeframe === 'week') return orderTime >= weekStart;
      if (timeframe === 'month') return orderTime >= monthStart;
      return true;
    });
  };

  const filteredOrders = getFilteredOrders();
  const completedOrders = filteredOrders.filter(o => o.status === 'completed' || o.status === 'Entregue');

  // Calculations
  const totalSalesCount = completedOrders.length;
  const totalRevenue = completedOrders.reduce((sum, o) => sum + Number(o.total_price || 0), 0);
  const pendingRevenue = filteredOrders.filter(o => o.status === 'pending' || o.status === 'pending_payment').reduce((sum, o) => sum + Number(o.total_price || 0), 0);
  const averageTicket = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;

  // Hourly or Daily breakdown for simple premium looking SVG chart
  // Group by day of week
  const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const dailyData = [0, 0, 0, 0, 0, 0, 0];
  
  completedOrders.forEach(o => {
    const d = new Date(o.created_at);
    dailyData[d.getDay()] += Number(o.total_price || 0);
  });

  const maxVal = Math.max(...dailyData, 1000);
  const chartHeight = 160;
  const points = dailyData.map((val, idx) => {
    const x = idx * 80 + 40;
    const y = chartHeight - (val / maxVal) * (chartHeight - 40) - 20;
    return `${x},${y}`;
  }).join(' ');

  // Category sales breakdown
  const categorySales: { [key: string]: number } = {};
  completedOrders.forEach(o => {
    const items = o.items || [];
    items.forEach((item: any) => {
      const cat = item.category || 'Outros';
      categorySales[cat] = (categorySales[cat] || 0) + (Number(item.price || 0) * Number(item.quantity || 1));
    });
  });

  return (
    <div className="space-y-8 pb-12 animate-fade-in" id="sales-analytics-container">
      {/* Back & Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            id="back-to-dashboard-btn"
            onClick={onBack} 
            className="p-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 text-navy transition-all cursor-pointer shadow-soft"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[10px] font-black uppercase text-orange tracking-[0.2em]">Painel do Vendedor</span>
            <h2 className="text-2xl font-black text-navy uppercase tracking-tight">Análise Geral de Vendas</h2>
          </div>
        </div>

        {/* Time Filter Buttons */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/50 self-start sm:self-auto">
          {(['all', 'today', 'week', 'month'] as const).map((t) => (
            <button
              id={`timeframe-btn-${t}`}
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                timeframe === t 
                  ? 'bg-white text-navy shadow-sm' 
                  : 'text-slate-400 hover:text-navy'
              }`}
            >
              {t === 'all' ? 'Tudo' : t === 'today' ? 'Hoje' : t === 'week' ? 'Este Sáb' : 'Este Mês'}
            </button>
          ))}
        </div>
      </div>

      {/* Analytical Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-soft">
          <div className="w-12 h-12 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center mb-4">
            <DollarSign className="w-6 h-6" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Faturado Real (MT)</p>
          <h3 className="text-xl sm:text-2xl font-black text-navy">{totalRevenue.toLocaleString()} MT</h3>
          <p className="text-[9px] text-green-500 font-bold mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> De pedidos entregues
          </p>
        </div>

        <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-soft">
          <div className="w-12 h-12 bg-orange/5 text-orange rounded-2xl flex items-center justify-center mb-4">
            <Calendar className="w-6 h-6" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pedidos Faturados</p>
          <h3 className="text-xl sm:text-2xl font-black text-navy">{totalSalesCount}</h3>
          <p className="text-[9px] text-slate-400 font-bold mt-2">
            Taxa de conversão saudável
          </p>
        </div>

        <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-soft">
          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-4">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ticket Médio</p>
          <h3 className="text-xl sm:text-2xl font-black text-navy">{Math.round(averageTicket).toLocaleString()} MT</h3>
          <p className="text-[9px] text-blue-500 font-bold mt-2">
            Por venda convertida
          </p>
        </div>

        <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-soft">
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-4">
            <Award className="w-6 h-6" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Faturação Pendente</p>
          <h3 className="text-xl sm:text-2xl font-black text-navy">{pendingRevenue.toLocaleString()} MT</h3>
          <p className="text-[9px] text-amber-600 font-bold mt-2">
            Pedidos aguardando envio/pago
          </p>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Trend chart */}
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-soft lg:col-span-2">
          <h3 className="text-xs font-black text-navy uppercase tracking-widest mb-6">Faturação Diária da Semana</h3>
          <div className="relative">
            <svg viewBox={`0 0 540 ${chartHeight}`} className="w-full h-40 overflow-visible text-orange">
              {/* Grids */}
              <line x1="0" y1="20" x2="540" y2="20" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="70" x2="540" y2="70" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="120" x2="540" y2="120" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="140" x2="540" y2="140" stroke="#f1f5f9" strokeWidth="1.5" />

              {/* Trend Polyline */}
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
                className="drop-shadow-md"
              />

              {/* Points circles */}
              {dailyData.map((val, idx) => {
                const x = idx * 80 + 40;
                const y = chartHeight - (val / maxVal) * (chartHeight - 40) - 20;
                return (
                  <g key={idx} className="group/dot cursor-pointer">
                    <circle cx={x} cy={y} r="6" fill="#F25C05" className="transition-all hover:r-8" />
                    <circle cx={x} cy={y} r="12" fill="#F25C05" opacity="0.1" className="lg:group-hover/dot:scale-150 transition-all" />
                  </g>
                );
              })}
            </svg>
            <div className="flex justify-between px-4 mt-3">
              {weekdays.map((day, idx) => (
                <div key={idx} className="text-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase block">{day}</span>
                  <span className="text-[9px] font-black text-navy block mt-0.5">{Math.round(dailyData[idx]).toLocaleString()} MT</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Categories Sales Breakdown chart */}
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-soft">
          <h3 className="text-xs font-black text-navy uppercase tracking-widest mb-6">Vendas por Categoria</h3>
          {Object.keys(categorySales).length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-slate-350">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Sem Vendas no Período</span>
            </div>
          ) : (
            <div className="space-y-4 max-h-40 overflow-y-auto pr-1">
              {Object.entries(categorySales).map(([category, value]) => {
                const percent = totalRevenue > 0 ? (value / totalRevenue) * 100 : 0;
                return (
                  <div key={category} className="space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-extrabold text-navy uppercase tracking-tight">{category}</span>
                      <span className="font-black text-slate-550">{percent.toFixed(0)}% ({value.toLocaleString()} MT)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-orange h-full rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Audit Log / List of Sales Orders */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-soft overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h3 className="text-xs font-black text-navy uppercase tracking-widest">Listagem Geral de Receitas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/60">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pedido ID</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data / Hora</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Itens Adquiridos</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor Líquido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-bold text-xs">
                    Nenhum pedido encontrado no período filtrado.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-[11px] font-bold text-navy truncate max-w-[120px]">#{o.id.slice(0, 8)}...</td>
                    <td className="px-6 py-4 text-[10px] text-slate-500 font-medium">
                      {new Date(o.created_at).toLocaleString('pt-MZ')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        {o.items?.map((item: any, i: number) => (
                          <p key={i} className="text-[11px] font-bold text-navy">
                            {item.quantity}x {item.name}
                          </p>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                        o.status === 'completed' || o.status === 'Entregue' ? 'bg-green-150 text-green-700' :
                        o.status === 'cancelled' ? 'bg-red-50 text-red-600' : 'bg-orange/10 text-orange'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[11px] font-black text-navy text-right">
                      {Number(o.total_price || 0).toLocaleString()} MT
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
