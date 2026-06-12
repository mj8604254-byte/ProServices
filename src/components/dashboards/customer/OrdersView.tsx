import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  ArrowLeft, 
  Search, 
  Filter, 
  Clock, 
  Check, 
  Star, 
  MessageSquare, 
  RotateCcw, 
  Printer, 
  HelpCircle,
  Calendar,
  X,
  Package,
  Wrench,
  ChevronRight,
  ExternalLink,
  Plus,
  Loader2
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { ReviewModal } from '../../ReviewModal';

interface OrdersViewProps {
  profile: any;
  orders: any[];
  reviewedOrderIds: Set<string>;
  onBack: () => void;
  onRefresh: () => void;
}

export function OrdersView({ profile, orders, reviewedOrderIds: initialReviewedIds, onBack, onRefresh }: OrdersViewProps) {
  const uid = profile?.uid || 'guest';
  const [reviewedOrderIds, setReviewedOrderIds] = useState<Set<string>>(initialReviewedIds);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [showReviewModal, setShowReviewModal] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed' | 'cancelled' | 'reviews'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | '30days' | '6months' | 'year'>('all');

  // Customer reviews list
  const [myReviews, setMyReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    // Refresh reviews initially
    fetchMyReviews();
  }, [uid]);

  const fetchMyReviews = async () => {
    if (!uid) return;
    setReviewsLoading(true);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('customer_id', uid)
        .order('id', { ascending: false });

      if (!error && data) {
        setMyReviews(data);
        const reviewedSet = new Set<string>(data.map(r => r.order_id));
        setReviewedOrderIds(reviewedSet);
      }
    } catch (err) {
      console.error('Error fetching consumer reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  // Export receipt invoice simulating the generation
  const handleExportReceipt = (order: any) => {
    const formattedId = order.id.slice(0, 8).toUpperCase();
    const headers = `====================================================
               COMPROVATIVO DE ENCOMENDA
               Moz ProServices Moçambique
====================================================\n`;
    const details = `Código Pedido: #${formattedId}
Data: ${new Date(order.created_at || order.createdAt).toLocaleString('pt-MZ')}
Cliente: ${profile?.displayName}
Método de Entrega: ${order.type === 'service' ? 'Serviço ao Domicílio' : 'Entregue por Moz Logística'}
Morada: ${order.delivery_address}

----------------------------------------------------
DESCRIÇÃO DOS ITENS ADQUIRIDOS:
`;
    const itemsList = order.items.map((item: any, i: number) => {
      return `${i + 1}. ${item.name} - Qtd: ${item.quantity} - Preço: ${Number(item.price).toLocaleString()} MT`;
    }).join('\n');

    const footer = `\n----------------------------------------------------
VALOR TOTAL PAGO: ${Number(order.total_price || order.totalPrice).toLocaleString()} MT
IVA Incluído (16%)
Estado da Transação: CONCLUÍDA / AUTORIZADA
Moeda: Metical de Moçambique (MZN)

Assegurado por Seguradora Moz S.A.
Código Autenticação: SECURE-TX-${Math.random().toString(36).substring(2, 10).toUpperCase()}
====================================================`;

    const fullBlob = new Blob([headers + details + itemsList + footer], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(fullBlob);
    link.download = `Recibo_Encomenda_${formattedId}.txt`;
    link.click();
    alert(`Comprovativo exportado com sucesso! Iniciámos o descarregamento do recibo: Recibo_Encomenda_${formattedId}.txt`);
  };

  // Repeat previous order simulation
  const handleRepeatOrder = async (order: any) => {
    const confirmRepeat = window.confirm('Deseja repetir esta mesma compra e gerar uma nova encomenda idêntica?');
    if (!confirmRepeat) return;

    try {
      const orderPayload = {
        customer_id: uid,
        items: order.items,
        total_price: order.total_price || order.totalPrice,
        status: 'pending', // Starts as pending tracking!
        type: order.type || 'product',
        seller_id: order.seller_id,
        delivery_address: order.delivery_address,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('orders').insert(orderPayload);
      if (error) throw error;

      alert('Nova encomenda gerada com sucesso! Estará ativa para acompanhamento na página principal.');
      onRefresh();
      onBack();
    } catch (err: any) {
      console.error(err);
      alert('Erro ao repetir pedido: ' + err.message);
    }
  };

  const getOrderStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
      case 'Entregue':
        return 'bg-green-100 text-green-700 font-black';
      case 'pending':
        return 'bg-orange/10 text-orange font-black';
      case 'cancelled':
        return 'bg-red-50 text-red-650 font-bold';
      default:
        return 'bg-blue-100 text-blue-600 font-bold';
    }
  };

  const translateStatus = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluída';
      case 'pending': return 'Pendente';
      case 'accepted': return 'Aceite';
      case 'picked_up': return 'Recolhida';
      case 'delivering': return 'Em Caminho';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  // Standard calculations for stats
  const countAll = orders.length;
  const countPending = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled' && o.status !== 'Entregue').length;
  const countCompleted = orders.filter(o => o.status === 'completed' || o.status === 'Entregue').length;
  const countCancelled = orders.filter(o => o.status === 'cancelled').length;

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    // 1. Tab match
    if (activeTab === 'pending') {
      const isPend = order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'Entregue';
      if (!isPend) return false;
    } else if (activeTab === 'completed') {
      const isComp = order.status === 'completed' || order.status === 'Entregue';
      if (!isComp) return false;
    } else if (activeTab === 'cancelled') {
      if (order.status !== 'cancelled') return false;
    }

    // 2. Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = order.items?.some((item: any) => item.name?.toLowerCase().includes(q));
      const matchId = order.id?.toLowerCase().includes(q);
      const matchAddr = order.delivery_address?.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchAddr) return false;
    }

    // 3. Date filter match
    if (dateFilter !== 'all') {
      const date = new Date(order.created_at || order.createdAt);
      const diffMs = Date.now() - date.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (dateFilter === '30days' && diffDays > 30) return false;
      if (dateFilter === '6months' && diffDays > 180) return false;
      if (dateFilter === 'year' && diffDays > 365) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 text-left animate-fade-in" id="customer-orders-view">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-navy transition-colors font-bold text-xs uppercase"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao Painel
        </button>
        <div className="text-[10px] font-black uppercase text-orange bg-orange/10 px-3 py-1.5 rounded-full">
          Geral do Consumidor • {orders.length} Encomendas
        </div>
      </div>

      {/* Overview stats grids */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Todos Pedidos', value: countAll, bg: 'bg-white', text: 'text-navy border border-slate-100', tab: 'all' },
          { label: 'Pendentes/Ativos', value: countPending, bg: 'bg-orange/5 border border-orange/10', text: 'text-orange', tab: 'pending' },
          { label: 'Concluídos', value: countCompleted, bg: 'bg-green-50/50 border border-green-100', text: 'text-green-700', tab: 'completed' },
          { label: 'Cancelados', value: countCancelled, bg: 'bg-red-50/50 border border-red-100', text: 'text-red-500', tab: 'cancelled' },
        ].map((item) => (
          <div 
            key={item.label}
            onClick={() => setActiveTab(item.tab as any)}
            className={`p-4 rounded-[20px] cursor-pointer hover:scale-[1.01] transition-all text-left shadow-soft ${item.bg}`}
          >
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
            <h3 className={`text-2xl font-black mt-1 ${item.text}`}>{String(item.value).padStart(2, '0')}</h3>
          </div>
        ))}
      </div>

      {/* Filter and search bars */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search input */}
        <div className="flex-1 bg-white h-11 border border-slate-200 rounded-xl px-4 flex items-center gap-2 shadow-soft">
          <Search className="w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Pesquisar por ID, produto, morada..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs font-bold text-navy outline-none w-full"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-navy p-0.5">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
            <Filter className="w-4 h-4 text-slate-450" /> Filtrar por:
          </span>
          <select 
            value={dateFilter}
            onChange={(e: any) => setDateFilter(e.target.value)}
            className="h-11 border border-slate-250 bg-white rounded-xl text-xs font-bold px-3 text-navy outline-none focus:border-orange"
          >
            <option value="all">Todas as Datas</option>
            <option value="30days">Últimos 30 Dias</option>
            <option value="6months">Últimos 6 Meses</option>
            <option value="year">Último Ano</option>
          </select>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`h-11 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'reviews' ? 'bg-orange text-white' : 'bg-white text-slate-500 border border-slate-150 h-11'
            }`}
          >
            <Star className="w-4.5 h-4.5 fill-current" /> Minhas Avaliações
          </button>
        </div>
      </div>

      {/* Tab Selection line indicator */}
      <div className="flex gap-4 border-b border-slate-50">
        {[
          { id: 'all', label: 'Todos' },
          { id: 'pending', label: 'Pendentes de Entrega' },
          { id: 'completed', label: 'Concluídos com Sucesso' },
          { id: 'cancelled', label: 'Artigos Cancelados' }
        ].map((tab) => {
          if (activeTab === 'reviews') return null;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-2.5 font-bold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                activeTab === tab.id ? 'border-orange text-navy font-black' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Render Lists Container block */}
      <AnimatePresence mode="wait">
        {activeTab === 'reviews' ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4 text-left"
          >
            {reviewsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-orange animate-spin" />
              </div>
            ) : myReviews.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {myReviews.map((rev) => (
                  <div key={rev.id} className="bg-white p-5 rounded-[24px] border border-slate-105 shadow-soft">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 font-mono">PEDIDO ORD-#{rev.order_id?.slice(0, 8).toUpperCase()}</p>
                        <span className="text-[9px] text-slate-400 font-semibold">{new Date(rev.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'text-orange fill-orange' : 'text-slate-205'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-navy text-xs mt-3.5 leading-relaxed font-medium italic">"{rev.comment || 'Sem observações adicionais.'}"</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-[32px]">
                <Star className="w-10 h-10 text-slate-200 mx-auto animate-pulse mb-2" />
                <h4 className="text-xs font-black text-navy uppercase tracking-tight">Ainda não fez avaliações</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">Avalie compras e serviços para acumular Pontos Moz na sua conta de fidelização!</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3.5"
          >
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => {
                const isReviewed = reviewedOrderIds.has(order.id);
                return (
                  <div 
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="bg-white p-5 rounded-[24px] border border-slate-100 hover:border-orange/20 hover:shadow-lg transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group cursor-pointer"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-11 h-11 bg-slate-50 text-navy group-hover:bg-orange/10 group-hover:text-orange rounded-xl flex items-center justify-center shrink-0 transition-colors">
                        {order.type === 'service' ? <Wrench className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                      </div>

                      <div className="text-left min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-0.5">
                          <span className="text-[10px] font-black text-slate-450 font-mono">PEDIDO #{order.id.slice(0, 8).toUpperCase()}</span>
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(order.created_at || order.createdAt).toLocaleDateString('pt-MZ')}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-navy text-sm leading-tight truncate">
                          {order.items?.[0]?.name || 'Itens'} {order.items?.length > 1 && `+ ${order.items.length - 1} item(s)`}
                        </h4>
                        <p className="text-xs font-bold text-orange mt-0.5">{Number(order.total_price || order.totalPrice).toLocaleString()} MT</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 border-slate-50 pt-3.5 md:pt-0">
                      <span className={`text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-tight ${getOrderStatusBadgeClass(order.status)}`}>
                        {translateStatus(order.status)}
                      </span>

                      <div className="flex gap-2">
                        {order.status === 'completed' && (
                          isReviewed ? (
                            <span className="text-[9px] font-black bg-green-50 text-green-700 px-2.5 py-1 rounded-lg">Avaliado</span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowReviewModal(order);
                              }}
                              className="px-3 py-1.5 bg-orange text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1"
                            >
                              Avaliar <Star className="w-3 h-3 fill-current" />
                            </button>
                          )
                        )}
                        <button className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-400 group-hover:text-orange transition-colors">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-[32px]">
                <ShoppingBag className="w-10 h-10 text-slate-200 mx-auto animate-bounce mb-3" />
                <h4 className="text-xs font-black text-navy uppercase tracking-tight">Sem encomendas encontradas</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">Não localizámos encomendas que correspondam aos filtros seleccionados.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Details Modal Overlay */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-md overflow-y-auto">
          <div className="bg-white w-full max-w-lg p-6 rounded-[32px] shadow-2xl border border-slate-150 text-left my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-black text-navy uppercase tracking-tight">Fatura Detalhada do Pedido</h3>
              <button onClick={() => setSelectedOrder(null)} className="p-1 text-slate-400 hover:text-navy rounded-lg cursor-pointer border-none bg-transparent">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center mb-6 text-xs text-navy font-black">
              <div>
                <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Código Identificador</p>
                <p className="font-mono mt-0.5 leading-none text-navy">#ORD-{selectedOrder.id}</p>
              </div>
              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${getOrderStatusBadgeClass(selectedOrder.status)}`}>
                {translateStatus(selectedOrder.status)}
              </span>
            </div>

            {/* List of checkout items */}
            <div className="space-y-3.5 mb-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">Artigos Requisitados</h4>
              {selectedOrder.items?.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <div className="text-left">
                    <p className="font-extrabold text-navy">{item.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">Quantidade: {item.quantity} unidades</p>
                  </div>
                  <span className="font-mono font-black text-slate-800">{Number(item.price * item.quantity).toLocaleString()} MT</span>
                </div>
              ))}
              <div className="border-t border-slate-100 pt-3 flex justify-between items-center font-black text-md text-navy">
                <span>VALOR TOTAL PAGO</span>
                <span className="text-orange">{Number(selectedOrder.total_price || selectedOrder.totalPrice).toLocaleString()} MT</span>
              </div>
            </div>

            {/* Delivery address details */}
            <div className="mb-6 space-y-1">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">Coordenadas de Envio</h4>
              <p className="text-xs font-bold text-navy pt-1">{selectedOrder.delivery_address}</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Status Operação: {selectedOrder.type === 'service' ? 'Parceiro Técnico credenciado' : 'Envio via Logística Standard'}</p>
            </div>

            {/* Operations buttons */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => handleExportReceipt(selectedOrder)}
                className="py-3 bg-navy hover:bg-orange text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer border-none"
              >
                <Printer className="w-4 h-4" /> Recibo PDF / TXT
              </button>
              <button
                onClick={() => handleRepeatOrder(selectedOrder)}
                className="py-3 bg-orange hover:bg-navy text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer border-none"
              >
                <Plus className="w-4 h-4" /> Repetir Pedido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Star Reviews submodal portal */}
      {showReviewModal && (
        <ReviewModal 
          order={showReviewModal}
          customerId={uid}
          onClose={() => setShowReviewModal(null)}
          onReviewSubmitted={() => {
            setShowReviewModal(null);
            fetchMyReviews();
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
