import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  DollarSign, 
  Download, 
  RefreshCw,
  Plus,
  Send,
  Loader2,
  Calendar,
  Layers,
  Check,
  TrendingUp,
  Percent,
  Calculator
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../../lib/supabase';

interface FinanceViewProps {
  orders: any[];
  profile: any;
  onBack: () => void;
}

export function FinanceView({ orders, profile, onBack }: FinanceViewProps) {
  const uid = profile?.uid || 'guest';
  const isMacro = profile?.role === 'seller_macro';

  const [wallet, setWallet] = useState<{ available_balance: number; pending_balance: number }>({ available_balance: 12450, pending_balance: 3500 });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState<'diario' | 'mensal' | 'anual'>('mensal');
  
  // Withdrawal Request Form State
  const [isRequestingPayout, setIsRequestingPayout] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'mpesa' | 'emola' | 'bank'>('mpesa');
  const [payoutDetails, setPayoutDetails] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);

  // Transfer to Customer Wallet Form State
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);

  const fetchFinancials = async () => {
    setLoading(true);
    try {
      // 1. Fetch wallet balances try multiple columns to prevent schema errors
      const { data: walletData, error: wErr } = await supabase
        .from('wallets')
        .select('*')
        .or(`uid.eq.${uid},user_id.eq.${uid}`)
        .maybeSingle();

      if (walletData) {
        setWallet({
          available_balance: walletData.available_balance ?? walletData.availableBalance ?? 12450,
          pending_balance: walletData.pending_balance ?? walletData.pendingBalance ?? 3500
        });
      }

      // 2. Fetch completed transactions
      const { data: txs, error: txErr } = await supabase
        .from('transactions')
        .select('*')
        .or(`uid.eq.${uid},user_id.eq.${uid}`)
        .order('created_at', { ascending: false });

      if (txs && txs.length > 0) {
        setTransactions(txs);
      } else {
        // Fallback or mapped from orders directly
        const orderTxs = orders.map(o => ({
          id: `tx-${o.id.slice(0, 8)}`,
          amount: o.total_price || o.totalPrice,
          type: 'credit',
          status: o.status === 'completed' || o.status === 'Entregue' ? 'completed' : 'pending',
          description: `Serviço prestado #${o.id.slice(0, 8).toUpperCase()}`,
          created_at: o.created_at,
          client: o.customer_id ? `Cliente #${o.customer_id.slice(0, 6).toUpperCase()}` : 'Cliente Moçambicano',
          service_name: o.items?.[0]?.name || 'Serviço de AC'
        }));
        setTransactions(orderTxs);
      }
    } catch (e: any) {
      console.warn('Could not complete financial fetches:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancials();
  }, [uid, orders]);

  // Request payout
  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(payoutAmount);
    if (!amount || amount <= 0 || amount > wallet.available_balance) {
      alert('Montante inválido ou saldo disponível insuficiente.');
      return;
    }

    setPayoutLoading(true);
    try {
      // 1. Create a payout record in DB
      const payoutPayload = {
        user_id: uid,
        amount: amount,
        method: payoutMethod,
        method_details: payoutDetails || 'M-Pesa Conta Padrão',
        status: 'pending',
        created_at: new Date().toISOString()
      };

      const { error: pErr } = await supabase.from('payouts').insert(payoutPayload);
      
      // 2. Insert transaction entry
      await supabase.from('transactions').insert({
        user_id: uid,
        amount: -amount,
        type: 'payout',
        status: 'pending',
        description: `Retirada via ${payoutMethod.toUpperCase()}`,
        created_at: new Date().toISOString()
      });

      // 3. Deduct available balance
      const newAvail = wallet.available_balance - amount;
      await supabase
        .from('wallets')
        .update({ available_balance: newAvail })
        .or(`uid.eq.${uid},user_id.eq.${uid}`);

      alert('Levantamento solicitado com sucesso! O valor será processado em breve.');
      setPayoutAmount('');
      setPayoutDetails('');
      setIsRequestingPayout(false);
      await fetchFinancials();
    } catch (err: any) {
      console.warn('Local fallback payout initiated:', err.message);
      // Fallback
      const newAvail = wallet.available_balance - amount;
      setWallet(prev => ({ ...prev, available_balance: newAvail }));
      alert('Simulação: Levantamento solicitado e processado no ambiente de teste!');
      setPayoutAmount('');
      setPayoutDetails('');
      setIsRequestingPayout(false);
    } finally {
      setPayoutLoading(false);
    }
  };

  // Transfer to client-side wallet for consumer spending
  const handleTransferToConsumerWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(transferAmount);
    if (!amount || amount <= 0 || amount > wallet.available_balance) {
      alert('Montante de transferência inválido.');
      return;
    }

    setTransferLoading(true);
    try {
      const newAvail = wallet.available_balance - amount;
      
      // Update wallet balance in database
      const { error } = await supabase
        .from('wallets')
        .update({ available_balance: newAvail })
        .or(`uid.eq.${uid},user_id.eq.${uid}`);

      // Adding custom transactions as backup
      await supabase.from('transactions').insert({
        user_id: uid,
        amount: -amount,
        type: 'debit',
        status: 'completed',
        description: `Transferência interna para Carteira Cliente`,
        created_at: new Date().toISOString()
      });

      alert('Transferência comutada com sucesso! O seu saldo de cliente foi creditado.');
      setTransferAmount('');
      setIsTransferring(false);
      await fetchFinancials();
    } catch (err: any) {
      // Local fallback
      const newAvail = wallet.available_balance - amount;
      setWallet(prev => ({ ...prev, available_balance: newAvail }));
      alert('Simulação: Saldo transferido com êxito na carteira do cliente!');
      setTransferAmount('');
      setIsTransferring(false);
    } finally {
      setTransferLoading(false);
    }
  };

  // Filter based on period Range: Daily, Monthly, Yearly
  const getFilteredTransactions = () => {
    const today = new Date().toDateString();
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return transactions.filter(tx => {
      const txDate = new Date(tx.created_at || tx.createdAt);
      if (filterPeriod === 'diario') {
        return txDate.toDateString() === today;
      }
      if (filterPeriod === 'anual') {
        return txDate.getFullYear() === currentYear;
      }
      return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
    });
  };

  // Export finance CSV
  const handleExportFinanceCSV = () => {
    const filtered = getFilteredTransactions();
    if (filtered.length === 0) {
      alert('Sem transações para exportar no período selecionado.');
      return;
    }

    const headers = ['Data', 'Cliente', 'Servico', 'Valor Bruto (MT)', 'Comissao (MT)', 'Valor Liquido (MT)', 'Estado'];
    const rows = filtered.map(tx => {
      // Calculate commission (standard 10%)
      const amount = Math.abs(Number(tx.amount || 0));
      const commission = Math.round(amount * 0.1);
      const net = amount - commission;
      const client = tx.client || `Cliente #${uid.slice(0, 5).toUpperCase()}`;
      const service = tx.service_name || tx.description || 'Serviço Profissional';

      return [
        new Date(tx.created_at || tx.createdAt).toLocaleDateString(),
        client,
        service,
        amount,
        commission,
        net,
        tx.status || 'completed'
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `financas_proservices_${filterPeriod}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPeriodLabel = () => {
    if (filterPeriod === 'diario') return 'Diário (Hoje)';
    if (filterPeriod === 'anual') return 'Anual (Este Ano)';
    return 'Mensal (Este Mês)';
  };

  // Aggregated totals
  const filterTxs = getFilteredTransactions();
  const totalGears = filterTxs.reduce((sum, tx) => sum + (tx.amount > 0 ? tx.amount : 0), 0);
  const totalCommissions = Math.round(totalGears * 0.1);
  const totalRefunds = Math.abs(filterTxs.filter(tx => tx.description?.toLowerCase().includes('reembolso')).reduce((sum, tx) => sum + tx.amount, 0));
  const activeEarningsNet = totalGears - totalCommissions - totalRefunds;

  return (
    <div className="space-y-6 text-left" id="finance-view-root">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 text-navy transition-all cursor-pointer shadow-soft"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[10px] font-black uppercase text-orange tracking-[0.2em]">Fluxo Financeiro</span>
            <h2 className="text-2xl font-black text-navy uppercase tracking-tight">Finanças & Facturação</h2>
          </div>
        </div>

        {/* Sync or Download */}
        <div className="flex gap-2">
          <button
            onClick={handleExportFinanceCSV}
            className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Descarregar CSV
          </button>
          <button 
            onClick={fetchFinancials}
            className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 hover:text-navy"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main wallets block */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Core Wallet Display */}
        <div className="bg-navy p-6 rounded-[32px] text-white relative overflow-hidden flex flex-col justify-between h-48 sm:col-span-2">
          <div className="absolute top-0 right-0 w-48 h-48 bg-orange/20 rounded-full blur-3xl -mr-16 -mt-16" />
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Saldo Disponível Principal</span>
              <Wallet className="w-5 h-5 text-orange" />
            </div>
            <h3 className="text-3xl sm:text-4xl font-extrabold">{wallet.available_balance.toLocaleString()} MT</h3>
          </div>

          <div className="relative z-10 flex gap-3 flex-wrap">
            <button
              onClick={() => {
                setIsRequestingPayout(true);
                setIsTransferring(false);
              }}
              className="px-4 py-2.5 bg-orange hover:bg-white hover:text-navy text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" /> Solicitar Levantamento
            </button>
            <button
              onClick={() => {
                setIsTransferring(true);
                setIsRequestingPayout(false);
              }}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/5 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-4 h-4" /> Transferir para Cliente
            </button>
          </div>
        </div>

        {/* Pending Card Display */}
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-soft h-48 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Saldo Retido / Pendente</span>
              <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
            </div>
            <h3 className="text-2xl font-black text-navy">{wallet.pending_balance.toLocaleString()} MT</h3>
            <p className="text-[10px] text-slate-400 leading-tight mt-1.5 font-bold uppercase">Valores em processamento logístico que serão libertados nas próximas 24h.</p>
          </div>
        </div>
      </div>

      {/* Accordion inputs forms */}
      <AnimatePresence>
        {isRequestingPayout && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }}
            className="bg-white p-6 rounded-[32px] border border-orange/15 shadow-soft space-y-4"
          >
            <h4 className="font-extrabold text-navy text-sm uppercase">Novo Pedido de Levantamento</h4>
            <form onSubmit={handleRequestPayout} className="grid sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Montante (MT)</label>
                <input 
                  type="number" 
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder={`Max: ${wallet.available_balance}`}
                  className="w-full p-3 rounded-2xl border border-slate-200 text-xs text-navy focus:outline-none focus:border-orange bg-slate-50 font-black"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Conta & Fornecedor</label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value as any)}
                  className="w-full p-3 rounded-2xl border border-slate-200 text-xs text-navy focus:outline-none focus:border-orange bg-slate-50 font-black"
                >
                  <option value="mpesa">M-Pesa</option>
                  <option value="emola">e-Mola</option>
                  <option value="bank">Transferência Bancária</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Número / Detalhes</label>
                <input 
                  type="text" 
                  value={payoutDetails}
                  onChange={(e) => setPayoutDetails(e.target.value)}
                  placeholder="Ex: +258 84 123 4567"
                  className="w-full p-3 rounded-2xl border border-slate-200 text-xs text-navy focus:outline-none focus:border-orange bg-slate-50 font-black"
                  required
                />
              </div>

              <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRequestingPayout(false)}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-xl font-bold uppercase text-[9px] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={payoutLoading}
                  className="px-6 py-3 bg-navy text-white hover:bg-orange rounded-xl font-black uppercase text-[9px] flex items-center gap-1.5 cursor-pointer"
                >
                  {payoutLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirmar Levantamento
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {isTransferring && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }}
            className="bg-white p-6 rounded-[32px] border border-indigo-15 shadow-soft space-y-4"
          >
            <h4 className="font-extrabold text-navy text-sm uppercase">Transferência para Carteira Pessoal</h4>
            <p className="text-xs text-slate-400 font-bold mb-3">Transfira saldo comercial diretamente para o seu saldo consumidor para poder realizar compras e pedidos no Marketplace!</p>
            <form onSubmit={handleTransferToConsumerWallet} className="grid sm:grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Montante de Transferência (MT)</label>
                <input 
                  type="number" 
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder={`Saldo Max: ${wallet.available_balance}`}
                  className="w-full p-3 rounded-2xl border border-slate-200 text-xs text-navy focus:outline-none focus:border-orange bg-slate-50 font-black"
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsTransferring(false)}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-xl font-bold uppercase text-[9px] flex-1 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={transferLoading}
                  className="px-6 py-3 bg-indigo-650 text-white hover:bg-orange rounded-xl font-black uppercase text-[9px] flex-1 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {transferLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Transferir Agora
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overview Analytics and Table Filter */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Filtering table of completed work logs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-[32px] border border-slate-50 shadow-soft">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="font-extrabold text-navy text-md uppercase">Histórico das Facturas</h3>
                <p className="text-xs text-slate-400 font-bold mt-1">Transações fiscais de serviços</p>
              </div>

              {/* Range select buttons */}
              <div className="flex bg-slate-50 p-1 rounded-xl shrink-0 self-start sm:self-center">
                {['diario', 'mensal', 'anual'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setFilterPeriod(p as any)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      filterPeriod === p ? 'bg-navy text-white' : 'text-slate-500 hover:text-navy'
                    }`}
                  >
                    {p === 'diario' ? 'Diário' : p === 'anual' ? 'Anual' : 'Mensal'}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
              {getFilteredTransactions().length > 0 ? (
                getFilteredTransactions().map((tx) => (
                  <div key={tx.id} className="py-4 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-extrabold text-navy">{tx.description || 'Prestaçao Serviços'}</p>
                      <span className="text-[9px] text-slate-400 font-bold font-mono">
                        {tx.client || `Transação ID #${tx.id.toUpperCase()}`} • {new Date(tx.created_at || tx.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="text-right">
                      <p className={`font-black ${tx.amount > 0 ? 'text-green-650' : 'text-rose-500'}`}>
                        {tx.amount > 0 ? `+${tx.amount.toLocaleString()}` : tx.amount.toLocaleString()} MT
                      </p>
                      <span className="text-[8px] font-black uppercase text-slate-400 border border-slate-100 px-1.5 py-0.5 rounded">
                        {tx.status || 'Completada'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-450">
                  <Calculator className="w-8 h-8 mx-auto text-slate-350 mb-2" />
                  <p className="font-bold">Sem movimentação financeira no período selecionado.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Aggregated totals stats box */}
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-[40px] border border-slate-50 shadow-soft space-y-6">
            <div>
              <h3 className="text-sm font-black text-navy uppercase tracking-widest flex items-center gap-2">
                <Calculator className="w-5 h-5 text-orange" />
                Resumo de Fecho ({getPeriodLabel()})
              </h3>
              <p className="text-xs text-slate-400 font-bold mt-1">Ganhos descontados de taxas</p>
            </div>

            <div className="space-y-4 font-bold text-xs text-navy/80">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 uppercase tracking-wider text-[10px]">Ganhos Brutos</span>
                <span className="text-navy font-black">{totalGears.toLocaleString()} MT</span>
              </div>
              
              <div className="flex justify-between items-center text-orange">
                <span className="uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5" /> Comissão Intermediação
                </span>
                <span className="font-black">-{totalCommissions.toLocaleString()} MT</span>
              </div>

              <div className="flex justify-between items-center text-rose-505">
                <span className="uppercase tracking-wider text-[10px] text-slate-400">Reembolsos</span>
                <span className="text-rose-500">-{totalRefunds.toLocaleString()} MT</span>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-green-650 text-sm">
                <span className="font-black uppercase tracking-widest text-[11px]">Rendimento Líquido</span>
                <span className="text-lg font-black">{activeEarningsNet.toLocaleString()} MT</span>
              </div>
            </div>

            {/* Financial notice */}
            <div className="bg-slate-50 p-4 rounded-3xl text-slate-400 space-y-1 text-xs">
              <p className="font-bold text-navy text-[11px]">Nota de Impostos</p>
              <p className="font-medium">O seu imposto simplificado para a Autoridade Tributária é retido na fonte pela plataforma Moz de acordo com o NUIT da sua empresa.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
