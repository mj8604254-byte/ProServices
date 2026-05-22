import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Filter, 
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  Smartphone,
  X,
  Info
} from 'lucide-react';
import { supabase, handleSupabaseError } from '../../lib/supabase';
import { Transaction, PayoutRequest } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

export function FinanceDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      const { data: payoutData, error: payoutError } = await supabase
        .from('payouts')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (txError) throw txError;
      if (payoutError) throw payoutError;
      
      const mappedTransactions = txData.map(tx => ({
        ...tx,
        userId: tx.user_id,
        netAmount: tx.net_amount,
        relatedOrderId: tx.related_order_id,
        createdAt: tx.created_at
      })) as Transaction[];

      const mappedPayouts = payoutData.map(p => ({
        ...p,
        userId: p.user_id,
        methodDetails: p.method_details,
        createdAt: p.created_at,
        processedAt: p.processed_at
      })) as PayoutRequest[];
      
      setTransactions(mappedTransactions);
      setPayouts(mappedPayouts);
    } catch (err) {
      console.error('Error fetching finance data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-navy uppercase tracking-tight">Sistema Financeiro Externo</h1>
          <p className="text-slate-500 font-medium">Controlo de carteiras, comissões e levantamentos.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-white text-navy rounded-2xl font-black text-xs uppercase tracking-widest shadow-soft hover:bg-slate-50 transition-all">
            <Download className="w-4 h-4" />
            Exportar Relatório
          </button>
        </div>
      </header>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-navy text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange/20 rounded-full blur-3xl -mr-16 -mt-16" />
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
              <Wallet className="w-6 h-6 text-orange" />
            </div>
            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Volume Retido (Escrow)</p>
            <h3 className="text-3xl font-black tracking-tight mb-2">1,245,600 MT</h3>
            <div className="flex items-center gap-2 text-green-400 text-xs font-bold">
              <TrendingUp className="w-4 h-4" />
              <span>+15% este mês</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] shadow-soft border border-slate-100 flex flex-col justify-between">
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Comissões Acumuladas</p>
            <h3 className="text-3xl font-black text-navy tracking-tight">184,200 MT</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Produtos (10%)</p>
              <p className="font-black text-navy text-sm">92,100 MT</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Serviços (15%)</p>
              <p className="font-black text-navy text-sm">64,500 MT</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] shadow-soft border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Métodos de Pagamento</p>
            <Filter className="w-4 h-4 text-slate-300" />
          </div>
          <div className="space-y-4">
            <PaymentMethodRow method="M-Pesa" value="65%" count={450} color="bg-red-500" />
            <PaymentMethodRow method="e-Mola" value="25%" count={180} color="bg-orange" />
            <PaymentMethodRow method="Banco" value="10%" count={75} color="bg-blue-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Payouts */}
        <div className="bg-white p-8 rounded-[40px] shadow-soft border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-black text-navy uppercase tracking-tight">Pedidos de Levantamento</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Aguardando aprovação administrativa</p>
            </div>
            <span className="px-4 py-2 bg-orange/10 text-orange rounded-xl text-[10px] font-black uppercase tracking-widest">
              {payouts.length} Pendentes
            </span>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="py-12 text-center text-slate-400">Carregando...</div>
            ) : payouts.length === 0 ? (
              <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
                <CheckCircle2 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="font-black uppercase tracking-widest text-[10px]">Tudo em dia!</p>
              </div>
            ) : (
              payouts.map(payout => (
                <div key={payout.id} className="p-5 bg-slate-50 rounded-[32px] border border-slate-100 flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                      {payout.method === 'mpesa' ? <Smartphone className="w-5 h-5 text-red-500" /> : <Building2 className="w-5 h-5 text-blue-600" />}
                    </div>
                    <div>
                      <p className="font-black text-navy uppercase text-sm tracking-tight">{payout.amount.toLocaleString()} MT</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">User ID: {payout.userId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="px-4 py-2 bg-white text-navy border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition-colors">Rejeitar</button>
                    <button className="px-4 py-2 bg-orange text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-orange/90 transition-all shadow-lg shadow-orange/20">Aprovar</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white p-8 rounded-[40px] shadow-soft border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-navy uppercase tracking-tight">Transações Recentes</h2>
            <button className="text-xs font-black text-orange uppercase tracking-widest hover:underline">Ver Histórico</button>
          </div>

          <div className="space-y-4">
            {transactions.map(tx => (
              <div 
                key={tx.id} 
                onClick={() => setSelectedTx(tx)}
                className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tx.type === 'payout' ? 'bg-navy text-white' : 'bg-green-50 text-green-600'}`}>
                    {tx.type === 'payout' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-xs font-black text-navy uppercase tracking-tight leading-none mb-1">{tx.description}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{tx.type} • {new Date(tx.createdAt).toLocaleTimeString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-black text-sm ${tx.type === 'payout' ? 'text-navy' : 'text-green-600'}`}>
                    {tx.type === 'payout' ? '-' : '+'}{tx.amount.toLocaleString()} MT
                  </p>
                  <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Sucesso</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      <AnimatePresence>
        {selectedTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTx(null)}
              className="absolute inset-0 bg-navy/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange/10 rounded-2xl flex items-center justify-center">
                      <Info className="w-6 h-6 text-orange" />
                    </div>
                    <h3 className="text-xl font-black text-navy uppercase tracking-tight">Detalhes da Transação</h3>
                  </div>
                  <button 
                    onClick={() => setSelectedTx(null)}
                    className="p-2 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    <X className="w-6 h-6 text-slate-400" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID da Transação</span>
                      <span className="text-xs font-mono text-navy font-bold">{selectedTx.id}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</span>
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                        selectedTx.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-orange/10 text-orange'
                      }`}>
                        {selectedTx.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <DetailRow label="Descrição" value={selectedTx.description} />
                    <DetailRow label="Utilizador (UID)" value={selectedTx.userId} isMono />
                    <DetailRow label="Tipo" value={selectedTx.type.toUpperCase()} />
                    <DetailRow label="Data" value={new Date(selectedTx.createdAt).toLocaleDateString('pt-PT')} />
                    <DetailRow label="Hora" value={new Date(selectedTx.createdAt).toLocaleTimeString('pt-PT')} />
                    <DetailRow label="Pedido Relacionado" value={selectedTx.relatedOrderId || 'N/A'} isMono />
                  </div>

                  <div className="pt-6 border-t border-slate-100">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-bold text-slate-400 uppercase tracking-tight">Valor Bruto</span>
                        <span className="font-black text-navy">{selectedTx.amount.toLocaleString()} MT</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="font-bold text-slate-400 uppercase tracking-tight">Taxa de Plataforma</span>
                        <span className="font-black text-red-500">
                          {selectedTx.fee ? `-${selectedTx.fee.toLocaleString()} MT` : '0 MT'}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg pt-2">
                        <span className="font-black text-navy uppercase tracking-tight">Valor Líquido</span>
                        <span className="font-black text-green-600">
                          {selectedTx.netAmount 
                            ? `${selectedTx.netAmount.toLocaleString()} MT` 
                            : `${selectedTx.amount.toLocaleString()} MT`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-10">
                  <button 
                    onClick={() => setSelectedTx(null)}
                    className="w-full py-4 bg-navy text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-orange transition-all shadow-lg"
                  >
                    Fechar Detalhes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailRow({ label, value, isMono }: { label: string; value: string; isMono?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</span>
      <span className={`text-sm font-bold text-navy ${isMono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

function PaymentMethodRow({ method, value, count, color }: any) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-black text-navy uppercase tracking-widest">{method}</span>
        <span className="text-[9px] font-bold text-slate-400">{count} transações</span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: value }} />
      </div>
    </div>
  );
}
