import React, { useState } from 'react';
import { ChevronLeft, Search, Check, X, ShieldAlert, Download, RefreshCw, Eye } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface OrdersManagerViewProps {
  orders: any[];
  onBack: () => void;
  onRefresh: () => Promise<void>;
}

export function OrdersManagerView({ orders, onBack, onRefresh }: OrdersManagerViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'pending_payment' | 'preparing' | 'shipped' | 'completed' | 'cancelled'>('all');
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setLoadingOrderId(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      
      await onRefresh();
      
      // Update selected order modal if open
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev: any) => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err: any) {
      console.error('Failed to update order status:', err.message);
      alert('Erro ao atualizar o estado do pedido: ' + err.message);
    } finally {
      setLoadingOrderId(null);
    }
  };

  // CSV export logic
  const handleExportCSV = () => {
    if (orders.length === 0) return;
    
    const headers = ['Pedido ID', 'Cliente', 'Data', 'Itens', 'Total (MT)', 'Estado', 'Método Pagamento', 'Morada'];
    const rows = orders.map(o => [
      o.id,
      o.customer_id, // Could map to client name when rendering
      new Date(o.created_at).toLocaleDateString(),
      o.items?.map((i: any) => `${i.quantity}x ${i.name}`).join('; ') || '',
      o.total_price,
      o.status,
      o.payment_method || 'M-Pesa',
      o.delivery_address || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pedidos_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter orders
  const filteredOrders = orders.filter(o => {
    // Search
    const searchString = `${o.id} ${o.delivery_address || ''} ${o.items?.map((it: any) => it.name).join(' ') || ''}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    
    // Status
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'pending') return matchesSearch && o.status === 'pending';
    if (statusFilter === 'pending_payment') return matchesSearch && (o.status === 'pending_payment' || o.status === 'awaiting_payment');
    if (statusFilter === 'preparing') return matchesSearch && (o.status === 'preparing' || o.status === 'accepted');
    if (statusFilter === 'shipped') return matchesSearch && (o.status === 'shipped' || o.status === 'delivering' || o.status === 'picked_up');
    if (statusFilter === 'completed') return matchesSearch && (o.status === 'completed' || o.status === 'Entregue');
    if (statusFilter === 'cancelled') return matchesSearch && (o.status === 'cancelled' || o.status === 'rejected');
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12 animate-fade-in" id="orders-manager-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            id="back-from-orders-btn"
            onClick={onBack} 
            className="p-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 text-navy transition-all cursor-pointer shadow-soft"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[10px] font-black uppercase text-orange tracking-[0.2em]">Área Comercial</span>
            <h2 className="text-2xl font-black text-navy uppercase tracking-tight">Gestor de Pedidos</h2>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            id="export-csv-btn"
            onClick={handleExportCSV}
            className="px-5 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
          <button
            id="refresh-orders-btn"
            onClick={onRefresh}
            className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 hover:text-navy transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar">
        {[
          { id: 'all', label: 'Todos' },
          { id: 'pending', label: 'Espec. Aprovação' },
          { id: 'pending_payment', label: 'Espec. Pagamento' },
          { id: 'preparing', label: 'Em Processamento' },
          { id: 'shipped', label: 'Enviados' },
          { id: 'completed', label: 'Concluídos' },
          { id: 'cancelled', label: 'Cancelados' },
        ].map((tab) => (
          <button
            id={`orders-tab-${tab.id}`}
            key={tab.id}
            onClick={() => setStatusFilter(tab.id as any)}
            className={`px-5 py-2.5 rounded-2xl text-[10px] font-extrabold uppercase tracking-wider whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
              statusFilter === tab.id
                ? 'bg-navy border-navy text-white shadow-md'
                : 'bg-white border-slate-100 text-slate-400 hover:text-navy hover:border-slate-350'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none text-slate-400">
          <Search className="w-5 h-5" />
        </span>
        <input
          id="orders-search-input"
          type="search"
          placeholder="Pesquisar por Pedido ID, morada de entrega ou produtos..."
          className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl font-medium focus:ring-4 focus:ring-orange/15 shadow-sm focus:outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Orders Table & Cards */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/60">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nº Pedido</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Itens / Artigos</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor total</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-bold text-xs">
                    Nenhum pedido recebido com estes filtros.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-[11px] font-black text-navy uppercase block">#{order.id.slice(0, 8)}</span>
                      <span className="text-[9px] text-slate-400 font-bold block mt-1">
                        {new Date(order.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center font-black text-xs text-slate-500">
                          {String(order.customer_id || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-navy">Cliente Demo</p>
                          <p className="text-[9px] text-slate-400 font-medium truncate max-w-[140px]" title={order.delivery_address}>
                            {order.delivery_address || 'Sem morada estipulada'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        {order.items?.map((item: any, idx: number) => (
                          <span key={idx} className="block text-[11px] font-bold text-slate-600 truncate max-w-[200px]">
                            {item.quantity}x {item.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                        order.status === 'completed' || order.status === 'Entregue' ? 'bg-green-150 text-green-700' :
                        order.status === 'pending' ? 'bg-orange/10 text-orange' :
                        order.status === 'pending_payment' || order.status === 'awaiting_payment' ? 'bg-yellow-50 text-yellow-600 border border-yellow-200/50' :
                        order.status === 'preparing' || order.status === 'accepted' ? 'bg-blue-100 text-blue-600' :
                        order.status === 'shipped' || order.status === 'delivering' ? 'bg-indigo-50 text-indigo-600' :
                        'bg-red-50 text-red-650'
                      }`}>
                        {order.status === 'pending' ? 'Pendente' :
                         order.status === 'pending_payment' || order.status === 'awaiting_payment' ? 'Esp. Pagamento' :
                         order.status === 'preparing' || order.status === 'accepted' ? 'Aprovado / Preparar' :
                         order.status === 'shipped' || order.status === 'delivering' ? 'Em Transporte' :
                         order.status === 'completed' || order.status === 'Entregue' ? 'Concluído' : 'Cancelado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[11px] font-black text-navy">
                      {Number(order.total_price || 0).toLocaleString()} MT
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-navy rounded-lg transition-colors cursor-pointer"
                          title="Detalhar Pedido"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {order.status === 'pending' && (
                          <>
                            <button
                              disabled={loadingOrderId === order.id}
                              onClick={() => handleUpdateStatus(order.id, 'preparing')}
                              className="p-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors cursor-pointer"
                              title="Aprovar Pedido"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              disabled={loadingOrderId === order.id}
                              onClick={() => handleUpdateStatus(order.id, 'rejected')}
                              className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors cursor-pointer"
                              title="Rejeitar Pedido"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {order.status === 'preparing' && (
                          <button
                            disabled={loadingOrderId === order.id}
                            onClick={() => handleUpdateStatus(order.id, 'shipped')}
                            className="px-2 py-1 bg-amber-150 hover:bg-amber-200 text-amber-700 text-[10px] font-black uppercase rounded-lg transition-colors cursor-pointer"
                          >
                            Concluir Envio
                          </button>
                        )}

                        {order.status === 'shipped' && (
                          <button
                            disabled={loadingOrderId === order.id}
                            onClick={() => handleUpdateStatus(order.id, 'completed')}
                            className="px-2 py-1 bg-green-100 hover:bg-green-250 text-green-750 text-[10px] font-black uppercase rounded-lg transition-colors cursor-pointer"
                          >
                            Dar como Entregue
                          </button>
                        )}
                        
                        {order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'rejected' && (
                          <button
                            disabled={loadingOrderId === order.id}
                            onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                            className="p-1.5 bg-slate-50 hover:bg-slate-200/60 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                            title="Cancelar Pedido"
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expanded Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden z-10 animate-scale-in">
            <div className="bg-navy p-6 text-white text-left">
              <span className="text-[10px] font-black uppercase text-orange tracking-widest">Detalhes do Pedido</span>
              <h3 className="text-xl font-black uppercase">Pedido #{selectedOrder.id.slice(0, 12)}...</h3>
            </div>
            
            <div className="p-6 space-y-5 text-left">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Items</span>
                <div className="space-y-2 bg-slate-50 p-4 rounded-2xl">
                  {selectedOrder.items?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-xs font-bold text-navy">{item.quantity}x {item.name}</span>
                      <span className="text-xs font-black text-navy">{Number(item.price * item.quantity).toLocaleString()} MT</span>
                    </div>
                  ))}
                  <div className="border-t border-slate-200 mt-2 pt-2 flex justify-between items-center font-black">
                    <span className="text-xs uppercase text-slate-400">Total Faturado</span>
                    <span className="text-sm text-orange">{Number(selectedOrder.total_price).toLocaleString()} MT</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-bold">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Método de Envio</span>
                  <p className="text-navy">Standard Moz ProServices</p>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Método de Pagamento</span>
                  <p className="text-navy">{selectedOrder.payment_method || 'M-Pesa / Mobile Wallet'}</p>
                </div>
              </div>

              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Destino de Entrega</span>
                <p className="text-xs text-navy font-bold leading-relaxed">{selectedOrder.delivery_address || 'Por especificar'}</p>
              </div>

              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Histórico de Estados</span>
                <div className="flex items-center gap-2 mt-2">
                  <select
                    className="flex-1 bg-slate-50 border border-slate-250 py-3 px-4 rounded-xl font-bold text-xs focus:ring-2 focus:ring-orange/20 focus:outline-none"
                    value={selectedOrder.status}
                    onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value)}
                  >
                    <option value="pending">Pendente</option>
                    <option value="pending_payment">Aguardando Pagamento</option>
                    <option value="preparing">Dada Aprovação / Preparação no Ponto</option>
                    <option value="shipped">Posto em Distribuição</option>
                    <option value="completed">Concluída / Entregue</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-6 py-2 bg-navy text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
