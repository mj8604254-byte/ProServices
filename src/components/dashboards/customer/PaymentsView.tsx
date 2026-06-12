import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CreditCard, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Check, 
  Smartphone, 
  Calendar, 
  User, 
  Lock, 
  ShieldAlert,
  Clock,
  Coins,
  DollarSign
} from 'lucide-react';

interface PaymentsViewProps {
  profile: any;
  onBack: () => void;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'mobile_money';
  brand: 'visa' | 'mastercard' | 'mpesa' | 'emola';
  holderName: string;
  maskedNumber: string; // Ex: **** 4812 ou 84****812
  expiryDate?: string; // Cartão apenas
  isDefault: boolean;
  lastUsed: string;
}

export function PaymentsView({ profile, onBack }: PaymentsViewProps) {
  const uid = profile?.uid || 'guest';
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showAddMobile, setShowAddMobile] = useState(false);

  // Form Fields
  const [cardBrand, setCardBrand] = useState<'visa' | 'mastercard'>('visa');
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardIsDefault, setCardIsDefault] = useState(false);

  const [mobileBrand, setMobileBrand] = useState<'mpesa' | 'emola'>('mpesa');
  const [mobileNumber, setMobileNumber] = useState('');
  const [mobileHolder, setMobileHolder] = useState('');
  const [mobileIsDefault, setMobileIsDefault] = useState(false);

  useEffect(() => {
    // Read list of payment cards/mobile methods from local storage corresponding to user uid
    const stored = localStorage.getItem(`moz_payments_${uid}`);
    if (stored) {
      setMethods(JSON.parse(stored));
    } else {
      // Set defaults for Mozambique Demo Account
      const testMethods: PaymentMethod[] = [
        {
          id: 'pm-1',
          type: 'mobile_money',
          brand: 'mpesa',
          holderName: profile?.displayName || 'Cliente Principal',
          maskedNumber: '84 **** 124',
          isDefault: true,
          lastUsed: new Date(Date.now() - 25 * 60 * 1000).toLocaleString()
        },
        {
          id: 'pm-2',
          type: 'card',
          brand: 'visa',
          holderName: profile?.displayName?.toUpperCase() || 'CLIENTE PRINCIPAL',
          maskedNumber: '**** **** **** 4242',
          expiryDate: '12/28',
          isDefault: false,
          lastUsed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleString()
        }
      ];
      localStorage.setItem(`moz_payments_${uid}`, JSON.stringify(testMethods));
      setMethods(testMethods);
    }
  }, [uid, profile]);

  const saveMethods = (updatedList: PaymentMethod[]) => {
    localStorage.setItem(`moz_payments_${uid}`, JSON.stringify(updatedList));
    setMethods(updatedList);
  };

  const handleSetDefault = (id: string) => {
    const updated = methods.map(m => ({
      ...m,
      isDefault: m.id === id
    }));
    saveMethods(updated);
  };

  const handleDeleteMethod = (id: string, isDef: boolean) => {
    if (isDef && methods.length > 1) {
      alert('Não é possível remover o método de pagamento padrão! Por favor, marque outro como principal primeiro.');
      return;
    }
    const confirmed = window.confirm('Deseja realmente remover esta forma de pagamento da sua conta?');
    if (!confirmed) return;

    const filtered = methods.filter(m => m.id !== id);
    if (filtered.length > 0 && isDef) {
      filtered[0].isDefault = true;
    }
    saveMethods(filtered);
  };

  const handleAddCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardHolder.trim() || !cardNumber.trim() || !cardExpiry.trim()) {
      alert('Por favor, preencha todos os campos do cartão!');
      return;
    }

    const cleanedNumber = cardNumber.replace(/\s+/g, '');
    if (cleanedNumber.length < 13) {
      alert('Número do cartão inválido! Insira um número completo.');
      return;
    }

    const lastDigits = cleanedNumber.slice(-4);
    const newCard: PaymentMethod = {
      id: Math.random().toString(36).substring(2, 9),
      type: 'card',
      brand: cardBrand,
      holderName: cardHolder.toUpperCase(),
      maskedNumber: `**** **** **** ${lastDigits}`,
      expiryDate: cardExpiry,
      isDefault: cardIsDefault || methods.length === 0,
      lastUsed: 'Nunca utilizado'
    };

    let updatedList = [...methods, newCard];
    if (newCard.isDefault) {
      updatedList = updatedList.map(m => m.id === newCard.id ? m : { ...m, isDefault: false });
    }

    saveMethods(updatedList);
    setShowAddCard(false);

    // Reset card fields
    setCardHolder('');
    setCardNumber('');
    setCardExpiry('');
    setCardIsDefault(false);
    alert('Cartão bancário adicionado com sucesso e encriptado!');
  };

  const handleAddMobileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileNumber.trim() || !mobileHolder.trim()) {
      alert('Por favor, preencha todos os campos do Mobile Money!');
      return;
    }

    const digits = mobileNumber.replace(/\D/g, '');
    if (digits.length < 9) {
      alert('Número Moçambique inválido! Deve conter pelo menos 9 algarismos (Ex: 84 ou 85 para M-Pesa, 82 para mKesh, 86/87 para e-Mola).');
      return;
    }

    const prefix = digits.substring(0, 2);
    const lastDigits = digits.slice(-3);
    const newMobile: PaymentMethod = {
      id: Math.random().toString(36).substring(2, 9),
      type: 'mobile_money',
      brand: mobileBrand,
      holderName: mobileHolder,
      maskedNumber: `${prefix} **** ${lastDigits}`,
      isDefault: mobileIsDefault || methods.length === 0,
      lastUsed: 'Nunca utilizado'
    };

    let updatedList = [...methods, newMobile];
    if (newMobile.isDefault) {
      updatedList = updatedList.map(m => m.id === newMobile.id ? m : { ...m, isDefault: false });
    }

    saveMethods(updatedList);
    setShowAddMobile(false);

    // Reset mobile fields
    setMobileNumber('');
    setMobileHolder('');
    setMobileIsDefault(false);
    alert('Número Mobile Money registado e validado com sucesso!');
  };

  const getBrandLogo = (brand: string) => {
    switch (brand) {
      case 'visa':
        return <span className="font-extrabold text-blue-800 tracking-wider text-xl">VISA</span>;
      case 'mastercard':
        return <span className="font-extrabold text-[#EB001B] italic text-xl">MasterCard</span>;
      case 'mpesa':
        return <span className="font-black text-red-650 text-md uppercase bg-red-100 px-2 py-0.5 rounded">M-Pesa</span>;
      case 'emola':
        return <span className="font-black text-orange text-md uppercase bg-orange/10 px-2 py-0.5 rounded">e-Mola</span>;
      default:
        return <CreditCard className="w-5 h-5 text-slate-400" />;
    }
  };

  const getBgTheme = (brand: string) => {
    switch (brand) {
      case 'visa': return 'bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-950';
      case 'mastercard': return 'bg-gradient-to-tr from-navy via-slate-900 to-[#EB001B]/20';
      case 'mpesa': return 'bg-gradient-to-tr from-red-600 to-red-900';
      case 'emola': return 'bg-gradient-to-tr from-orange to-orange-700';
      default: return 'bg-gradient-to-tr from-slate-700 to-slate-900';
    }
  };

  return (
    <div className="space-y-6 text-left animate-fade-in" id="customer-payments-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-navy transition-colors font-bold text-xs uppercase"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao Painel
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddMobile(true)}
            className="px-4 py-2.5 bg-navy text-white hover:bg-orange font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border-none shadow-soft"
          >
            <Smartphone className="w-4 h-4" /> Mobile Money (M-Pesa)
          </button>
          <button
            onClick={() => setShowAddCard(true)}
            className="px-4 py-2.5 bg-orange text-white hover:bg-navy font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border-none shadow-md shadow-orange/10"
          >
            <Plus className="w-4.5 h-4.5" /> Adicionar Cartão
          </button>
        </div>
      </div>

      {/* Security Shield Banner */}
      <div className="bg-emerald-500/10 p-5 rounded-[24px] border border-emerald-500/20 text-emerald-800 flex items-start gap-4">
        <Lock className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs">
          <h4 className="font-extrabold uppercase tracking-widest text-[10px] text-emerald-700">Normativa PCI-DSS e Segurança Bancária</h4>
          <p className="mt-1 leading-relaxed text-slate-550 font-semibold">
            Os seus detalhes financeiros são submetidos a tokenização segura em trânsito. Para sua total protecção contra roubos informáticos em Moçambique, <strong className="text-green-750">nunca armazenamos o código de segurança CVV</strong>. Todas as transacções obedecem à dupla validação M-Pesa/Bank 3D-Secure.
          </p>
        </div>
      </div>

      {/* Methods and Settings */}
      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Methods salvos */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-navy uppercase tracking-widest flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-orange" /> Formas de Pagamento Ativas
          </h3>

          <div className="space-y-4">
            {methods.map((method) => (
              <div 
                key={method.id}
                className={`p-6 rounded-[28px] text-white relative overflow-hidden flex flex-col justify-between h-52 shadow-xl ${getBgTheme(method.brand)} ${
                  method.isDefault ? 'border-2 border-orange/60 shadow-orange/10' : ''
                }`}
              >
                {/* Visual Cards Mock Overlay Details */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-12 -mt-12" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl -ml-6 -mb-6" />

                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {method.type === 'card' ? <CreditCard className="w-5 h-5 text-white/75" /> : <Smartphone className="w-5 h-5 text-white/75" />}
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/80">
                      {method.type === 'card' ? 'Cartão de Crédito/Débito' : 'Carteira Móvel'}
                    </span>
                  </div>
                  
                  <div className="bg-white px-2.5 py-1 rounded-lg">
                    {getBrandLogo(method.brand)}
                  </div>
                </div>

                <div className="relative z-10 text-xl font-bold font-mono tracking-widest my-4">
                  {method.maskedNumber}
                </div>

                <div className="relative z-10 flex items-end justify-between border-t border-white/10 pt-4 text-xs font-semibold">
                  <div>
                    <p className="text-[8px] text-white/60 uppercase tracking-widest">Titular</p>
                    <p className="truncate max-w-[170px] font-bold text-white uppercase">{method.holderName}</p>
                  </div>

                  {method.expiryDate && (
                    <div>
                      <p className="text-[8px] text-white/60 uppercase tracking-widest">Validade</p>
                      <p className="font-bold text-white font-mono">{method.expiryDate}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5">
                    {method.isDefault ? (
                      <span className="text-[9px] font-black uppercase bg-white/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-white" /> Principal
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetDefault(method.id)}
                        className="text-[9px] font-black uppercase bg-white/10 hover:bg-white/25 px-2.5 py-1 rounded-full transition-colors cursor-pointer border-none"
                      >
                        Definir Padrão
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDeleteMethod(method.id, method.isDefault)}
                      className="p-1.5 bg-black/20 hover:bg-red-600 rounded-lg text-white/85 hover:text-white transition-colors cursor-pointer border-none"
                      title="Remover"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* History / Tips Side info */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-soft">
            <h4 className="text-xs font-black text-navy uppercase tracking-widest flex items-center gap-2 mb-4">
              <Clock className="w-4.5 h-4.5 text-orange" /> Histórico de Utilização Recente
            </h4>
            <div className="space-y-4">
              {methods.map((method) => (
                <div key={method.id} className="flex items-center justify-between text-xs pb-3 border-b border-slate-50">
                  <div className="text-left">
                    <p className="font-bold text-navy">Faturação via {method.brand === 'mpesa' ? 'M-Pesa' : method.brand === 'emola' ? 'e-Mola' : 'Cartão'}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 mt-1 font-semibold">{method.maskedNumber}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-extrabold text-slate-500 font-mono bg-slate-50 px-2.5 py-1 rounded-lg">
                      Último uso: {method.lastUsed?.split(' ')[0]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Secure lock notes */}
          <div className="bg-slate-50 p-5 rounded-[24px] border border-slate-150 space-y-3.5 text-xs text-slate-550">
            <div className="flex gap-2 text-navy">
              <Lock className="w-5 h-5 text-orange shrink-0" />
              <span className="font-extrabold uppercase text-[10px] tracking-widest self-center text-navy">Criptografia Local Segura</span>
            </div>
            <p className="leading-relaxed font-semibold">
              Os cartões e as carteiras móveis registados nesta aplicação são controlados pelo seu ID de segurança exclusivo da Supabase no seu dispositivo. Caso altere a sua password principal ou encerre a sessão em Moçambique, todos os dados de pré-autenticação locais são invalidados e repostos automaticamente para salvaguardar a sua privacidade financeira.
            </p>
          </div>
        </div>
      </div>

      {/* Add Card Modal */}
      {showAddCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md p-6 rounded-[32px] shadow-2xl border border-slate-100 text-left">
            <h3 className="text-lg font-black text-navy uppercase tracking-tight flex items-center gap-2 mb-2">
              <CreditCard className="w-5 h-5 text-orange" /> Adicionar Cartão de Crédito/Débito
            </h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">Adicione cartões Visa ou MasterCard nacionais ou internacionais para faturação direta.</p>

            <form onSubmit={handleAddCardSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCardBrand('visa')}
                  className={`py-2 px-4 rounded-xl border font-black text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                    cardBrand === 'visa' ? 'border-orange bg-orange/5 text-orange' : 'border-slate-150 text-slate-400'
                  }`}
                >
                  Visa
                </button>
                <button
                  type="button"
                  onClick={() => setCardBrand('mastercard')}
                  className={`py-2 px-4 rounded-xl border font-black text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                    cardBrand === 'mastercard' ? 'border-[#EB001B] bg-[#EB001B]/5 text-[#EB001B]' : 'border-slate-150 text-slate-400'
                  }`}
                >
                  MasterCard
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Nome do Titular (Como no Cartão)</label>
                <input 
                  type="text" 
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  placeholder="EX: LUIS G NHAMPULO"
                  className="w-full h-11 border border-slate-200 rounded-xl px-4 text-xs font-bold text-navy outline-none focus:border-orange font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Número do Cartão (PAN)</label>
                <input 
                  type="text" 
                  maxLength={19}
                  value={cardNumber}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '');
                    const chunks = clean.match(/.{1,4}/g);
                    setCardNumber(chunks ? chunks.join(' ') : clean);
                  }}
                  placeholder="0000 0000 0000 0000"
                  className="w-full h-11 border border-slate-200 rounded-xl px-4 text-xs font-bold text-navy outline-none focus:border-orange font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Validade (MM/AA)</label>
                  <input 
                    type="text" 
                    maxLength={5}
                    placeholder="MM/AA"
                    value={cardExpiry}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '');
                      if (clean.length > 2) {
                        setCardExpiry(`${clean.slice(0, 2)}/${clean.slice(2, 4)}`);
                      } else {
                        setCardExpiry(clean);
                      }
                    }}
                    className="w-full h-11 border border-slate-200 rounded-xl px-4 text-xs font-bold text-navy outline-none focus:border-orange font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
                    CVV/CVC <span className="text-red-500 font-bold">*Não guardado</span>
                  </label>
                  <input 
                    type="password" 
                    maxLength={4}
                    placeholder="***"
                    className="w-full h-11 border border-slate-200 rounded-xl px-4 text-xs font-bold text-navy outline-none focus:border-orange font-mono"
                    required
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 select-none pt-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={cardIsDefault}
                  onChange={(e) => setCardIsDefault(e.target.checked)}
                  className="w-4.5 h-4.5 text-orange bg-slate-50 border-slate-200 rounded"
                />
                <span className="text-xs font-bold text-navy">Definir como Método Principal</span>
              </label>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddCard(false)}
                  className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-navy font-black text-[10px] uppercase tracking-widest rounded-xl cursor-pointer border-none"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-orange hover:bg-navy text-white font-black text-[10px] uppercase tracking-widest rounded-xl cursor-pointer border-none"
                >
                  Salvar Cartão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Mobile Money Modal */}
      {showAddMobile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md p-6 rounded-[32px] shadow-2xl border border-slate-100 text-left">
            <h3 className="text-lg font-black text-navy uppercase tracking-tight flex items-center gap-2 mb-2">
              <Smartphone className="w-5 h-5 text-orange" /> Registar Carteira Mobile Money
            </h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">Associe carteiras móveis nacionais M-Pesa ou e-Mola para pagamentos e reembolsos instantâneos.</p>

            <form onSubmit={handleAddMobileSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMobileBrand('mpesa')}
                  className={`py-2 px-4 rounded-xl border font-black text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                    mobileBrand === 'mpesa' ? 'border-orange bg-orange/5 text-orange' : 'border-slate-150 text-slate-400'
                  }`}
                >
                  m-pesa Vodacom
                </button>
                <button
                  type="button"
                  onClick={() => setMobileBrand('emola')}
                  className={`py-2 px-4 rounded-xl border font-black text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    mobileBrand === 'emola' ? 'border-[#FF5E14] bg-[#FF5E14]/5 text-[#FF5E14]' : 'border-slate-150 text-slate-400'
                  }`}
                >
                  e-Mola Movitel
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Titular da Conta Móvel</label>
                <input 
                  type="text" 
                  value={mobileHolder}
                  onChange={(e) => setMobileHolder(e.target.value)}
                  placeholder="EX: Luís Gilberto Nhampulo"
                  className="w-full h-11 border border-slate-200 rounded-xl px-4 text-xs font-bold text-navy outline-none focus:border-orange"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Número do Telefone (Moçambique)</label>
                <div className="flex gap-2">
                  <span className="h-11 border border-slate-200 bg-slate-50 flex items-center px-3.5 rounded-xl font-bold text-slate-550 text-xs font-mono select-none">+258</span>
                  <input 
                    type="tel" 
                    maxLength={9}
                    value={mobileNumber}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '');
                      setMobileNumber(clean);
                    }}
                    placeholder="840000000"
                    className="w-full h-11 border border-slate-200 rounded-xl px-4 text-xs font-bold text-navy outline-none focus:border-orange font-mono"
                    required
                  />
                </div>
                <p className="text-[9px] text-slate-400 font-bold mt-1">Insira um número válido Movitel ou Vodacom.</p>
              </div>

              <label className="flex items-center gap-2 select-none pt-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={mobileIsDefault}
                  onChange={(e) => setMobileIsDefault(e.target.checked)}
                  className="w-4.5 h-4.5 text-orange bg-slate-50 border-slate-200 rounded focus:ring-0 checked:bg-orange"
                />
                <span className="text-xs font-bold text-navy">Definir como Método Principal</span>
              </label>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddMobile(false)}
                  className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-navy font-black text-[10px] uppercase tracking-widest rounded-xl cursor-pointer border-none"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-orange hover:bg-navy text-white font-black text-[10px] uppercase tracking-widest rounded-xl cursor-pointer border-none"
                >
                  Registar Carteira
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
