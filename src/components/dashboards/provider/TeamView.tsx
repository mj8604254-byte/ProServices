import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Users, 
  UserPlus, 
  Trash, 
  Check, 
  Settings, 
  Shield, 
  Clock, 
  AlertTriangle,
  Mail,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TeamViewProps {
  profile: any;
  onBack: () => void;
}

export function TeamView({ profile, onBack }: TeamViewProps) {
  const uid = profile?.uid || 'guest';
  const isMacro = profile?.role === 'seller_macro';
  const maxLimit = isMacro ? 50 : 8;

  // Collaborators List
  const [members, setMembers] = useState<Array<{ id: string, name: string, email: string, role: string, active: boolean }>>([
    { id: 'm-1', name: 'Sofia Machava', email: 'sofia.machava@proservices.co.mz', role: 'Supervisor', active: true },
    { id: 'm-2', name: 'Lucas Muianga', email: 'lucas.muianga@proservices.co.mz', role: 'Técnico', active: true },
    { id: 'm-3', name: 'António Cuamba', email: 'antonio.cuamba@proservices.co.mz', role: 'Atendimento', active: true },
    { id: 'm-4', name: 'Zélia Langa', email: 'zelia@proservices.co.mz', role: 'Financeiro', active: true }
  ]);

  // Activity Log Timeline Simulation (with real actions occurring on dashboard)
  const [logs, setLogs] = useState<Array<{ id: string, member: string, action: string, date: string }>>([
    { id: 'log-1', member: 'Lucas Muianga', action: 'Iniciou deslocação para Trabalho #TR250', date: 'Hoje, 14:15' },
    { id: 'log-2', member: 'Sofia Machava', action: 'Aprovou reagendamento de AC domiciliar', date: 'Hoje, 11:30' },
    { id: 'log-3', member: 'Zélia Langa', action: 'Solicitou levantamento de 8,500 MT', date: 'Ontem, 09:40' }
  ]);

  // Loader states
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Técnico');

  useEffect(() => {
    const stored = localStorage.getItem(`moz_team_${uid}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.members) setMembers(parsed.members);
        if (parsed.logs) setLogs(parsed.logs);
      } catch (e) {}
    }
  }, [uid]);

  const saveTeamState = (newMembersList: any[], newLogsList: any[]) => {
    localStorage.setItem(`moz_team_${uid}`, JSON.stringify({ members: newMembersList, logs: newLogsList }));
  };

  const handleInviteCollaborator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName || !newMemberEmail) return;

    // Check count against Micro vs Macro limits
    if (members.length >= maxLimit) {
      alert(`Erro de Limite Plano: O seu nível atual restringe o limite máximo para ${maxLimit} funcionários em folha. Faça upgrade para o plano Macro para expandir até 50 assentos!`);
      return;
    }

    const item = {
      id: Math.random().toString(),
      name: newMemberName,
      email: newMemberEmail,
      role: newMemberRole,
      active: false // represents pending status initial invite
    };

    const updatedMembers = [...members, item];
    const updatedLogs = [
      { id: Math.random().toString(), member: 'Administrador (Eu)', action: `Enviou convite para ${newMemberName} (${newMemberRole})`, date: 'Agora mesmo' },
      ...logs
    ];

    setMembers(updatedMembers);
    setLogs(updatedLogs);
    saveTeamState(updatedMembers, updatedLogs);

    setNewMemberName('');
    setNewMemberEmail('');
    alert(`Convite de acesso enviado com êxito para o correio eletrónico ${newMemberEmail}!`);
  };

  const handleDeleteMember = (id: string, name: string) => {
    const updatedMembers = members.filter(m => m.id !== id);
    const updatedLogs = [
      { id: Math.random().toString(), member: 'Administrador (Eu)', action: `Removeu funcionário ${name} da folha de acessos`, date: 'Agora mesmo' },
      ...logs
    ];
    setMembers(updatedMembers);
    setLogs(updatedLogs);
    saveTeamState(updatedMembers, updatedLogs);
  };

  const handleTogglePermissions = (id: string, currentRole: string) => {
    // Cycle roles: Supervisor -> Técnico -> Atendimento -> Financeiro -> Marketing -> Supervisor
    const rolesCycle = ['Supervisor', 'Técnico', 'Atendimento', 'Financeiro', 'Marketing'];
    const currentIdx = rolesCycle.indexOf(currentRole);
    const nextRole = rolesCycle[(currentIdx + 1) % rolesCycle.length];

    const updatedMembers = members.map(m => m.id === id ? { ...m, role: nextRole } : m);
    setMembers(updatedMembers);
    saveTeamState(updatedMembers, logs);
  };

  return (
    <div className="space-y-6 text-left" id="team-view-root">
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
            <span className="text-[10px] font-black uppercase text-orange tracking-[0.2em]">Recursos Humanos & Acessos</span>
            <h2 className="text-2xl font-black text-navy uppercase tracking-tight">Colaboradores & Equipa</h2>
          </div>
        </div>

        {/* Limit tag */}
        <span className="px-4 py-2 bg-slate-900 border border-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-wider self-start sm:self-center">
          Ocupação: {members.length} de {maxLimit} Funcionários
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left column list and invitation form */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* invitation form */}
          <div className="bg-white p-6 sm:p-8 rounded-[40px] border border-slate-100 shadow-soft space-y-6">
            <h3 className="text-md font-black text-navy uppercase tracking-widest flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-orange" />
              Adicionar Colaborador à Equipa
            </h3>

            <form onSubmit={handleInviteCollaborator} className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Nome Completo</label>
                <input 
                  type="text" 
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Ex: João Mandlate"
                  className="w-full p-3 bg-slate-50 rounded-2xl border border-slate-205 text-xs text-navy focus:outline-none focus:border-orange font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Correio Eletrónico</label>
                <input 
                  type="email" 
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="joao@empresa.com"
                  className="w-full p-3 bg-slate-50 rounded-2xl border border-slate-205 text-xs text-navy focus:outline-none focus:border-orange font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Função de Contrato</label>
                <div className="flex gap-2">
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                    className="flex-1 p-3 bg-slate-50 rounded-2xl border border-slate-205 text-xs text-navy focus:outline-none focus:border-orange font-bold"
                  >
                    <option value="Supervisor">Supervisor</option>
                    <option value="Técnico">Técnico de Campo</option>
                    <option value="Atendimento">Atendimento/Suporte</option>
                    <option value="Financeiro">Financeiro</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                  <button 
                    type="submit"
                    className="p-3 bg-navy hover:bg-orange text-white rounded-2xl shrink-0 cursor-pointer"
                  >
                    <UserPlus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Members list */}
          <div className="bg-white p-6 sm:p-8 rounded-[40px] border border-slate-100 shadow-soft space-y-6">
            <h3 className="text-md font-black text-navy uppercase tracking-widest">Quadro Ativo de Colaboradores ({members.length})</h3>

            <div className="divide-y divide-slate-100">
              {members.map((member) => (
                <div key={member.id} className="py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-xs font-bold text-navy/80">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-extrabold text-navy text-sm">{member.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-bold flex items-center gap-1.5 uppercase font-mono">
                        <Mail className="w-3.5 h-3.5 text-slate-350" />
                        {member.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className="text-[10px] font-black uppercase text-navy border border-slate-220 px-2.5 py-1 rounded bg-slate-50 flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-orange" />
                      Função: {member.role}
                    </span>
                    
                    {/* Toggle rights */}
                    <button
                      onClick={() => handleTogglePermissions(member.id, member.role)}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 text-[9px] uppercase tracking-widest rounded-lg font-black hover:bg-slate-100"
                    >
                      Alterar Permissões
                    </button>

                    <button
                      onClick={() => handleDeleteMember(member.id, member.name)}
                      className="p-2 text-slate-300 hover:text-rose-650 cursor-pointer"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RH auditing logs side panel */}
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-[40px] border border-slate-100 shadow-soft space-y-6">
            <div>
              <h3 className="text-sm font-black text-navy uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange" />
                Histórico de Atividade
              </h3>
              <p className="text-xs text-slate-400 font-bold mt-1">Logs auditáveis em tempo real</p>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
              {logs.map((log) => (
                <div key={log.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-left space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase">
                    <span className="text-orange">{log.member}</span>
                    <span className="text-slate-400 font-mono">{log.date}</span>
                  </div>
                  <p className="text-xs font-bold text-navy leading-normal">{log.action}</p>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 p-4 rounded-3xl border border-dashed border-slate-200 text-xs text-slate-400 text-left space-y-1 leading-relaxed">
              <p className="font-extrabold text-navy text-[11px] uppercase tracking-widest flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-orange" /> Segurança Corporativa
              </p>
              Qualquer alteração, alteração de permissão, demissão ou convites aciona alertas automatizados nas contas fiscais dos respectivos associados da empresa.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
