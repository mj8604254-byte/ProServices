import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Cpu, 
  FileText, 
  Users, 
  Download, 
  RefreshCw,
  Plus,
  Trash,
  CheckCircle,
  Briefcase,
  Layers,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  UserCheck,
  Building
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OperationsCenterViewProps {
  profile: any;
  onBack: () => void;
}

export function OperationsCenterView({ profile, onBack }: OperationsCenterViewProps) {
  const uid = profile?.uid || 'guest';
  const isMacro = profile?.role === 'seller_macro';

  // Toggle configurations
  const [autoDispatch, setAutoDispatch] = useState(true);
  const [dispatchStrategy, setDispatchStrategy] = useState<'nearest' | 'workload' | 'ranking'>('nearest');

  // Corporate CRM Client Base Directories
  const [crmClients, setCrmClients] = useState<Array<{ id: string, name: string, representative: string, email: string, location: string, status: string }>>([
    { id: 'cli-1', name: 'Millennium BIM (Av. 25 de Setembro)', representative: 'Celeste Muthemba', email: 'c.muthemba@bim.co.mz', location: 'Polana Cimento, Maputo', status: 'Ativo' },
    { id: 'cli-2', name: 'Standard Bank HQ', representative: 'Ismael Noormahomed', email: 'ismael.n@standardbank.co.mz', location: 'Sommerschield, Maputo', status: 'Ativo' },
    { id: 'cli-3', name: 'Vodacom Moçambique SARL', representative: 'Patrício Chauque', email: 'p.chauque@vodacom.co.mz', location: 'Triunfo, Maputo', status: 'Em Negociação' }
  ]);

  // Corporate B2B Contracts list
  const [contracts, setContracts] = useState<Array<{ id: string, clientName: string, serviceTitle: string, value: number, sla: string, expiry: string }>>([
    { id: 'con-101', clientName: 'Millennium BIM', serviceTitle: 'Manutenção Mensal Sistemas de Climatização', value: 45000, sla: '99.5% uptime / Resposta < 2h', expiry: '2027-12-31' },
    { id: 'con-102', clientName: 'Standard Bank HQ', serviceTitle: 'Manutenção de Infraestrutura Elétrica Primária', value: 75000, sla: 'Resposta < 1h com Técnico Alocado', expiry: '2026-11-30' }
  ]);

  // Form input states
  const [newClientName, setNewClientName] = useState('');
  const [newClientRep, setNewClientRep] = useState('');
  const [newContractVal, setNewContractVal] = useState('');
  const [newContractSLA, setNewContractSLA] = useState('99.0% / Resposta < 4h');

  // Trigger download of B2B analytics
  const handleExportB2BExecutiveReport = () => {
    const headers = ['ID Contrato', 'Cliente', 'Serviço B2B', 'Faturação Mensal (MT)', 'SLA Definido', 'Expiração'];
    const rows = contracts.map(c => [
      c.id,
      c.clientName,
      c.serviceTitle,
      c.value,
      c.sla,
      c.expiry
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_executivo_B2B_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newContractVal) return;

    const item = {
      id: `con-${Math.floor(100 + Math.random() * 900)}`,
      clientName: newClientName,
      serviceTitle: `Plano Geral de Manutenção ProServices`,
      value: Number(newContractVal),
      sla: newContractSLA,
      expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };

    setContracts([...contracts, item]);
    setNewClientName('');
    setNewContractVal('');
    alert(`Contrato corporativo criado com sucesso para o parceiro ${newClientName}!`);
  };

  return (
    <div className="space-y-6 text-left" id="operations-center-view-root">
      
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
            <span className="text-[10px] font-black uppercase text-orange tracking-[0.2em]">Exclusivo Plano Macro</span>
            <h2 className="text-2xl font-black text-navy uppercase tracking-tight">Central de Operações B2B</h2>
          </div>
        </div>

        {/* Executive summary report download button */}
        <button
          onClick={handleExportB2BExecutiveReport}
          className="px-5 py-2.5 bg-orange text-white hover:bg-indigo-650 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all shadow cursor-pointer"
        >
          <Download className="w-4 h-4" /> Relatório Executivo B2B
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Automatic services dispatch parameters */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Dispatch parameters card */}
          <div className="bg-white p-6 sm:p-8 rounded-[40px] border border-slate-100 shadow-soft space-y-6">
            <div className="flex justify-between items-start gap-3">
              <div>
                <h3 className="text-md font-black text-navy uppercase tracking-widest flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-orange" />
                  Distribuição Automática de Chamados
                </h3>
                <p className="text-xs text-slate-400 font-bold mt-1">Algoritmos inteligentes Moz alocam automaticamente novos pedidos aos parceiros ou técnicos mais adequados no terreno.</p>
              </div>

              {/* Toggle switcher */}
              <button
                onClick={() => setAutoDispatch(!autoDispatch)}
                className="p-1 border-none bg-transparent cursor-pointer"
              >
                {autoDispatch ? (
                  <ToggleRight className="w-12 h-12 text-orange" />
                ) : (
                  <ToggleLeft className="w-12 h-12 text-slate-300" />
                )}
              </button>
            </div>

            <AnimatePresence>
              {autoDispatch && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 pt-1 border-t border-slate-100"
                >
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Escolha a Estratégia do Despacho</label>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {[
                      { id: 'nearest', label: 'Mais Próximo', desc: 'Raio geográfico GPS' },
                      { id: 'workload', label: 'Menor Carga', desc: 'Funcionario com menos trabalhos' },
                      { id: 'ranking', label: 'Melhor Avaliado', desc: 'Selo de reputaçao mais alta' }
                    ].map((strat) => (
                      <button
                        key={strat.id}
                        type="button"
                        onClick={() => setDispatchStrategy(strat.id as any)}
                        className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                          dispatchStrategy === strat.id 
                            ? 'bg-navy text-white border-navy' 
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-transparent'
                        }`}
                      >
                        <p className="font-extrabold text-xs">{strat.label}</p>
                        <p className={`text-[9px] mt-1 font-bold ${dispatchStrategy === strat.id ? 'text-orange' : 'text-slate-400'}`}>{strat.desc}</p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* SLA Contracts manager list */}
          <div className="bg-white p-6 sm:p-8 rounded-[40px] border border-slate-100 shadow-soft space-y-6">
            <h3 className="text-md font-black text-navy uppercase tracking-widest flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange" />
              Gestor de Contratos Corporativos (SLA)
            </h3>

            {/* Contract creator trigger */}
            <form onSubmit={handleCreateContract} className="grid sm:grid-cols-3 gap-3 items-end p-4 bg-slate-50 rounded-3xl border border-slate-150">
              <div>
                <label className="block text-[9px] uppercase font-black text-slate-400 mb-1">Nome Cliente B2B</label>
                <input 
                  type="text" 
                  placeholder="Ex: Banco de Moçambique"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-navy bg-white focus:outline-none font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase font-black text-slate-400 mb-1">Faturação Mensal (MT)</label>
                <input 
                  type="number" 
                  placeholder="MT"
                  value={newContractVal}
                  onChange={(e) => setNewContractVal(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-navy bg-white focus:outline-none font-bold"
                  required
                />
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-[9px] uppercase font-black text-slate-400 mb-1">SLA Cobertura</label>
                  <input 
                    type="text" 
                    value={newContractSLA}
                    onChange={(e) => setNewContractSLA(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-navy bg-white focus:outline-none font-bold"
                  />
                </div>
                <button
                  type="submit"
                  className="p-2.5 bg-navy hover:bg-orange text-white rounded-xl cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </form>

            <div className="space-y-4">
              {contracts.map((con) => (
                <div key={con.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs">
                  <div>
                    <h5 className="font-extrabold text-navy text-sm uppercase">{con.clientName}</h5>
                    <p className="font-bold text-slate-405 mt-0.5">{con.serviceTitle}</p>
                    <span className="text-[9px] text-orange uppercase font-black tracking-wider block mt-1.5 bg-orange/5 border border-orange/10 px-2 py-0.5 rounded-md inline-block">SLA: {con.sla}</span>
                  </div>

                  <div className="text-right self-end sm:self-center">
                    <p className="text-md font-black text-navy">{con.value.toLocaleString()} MT / Mês</p>
                    <span className="text-[9px] font-bold text-slate-400 block mt-1">Expira em: {new Date(con.expiry).toLocaleDateString('pt-MZ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Corporate CRM Directory timelines */}
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-[40px] border border-slate-100 shadow-soft space-y-6">
            <h3 className="text-sm font-black text-navy uppercase tracking-widest flex items-center gap-2">
              <Building className="w-5 h-5 text-orange" />
              Diretório B2B CRM
            </h3>

            <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1 text-xs">
              {crmClients.map((client) => (
                <div key={client.id} className="p-4 bg-slate-55 bg-slate-50 rounded-2xl border border-slate-100 text-left space-y-1">
                  <span className="text-[8px] font-black uppercase bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md">{client.status}</span>
                  <div className="pt-1.5">
                    <p className="font-black text-navy">{client.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">{client.representative}</p>
                    <p className="text-[9px] text-slate-350 font-bold font-mono">{client.email}</p>
                    <p className="text-[10px] text-slate-500 font-semibold mt-1 bg-white p-2 rounded-xl">{client.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
