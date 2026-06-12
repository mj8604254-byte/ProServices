import React, { useState } from 'react';
import { ChevronLeft, User, Search, ShoppingBag, Heart, DollarSign } from 'lucide-react';

interface CustomersViewProps {
  orders: any[];
  onBack: () => void;
}

export function CustomersView({ orders, onBack }: CustomersViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Group orders by customer
  const customerMap: { [key: string]: {
    id: string;
    totalSpent: number;
    purchaseCount: number;
    lastPurchaseDate: string;
    ordersList: any[];
  }} = {};

  orders.forEach(order => {
    const cId = order.customer_id || 'demo_customer';
    if (!customerMap[cId]) {
      customerMap[cId] = {
        id: cId,
        totalSpent: 0,
        purchaseCount: 0,
        lastPurchaseDate: order.created_at,
        ordersList: []
      };
    }

    if (order.status === 'completed' || order.status === 'Entregue') {
      customerMap[cId].totalSpent += Number(order.total_price || 0);
    }
    customerMap[cId].purchaseCount += 1;
    customerMap[cId].ordersList.push(order);
    
    // Most recent date
    if (new Date(order.created_at) > new Date(customerMap[cId].lastPurchaseDate)) {
      customerMap[cId].lastPurchaseDate = order.created_at;
    }
  });

  const customers = Object.values(customerMap);

  // Date threshold stats
  const now = new Date();
  const oneDayStart = now.getTime() - 24 * 60 * 60 * 1000;
  const sevenDaysStart = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysStart = now.getTime() - 30 * 24 * 60 * 60 * 1000;

  const countRecentCustomers = (thresholdMs: number) => {
    return customers.filter(c => {
      const firstPurchase = Math.min(...c.ordersList.map(o => new Date(o.created_at).getTime()));
      return firstPurchase >= thresholdMs;
    }).length;
  };

  const newCustomers24h = countRecentCustomers(oneDayStart);
  const newCustomers7d = countRecentCustomers(sevenDaysStart);
  const newCustomers30d = countRecentCustomers(thirtyDaysStart);

  // Filters search
  const filteredCustomers = customers.filter(c => {
    const searchStr = `${c.id} Customer Demo`.toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase());
  });

  // Target Customer for popup/expand details
  const activeCustomer = selectedCustomerId ? customerMap[selectedCustomerId] : null;

  return (
    <div className="space-y-6 pb-12 animate-fade-in" id="customers-view-container">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button 
          id="back-from-customers-btn"
          onClick={onBack} 
          className="p-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 text-navy transition-all cursor-pointer shadow-soft"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <span className="text-[10px] font-black uppercase text-orange tracking-[0.2em]">CRM Loja</span>
          <h2 className="text-2xl font-black text-navy uppercase tracking-tight">Ficheiros de Clientes</h2>
        </div>
      </div>

      {/* Recency Breakdown Metrics Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-soft text-center sm:text-left">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Últimas 24 Horas</p>
          <h4 className="text-xl sm:text-2xl font-black text-navy">+{newCustomers24h}</h4>
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight block mt-1">Primeira compra</span>
        </div>
        <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-soft text-center sm:text-left">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Últimos 7 Dias</p>
          <h4 className="text-xl sm:text-2xl font-black text-navy">+{newCustomers7d}</h4>
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight block mt-1">Novos compradores</span>
        </div>
        <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-soft text-center sm:text-left">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Últimos 30 Dias</p>
          <h4 className="text-xl sm:text-2xl font-black text-navy">+{newCustomers30d}</h4>
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight block mt-1">Adesão registada</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none text-slate-400">
          <Search className="w-5 h-5" />
        </span>
        <input
          id="customers-search-input"
          type="search"
          placeholder="Pesquisar por id de cliente..."
          className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl font-medium focus:ring-4 focus:ring-orange/15 shadow-sm focus:outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Main Customers Shelf */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/65">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identidade do Cliente</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Frequência</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Última Compra</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Gasto (Líquido)</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-bold text-xs">
                    Nenhum cliente cadastrado no histórico.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-100/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-navy/5 text-navy rounded-full flex items-center justify-center font-black">
                          {cust.id.slice(5, 7).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[12px] font-bold text-navy">Cliente Demo ({cust.id.slice(0, 8)})</p>
                          <p className="text-[10px] text-slate-400 font-medium">Conta de Compras Ativa</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[11px] font-black text-navy uppercase block">{cust.purchaseCount} Pedidos</span>
                      <span className="text-[9px] text-slate-400 font-bold block">Frequente</span>
                    </td>
                    <td className="px-6 py-4 text-[10px] text-slate-500 font-semibold">
                      {new Date(cust.lastPurchaseDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-[12px] font-black text-navy">
                      {cust.totalSpent.toLocaleString()} MT
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedCustomerId(cust.id)}
                        className="px-4 py-2 bg-slate-50 hover:bg-orange hover:text-white border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                      >
                        Ver Perfil
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expanded Profile Dialog */}
      {activeCustomer && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm" onClick={() => setSelectedCustomerId(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden z-10 animate-scale-in">
            <div className="bg-navy p-6 text-white text-left relative">
              <span className="text-[10px] font-black uppercase text-orange tracking-widest block mb-1">Familiaridade do Cliente</span>
              <h3 className="text-xl font-black uppercase">Cliente Demo ({activeCustomer.id.slice(0, 10)})</h3>
            </div>

            <div className="p-6 space-y-6 text-left">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block uppercase">Total Investido</span>
                    <span className="text-sm font-black text-navy">{activeCustomer.totalSpent.toLocaleString()} MT</span>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-3">
                  <ShoppingBag className="w-5 h-5 text-orange" />
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block uppercase">Quantidade Pedidos</span>
                    <span className="text-sm font-black text-navy">{activeCustomer.purchaseCount}x compras</span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Últimos Pedidos Efetuados</span>
                <div className="space-y-2 mt-2 max-h-40 overflow-y-auto custom-scrollbar">
                  {activeCustomer.ordersList.map((order, i) => (
                    <div key={i} className="p-3 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-extrabold text-navy text-[11px] block text-left">Pedido #{order.id.slice(0, 8)}</span>
                        <span className="text-[9px] text-slate-400 font-bold">
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-navy text-[11px] block">
                          {Number(order.total_price).toLocaleString()} MT
                        </span>
                        <span className="text-[9px] text-orange font-bold uppercase">{order.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
              <button
                onClick={() => setSelectedCustomerId(null)}
                className="px-6 py-2 bg-navy text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                Retornar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
