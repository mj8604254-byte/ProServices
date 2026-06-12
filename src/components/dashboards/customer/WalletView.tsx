import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  ArrowLeft, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Coins, 
  RotateCcw, 
  Check, 
  RefreshCw,
  Clock,
  ChevronRight,
  TrendingDown,
  Loader2,
  Smartphone
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface WalletViewProps {
  profile: any;
  onBack: () => void;
}

export function WalletView({ profile, onBack }: WalletViewProps) {
  const uid = profile?.uid;
  const [balance, setBalance] = useState({ available: 0, pending: 0 });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Deposit simulation fields
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [depositAmount, setDepositAmount] = useState('500');
  const [depositMoNo, setDepositMoNo] = useState('840000000');
  const [depositProvider, setDepositProvider] = useState<'mpesa' | 'emola'>('mpesa');

  const fetchWalletAndTransactions = async () => {
    if (!uid) return;
    setLoading(true);
    try {
      // 1. Fetch wallet info from wallets table
      const { data: walletData, error: walletErr } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', uid)
        .maybeSingle();

      if (walletErr) {
        console.warn('Could not read user wallet, will create one if needed:', walletErr.message);
      }

      let activeAvailable = 0;
      let activePending = 0;

      if (walletData) {
        // Exists
        activeAvailable = Number(walletData.available_balance || 0);
        activePending = Number(walletData.pending_balance || 0);
        setBalance({
          available: activeAvailable,
          pending: activePending
        });
      } else {
        // Create one for new profile seamlessly to bypass any offline schema limits
        const { data: newWallet, error: insErr } = await supabase
          .from('wallets')
          .insert({
            user_id: uid,
            available_balance: 1500.00, // Initial balance to enjoy purchase simulations!
            pending_balance: 0.00,
            currency: 'MZN'
          })
          .select()
          .single();
        
        if (!insErr && newWallet) {
          activeAvailable = Number(newWallet.available_balance || 1500);
          activePending = Number(newWallet.pending_balance || 0);
          setBalance({ available: activeAvailable, pending: activePending });
        } else {
          // In case insert fails, fall back to safe client state
          setBalance({ available: 1500, pending: 0 });
        }
      }

      // 2. Fetch transaction logs from transactions table
      const { data: txData, error: txErr } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', uid)
        .order('id', { ascending: false }); // Ordered by latest id first

      if (!txErr && txData) {
        setTransactions(txData);
      } else {
        // Setup initial static list if no real tx logs in Supabase
        setTransactions([]);
      }
    } catch (err) {
      console.error('Failed to read wallet/transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletAndTransactions();
  }, [uid]);

  const handleDepositSumulate = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(depositAmount);
    if (!val || val <= 0) {
      alert('Montante inválido!');
      return;
    }

    setSubmitting(true);
    try {
      // Create transactions log row on Supabase
      const net = val;
      const { error: txErr } = await supabase
        .from('transactions')
        .insert({
          user_id: uid,
          amount: val,
          fee: 0,
          net_amount: net,
          type: 'credit',
          status: 'completed',
          description: `Depósito via ${depositProvider.toUpperCase()}: Solicitante +258${depositMoNo}`
        });

      if (txErr) throw txErr;

      // Increment available balance in wallets table
      const updatedAvail = balance.available + val;
      const { error: walletErr } = await supabase
        .from('wallets')
        .update({
          available_balance: updatedAvail,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', uid);

      if (walletErr) throw walletErr;

      alert(`Sucesso! Depósito de ${val.toLocaleString()} MT através de ${depositProvider.toUpperCase()} concluído de forma segura.`);
      setShowAddFunds(false);
      await fetchWalletAndTransactions();
    } catch (err: any) {
      console.error('Error simulating funds:', err);
      // Fallback local update if any connection errors
      const updatedAvail = balance.available + val;
      setBalance({ ...balance, available: updatedAvail });
      setTransactions([
        {
          id: Math.random().toString(),
          amount: val,
          net_amount: val,
          type: 'credit',
          status: 'completed',
          description: `Depósito Offline via ${depositProvider.toUpperCase()}`
        },
        ...transactions
      ]);
      setShowAddFunds(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Safe Refund trigger action
  const handleSimulateRefund = async (amount: number, orderId: string) => {
    const confirmRefund = window.confirm(`Deseja solicitar reembolso instantâneo de ${amount.toLocaleString()} MT relativo ao pedido reembolsável #${orderId.slice(0, 8)}?`);
    if (!confirmRefund) return;

    setLoading(true);
    try {
      // 1. Create debit/credit log row
      await supabase
        .from('transactions')
        .insert({
          user_id: uid,
          amount: amount,
          fee: 0,
          net_amount: amount,
          type: 'credit',
          status: 'completed',
          description: `Estorno de Pedido #${orderId.slice(0, 8).toUpperCase()}`
        });

      // 2. Increment wallet balance
      const updatedAvail = balance.available + amount;
      await supabase
        .from('wallets')
        .update({
          available_balance: updatedAvail
        })
        .eq('user_id', uid);

      alert(`Reembolso de ${amount.toLocaleString()} MT efetuado com sucesso para a sua Carteira Digital.`);
      await fetchWalletAndTransactions();
    } catch (err: any) {
      console.error(err);
      // Offline fallback
      setBalance(prev => ({ ...prev, available: prev.available + amount }));
      setTransactions(prev => [
        {
          id: Math.random().toString(),
          amount,
          type: 'credit',
          status: 'completed',
          description: `Estorno Offline Pedido #${orderId.slice(0, 8)}`
        },
        ...prev
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left animate-fade-in" id="customer-wallet-view">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-navy transition-colors font-bold text-xs uppercase"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao Painel
        </button>
        <button
          onClick={() => fetchWalletAndTransactions()}
          className="p-2 text-slate-400 hover:text-navy rounded-lg transition-colors cursor-pointer border-none bg-none"
          title="Atualizar Saldo"
        >
          <RefreshCw className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Main Balance Panel */}
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Available Balance Card */}
        <section className="bg-navy rounded-[32px] p-6 text-white col-span-2 relative overflow-hidden flex flex-col justify-between h-48">
          <div className="absolute top-0 right-0 w-36 h-36 bg-orange/20 rounded-full blur-2xl -mr-12 -mt-12" />
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-orange" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Carteira Moz ProServices</span>
            </div>
            <span className="text-[10px] font-black text-white/50 tracking-wider">MZN</span>
          </div>

          <div className="relative z-10 my-1">
            <p className="text-[10px] font-black uppercase text-orange tracking-widest">Saldo Disponível</p>
            <h2 className="text-3xl lg:text-4xl font-black mt-1">
              {balance.available.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} <span className="text-orange text-lg">MT</span>
            </h2>
          </div>

          <div className="relative z-10 flex justify-end">
            <button
              onClick={() => setShowAddFunds(true)}
              className="px-5 py-2.5 bg-orange hover:bg-white hover:text-navy text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-1.5 cursor-pointer border-none"
            >
              <Plus className="w-4 h-4" /> Enviar Fundos (M-Pesa)
            </button>
          </div>
        </section>

        {/* Pending Card */}
        <section className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-soft flex flex-col justify-between h-48 text-left">
          <div>
            <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Saldos Retidos / Garantia</h4>
            <p className="text-2xl font-black text-navy mt-1">
              {balance.pending.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} <span className="text-orange text-sm">MT</span>
            </p>
          </div>
          <p className="text-[9px] text-slate-450 leading-relaxed font-semibold">
            Fundos salvaguardados em depósito custodiado durante a adjudicação e conclusão dos serviços profissionais solicitados.
          </p>
        </section>
      </div>

      {/* Transactions list vs Action info */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Transaction History log */}
        <div className="lg:col-span-2 bg-white rounded-[32px] border border-slate-100 shadow-soft overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-black text-navy text-xs uppercase tracking-widest">Histórico de Transações do Consumidor</h3>
            <span className="text-[9px] font-bold text-slate-405 font-mono">Total {transactions.length} movimentos</span>
          </div>

          <div className="divide-y divide-slate-50 overflow-y-auto max-h-[350px]">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-orange animate-spin" />
              </div>
            ) : transactions.length > 0 ? (
              transactions.map((tx) => {
                const isCredit = tx.type === 'credit';
                return (
                  <div key={tx.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/75 transition-colors text-xs text-left">
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isCredit ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                      }`}>
                        {isCredit ? <ArrowDownLeft className="w-4.5 h-4.5" /> : <ArrowUpRight className="w-4.5 h-4.5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-extrabold text-navy truncate leading-snug">{tx.description}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight mt-1">{tx.status === 'completed' ? 'PAGO' : 'PENDENTE'} • ID #{tx.id.toString().slice(0, 8).toUpperCase()}</p>
                      </div>
                    </div>

                    <span className={`font-mono font-black text-sm shrink-0 ${isCredit ? 'text-green-600' : 'text-slate-800'}`}>
                      {isCredit ? '+' : '-'}{Number(tx.amount || tx.net_amount || 0).toLocaleString()} MT
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-20">
                <Coins className="w-10 h-10 text-slate-200 mx-auto animate-bounce mb-3" />
                <h4 className="text-xs font-black text-navy uppercase tracking-tight">Sem movimentos contabilizados</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">Pode carregar o seu saldo usando carteiras M-Pesa de teste para ver o funcionamento do fluxo de compras.</p>
              </div>
            )}
          </div>
        </div>

        {/* Support & Refund simulations sidebar */}
        <div className="space-y-6 text-left">
          <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-soft">
            <h4 className="text-xs font-black text-navy uppercase tracking-widest flex items-center gap-2 mb-3">
              <RotateCcw className="w-4.5 h-4.5 text-orange" /> Devoluções & Reembolsos Rápido
            </h4>
            <p className="text-slate-550 text-xs leading-relaxed mb-4 font-semibold">
              Comprou por engano e deseja testar o estorno da sua carteira de demonstração? Introduza o valor para ser estornado para o seu saldo Moz.
            </p>

            <button
              onClick={() => handleSimulateRefund(1800, 'ord-f8412s')}
              className="w-full h-11 bg-slate-50 hover:bg-red-50 hover:text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest text-navy transition-all border border-slate-150 flex items-center justify-center gap-1.5 cursor-pointer block"
            >
              Simular Reembolso de 1.800 MT
            </button>
          </div>

          <div className="bg-orange/5 p-5 rounded-[24px] border border-orange/15 space-y-3.5 text-xs text-slate-550 font-semibold">
            <div className="flex gap-2">
              <Coins className="w-5 h-5 text-orange shrink-0" />
              <span className="font-extrabold text-navy uppercase text-[10px] tracking-widest self-center">Utilização do Saldo</span>
            </div>
            <p className="leading-relaxed">
              O seu saldo pode ser utilizado como meio principal na compra de artigos no Marketplace nacional e no pagamento de taxas de serviço ao domicílio. Para levantar os seus proveitos de afiliação ou vendas, consulte a respectiva secção Payouts.
            </p>
          </div>
        </div>
      </div>

      {/* Add Funds Modal */}
      {showAddFunds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-sm p-6 rounded-[32px] shadow-2xl border border-slate-100 text-left">
            <h3 className="text-lg font-black text-navy uppercase tracking-tight flex items-center gap-2 mb-2">
              <Smartphone className="w-5 h-5 text-orange" /> Enviar Fundos via Mobile Money
            </h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">Deposite fundos instantâneos na sua carteira digital Moz ProServices utilizando o sandbox simulador de M-Pesa ou e-Mola.</p>

            <form onSubmit={handleDepositSumulate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDepositProvider('mpesa')}
                  className={`py-2 px-4 rounded-xl border font-black text-xs transition-colors cursor-pointer ${
                    depositProvider === 'mpesa' ? 'border-orange bg-orange/5 text-orange' : 'border-slate-150 text-slate-400'
                  }`}
                >
                  m-pesa Vodacom
                </button>
                <button
                  type="button"
                  onClick={() => setDepositProvider('emola')}
                  className={`py-2 px-4 rounded-xl border font-black text-xs transition-colors cursor-pointer ${
                    depositProvider === 'emola' ? 'border-orange bg-orange/5 text-orange' : 'border-slate-150 text-slate-400'
                  }`}
                >
                  e-Mola Movitel
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Montante do Depósito (MT)</label>
                <input 
                  type="number" 
                  min="50" 
                  max="50000"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full h-11 border border-slate-200 rounded-xl px-4 text-xs font-bold text-navy outline-none focus:border-orange font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Número de Telefone M-Pesa / e-Mola</label>
                <div className="flex gap-2">
                  <span className="h-11 border border-slate-200 bg-slate-50 flex items-center px-3.5 rounded-xl font-bold text-slate-500 text-xs font-mono select-none">+258</span>
                  <input 
                    type="tel" 
                    maxLength={9}
                    value={depositMoNo}
                    onChange={(e) => setDepositMoNo(e.target.value.replace(/\D/g, ''))}
                    placeholder="840000000"
                    className="w-full h-11 border border-slate-200 rounded-xl px-4 text-xs font-bold text-navy outline-none focus:border-orange font-mono"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddFunds(false)}
                  className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-navy font-black text-[10px] uppercase tracking-widest rounded-xl cursor-pointer border-none"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-orange hover:bg-navy text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer border-none shadow-md"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-white" /> : 'Confirmar Envio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
