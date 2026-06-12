import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Wrench, 
  Play, 
  CheckCircle, 
  Clock, 
  MapPin, 
  User, 
  AlertCircle, 
  RefreshCw,
  Search,
  Check,
  Navigation
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../../lib/supabase';

// Status translations
const JOB_STATUSES = {
  'em_deslocacao': { label: 'Em Deslocação', color: 'bg-blue-100 text-blue-700 border-blue-200 icon-navigation' },
  'aguardando_cliente': { label: 'Aguardando Cliente', color: 'bg-amber-100 text-amber-700 border-amber-200 icon-clock' },
  'em_execucao': { label: 'Em Execução', color: 'bg-indigo-100 text-indigo-700 border-indigo-200 icon-wrench' },
  'em_revisao': { label: 'Em Revisão', color: 'bg-purple-100 text-purple-700 border-purple-200 icon-alert' },
  'completed': { label: 'Concluído', color: 'bg-green-100 text-green-700 border-green-200 icon-check' },
  'cancelled': { label: 'Cancelado', color: 'bg-rose-100 text-rose-700 border-rose-200 icon-x' }
};

interface JobsManagerViewProps {
  orders: any[];
  profile: any;
  onBack: () => void;
  onRefresh: () => Promise<void>;
}

export function JobsManagerView({ orders, profile, onBack, onRefresh }: JobsManagerViewProps) {
  const uid = profile?.uid || 'guest';
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  
  // Custom job execution states stored in local storage and synced with actual orders
  const [jobStates, setJobStates] = useState<Record<string, string>>({});

  useEffect(() => {
    const stored = localStorage.getItem(`moz_job_states_${uid}`);
    if (stored) {
      try {
        setJobStates(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    }
  }, [uid]);

  const updateJobExecutionState = async (orderId: string, newState: string) => {
    setLoadingId(orderId);
    try {
      // 1. Sync custom state in local storage
      const updated = { ...jobStates, [orderId]: newState };
      setJobStates(updated);
      localStorage.setItem(`moz_job_states_${uid}`, JSON.stringify(updated));

      // 2. Also update in real Supabase order if applicable
      // If newState is 'completed' or 'cancelled', we also update the real database order
      let dbStatus = 'accepted';
      if (newState === 'completed') dbStatus = 'completed';
      if (newState === 'cancelled') dbStatus = 'cancelled';

      const { error } = await supabase
        .from('orders')
        .update({ status: dbStatus })
        .eq('id', orderId);

      if (error) {
        console.warn('Could not sync with standard Order Status, but state was saved locally:', error.message);
      }

      await onRefresh();
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  // Only consider service-type orders or fallback items containing service names
  const serviceOrders = orders.filter(o => {
    const isServiceType = o.type === 'service';
    const hasServiceItem = o.items?.some((it: any) => 
      it.name?.toLowerCase().includes('reparação') || 
      it.name?.toLowerCase().includes('manutenção') || 
      it.name?.toLowerCase().includes('instalação') ||
      it.name?.toLowerCase().includes('limpeza') ||
      it.name?.toLowerCase().includes('serviço') ||
      it.name?.toLowerCase().includes('culinária')
    );
    return isServiceType || hasServiceItem;
  });

  const getEffectiveStatus = (order: any) => {
    // Check if we have a detailed job execution status in local storage, else default to database order status
    if (jobStates[order.id]) {
      return jobStates[order.id];
    }
    if (order.status === 'completed' || order.status === 'Entregue') return 'completed';
    if (order.status === 'cancelled' || order.status === 'rejected') return 'cancelled';
    
    // Default active state for unvisited active orders
    return 'em_execucao';
  };

  const filteredJobs = serviceOrders.filter(o => {
    const status = getEffectiveStatus(o);
    const matchesSearch = (
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.delivery_address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.items?.some((it: any) => it.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (filter === 'completed') {
      return matchesSearch && (status === 'completed' || status === 'cancelled');
    }
    if (filter === 'active') {
      return matchesSearch && (status !== 'completed' && status !== 'cancelled');
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-6" id="jobs-manager-view-root">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 text-navy transition-all cursor-pointer shadow-soft"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[10px] font-black uppercase text-orange tracking-[0.2em]">Operações de Campo</span>
            <h2 className="text-2xl font-black text-navy uppercase tracking-tight">Gestor de Trabalhos Ativos</h2>
          </div>
        </div>
        <button 
          onClick={onRefresh}
          className="p-3 bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl text-slate-500 hover:text-navy transition-all"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs / Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl shrink-0">
          <button
            onClick={() => setFilter('active')}
            className={`px-5 py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
              filter === 'active' ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-navy'
            }`}
          >
            Trabalhos Ativos
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-5 py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
              filter === 'completed' ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-navy'
            }`}
          >
            Histórico Concluído
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-5 py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
              filter === 'all' ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-navy'
            }`}
          >
            Todos
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar trabalhos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-150 rounded-2xl text-xs focus:outline-none focus:border-orange font-bold text-navy shadow-soft"
          />
        </div>
      </div>

      {/* Active Jobs Grid / List */}
      <div className="space-y-4">
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => {
            const currentStatus = getEffectiveStatus(job);
            const statusInfo = JOB_STATUSES[currentStatus as keyof typeof JOB_STATUSES] || { label: currentStatus, color: 'bg-slate-100 text-slate-500' };
            const clientName = job.customer_id ? `Cliente #${job.customer_id.slice(0, 6).toUpperCase()}` : 'Cliente Particular';
            const itemsList = job.items?.map((it: any) => it.name).join(', ') || 'Serviço Profissional';

            return (
              <div 
                key={job.id} 
                className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-soft hover:border-orange/20 transition-all text-left flex flex-col xl:flex-row justify-between gap-6"
              >
                {/* Job Metadata & Customer */}
                <div className="space-y-4 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-wider bg-slate-50 px-2.5 py-1 rounded-lg">
                      TRABALHO #{job.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-navy leading-tight">{itemsList}</h3>
                    <p className="text-xs text-slate-400 font-bold mt-1 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {clientName}
                    </p>
                    <p className="text-xs text-slate-400 font-bold mt-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {job.delivery_address || 'Endereço de Atendimento'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-50 flex items-center gap-4 text-xs font-bold text-slate-500">
                    <span>Atendimento Adquirido em: {new Date(job.created_at).toLocaleDateString('pt-MZ')}</span>
                    <span>•</span>
                    <span className="text-orange font-black text-sm">{Number(job.total_price || job.totalPrice).toLocaleString()} MT</span>
                  </div>
                </div>

                {/* Operations Actions Control Tower */}
                {currentStatus !== 'completed' && currentStatus !== 'cancelled' && (
                  <div className="flex flex-wrap items-center gap-2 xl:self-center shrink-0">
                    <button
                      disabled={loadingId === job.id}
                      onClick={() => updateJobExecutionState(job.id, 'em_deslocacao')}
                      className={`px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all ${
                        currentStatus === 'em_deslocacao'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-50 text-slate-650 hover:bg-blue-50 hover:text-blue-600'
                      }`}
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      Em Deslocação
                    </button>
                    
                    <button
                      disabled={loadingId === job.id}
                      onClick={() => updateJobExecutionState(job.id, 'aguardando_cliente')}
                      className={`px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all ${
                        currentStatus === 'aguardando_cliente'
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-50 text-slate-650 hover:bg-amber-50 hover:text-amber-505'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      Ag. Cliente
                    </button>

                    <button
                      disabled={loadingId === job.id}
                      onClick={() => updateJobExecutionState(job.id, 'em_execucao')}
                      className={`px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all ${
                        currentStatus === 'em_execucao'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-50 text-slate-650 hover:bg-indigo-50 hover:text-indigo-650'
                      }`}
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      Executando
                    </button>

                    <button
                      disabled={loadingId === job.id}
                      onClick={() => updateJobExecutionState(job.id, 'em_revisao')}
                      className={`px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all ${
                        currentStatus === 'em_revisao'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-50 text-slate-650 hover:bg-purple-50 hover:text-purple-650'
                      }`}
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      Em Revisão
                    </button>

                    <button
                      disabled={loadingId === job.id}
                      onClick={() => updateJobExecutionState(job.id, 'completed')}
                      className="px-4 py-3 bg-green-650 hover:bg-green-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Concluir
                    </button>
                  </div>
                )}

                {/* Completed state indicator */}
                {(currentStatus === 'completed' || currentStatus === 'cancelled') && (
                  <div className="flex items-center gap-2 xl:self-center shrink-0">
                    <div className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
                      currentStatus === 'completed' ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      <Check className="w-4 h-4" />
                      Trabalho Encerrado
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-[32px] p-12 border border-dashed border-slate-200 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <Wrench className="w-7 h-7" />
            </div>
            <div>
              <h4 className="font-extrabold text-navy text-md">Nenhum serviço correspondente</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Todos os seus trabalhos e agendamentos aprovados aparecerão aqui em tempo real. Pode simular novos pedidos na central principal do cliente para ver o fluxo atualizar instantaneamente.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
