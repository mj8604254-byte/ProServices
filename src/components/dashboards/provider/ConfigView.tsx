import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Settings, 
  Shield, 
  Bell, 
  CreditCard, 
  Check, 
  Building,
  Mail,
  Smartphone,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';

interface ConfigViewProps {
  profile: any;
  onBack: () => void;
}

export function ConfigView({ profile, onBack }: ConfigViewProps) {
  const uid = profile?.uid || 'guest';

  // Config parameters state
  const [businessName, setBusinessName] = useState(profile?.businessName || profile?.displayName || 'ProServices Lda');
  const [nuit, setNuit] = useState('102456789'); // Moz NUIT
  const [notifyEmail, setNotifyEmail] = useState(profile?.email || 'geral@proservices.co.mz');
  const [notifySms, setNotifySms] = useState(true);
  const [autoAccept, setAutoAccept] = useState(false);
  const [defaultPayoutMethod, setDefaultPayoutMethod] = useState('mpesa');

  useEffect(() => {
    const stored = localStorage.getItem(`moz_config_${uid}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.businessName) setBusinessName(parsed.businessName);
        if (parsed.nuit) setNuit(parsed.nuit);
        if (parsed.notifyEmail) setNotifyEmail(parsed.notifyEmail);
        if (parsed.notifySms !== undefined) setNotifySms(parsed.notifySms);
        if (parsed.autoAccept !== undefined) setAutoAccept(parsed.autoAccept);
        if (parsed.defaultPayoutMethod) setDefaultPayoutMethod(parsed.defaultPayoutMethod);
      } catch (e) {}
    }
  }, [uid]);

  const saveConfig = () => {
    const payload = { businessName, nuit, notifyEmail, notifySms, autoAccept, defaultPayoutMethod };
    localStorage.setItem(`moz_config_${uid}`, JSON.stringify(payload));
    alert('As configurações da sua empresa foram salvas com sucesso!');
  };

  return (
    <div className="space-y-6 text-left" id="config-view-root">
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
            <span className="text-[10px] font-black uppercase text-orange tracking-[0.2em]">Painel de Controlo</span>
            <h2 className="text-2xl font-black text-navy uppercase tracking-tight">Configurações Gerais</h2>
          </div>
        </div>

        {/* Action save */}
        <button 
          onClick={saveConfig}
          className="px-6 py-3 bg-navy hover:bg-orange text-white rounded-xl font-black text-[10px] uppercase tracking-widest self-start sm:self-center cursor-pointer shadow"
        >
          Guardar Dados
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left config blocks */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Fiscal profile details */}
          <div className="bg-white p-6 sm:p-8 rounded-[40px] border border-slate-100 shadow-soft space-y-6">
            <h3 className="text-md font-black text-navy uppercase tracking-widest flex items-center gap-2">
              <Building className="w-5 h-5 text-orange" />
              Empresa & Registro Comercial
            </h3>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Nome Comercial do Negócio</label>
                <input 
                  type="text" 
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full p-3 bg-slate-50 rounded-2xl border border-slate-205 text-xs text-navy focus:outline-none focus:border-orange font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">NUIT Fiscal Moz (9 dígitos)</label>
                <input 
                  type="text" 
                  maxLength={9}
                  value={nuit}
                  onChange={(e) => setNuit(e.target.value.replace(/\D/g, ''))}
                  className="w-full p-3 bg-slate-50 rounded-2xl border border-slate-205 text-xs text-navy focus:outline-none focus:border-orange font-bold font-mono"
                />
              </div>
            </div>
          </div>

          {/* Preferences and automatic parameters */}
          <div className="bg-white p-6 sm:p-8 rounded-[40px] border border-slate-100 shadow-soft space-y-6">
            <h3 className="text-md font-black text-navy uppercase tracking-widest flex items-center gap-2">
              <Bell className="w-5 h-5 text-orange" />
              Notificações e Automatizações
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">E-mail para Receber Facturas & Alertas</label>
                <input 
                  type="email" 
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                  className="w-full p-3 bg-slate-50 rounded-2xl border border-slate-205 text-xs text-navy focus:outline-none focus:border-orange font-bold"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div>
                  <p className="text-xs font-extrabold text-navy">Confirmar Serviços Automaticamente</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Ignora a triagem prévia e aceita agendamentos diretamente na agenda</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={autoAccept}
                  onChange={() => setAutoAccept(!autoAccept)}
                  className="w-4 h-4 rounded text-orange accent-orange cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div>
                  <p className="text-xs font-extrabold text-navy">Alertas por SMS e Canal WhatsApp</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Envia cópia de ordens de serviço por mensagem móvel (+258)</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifySms}
                  onChange={() => setNotifySms(!notifySms)}
                  className="w-4 h-4 rounded text-orange accent-orange cursor-pointer"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right side payment integrations info info */}
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-[40px] border border-slate-100 shadow-soft space-y-6">
            <h3 className="text-sm font-black text-navy uppercase tracking-widest flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-orange" />
              Destinação de Pagamentos
            </h3>

            <div className="space-y-4 font-semibold text-xs text-navy/80 text-left">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Método de Resgate Padrão</label>
                <select
                  value={defaultPayoutMethod}
                  onChange={(e) => setDefaultPayoutMethod(e.target.value)}
                  className="w-full p-3 bg-slate-50 rounded-2xl border border-slate-205 font-bold focus:outline-none"
                >
                  <option value="mpesa">M-Pesa Moçambique</option>
                  <option value="emola">e-Mola</option>
                  <option value="ponto24">Cartão Ponto24</option>
                  <option value="bank">Banco Local (Transferência)</option>
                </select>
              </div>

              <div className="bg-slate-50 p-4 rounded-3xl text-xs text-slate-400 space-y-2 leading-relaxed">
                <p className="font-extrabold text-navy text-[11px] uppercase tracking-widest flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-orange" /> Política de Repasses
                </p>
                Os repasses são processados diariamente de forma segura de acordo com a validação das ordens de trabalho concluídas com êxito.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
