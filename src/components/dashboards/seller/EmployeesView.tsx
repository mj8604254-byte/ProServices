import React, { useState, useEffect } from 'react';
import { ChevronLeft, UserPlus, Shield, Check, Lock, X, Trash2, Power, UserCheck } from 'lucide-react';

interface EmployeesViewProps {
  profile: any;
  onBack: () => void;
}

export function EmployeesView({ profile, onBack }: EmployeesViewProps) {
  const localStorageKey = `moz_pro_seller_employees_${profile?.uid || 'default'}`;

  const [employees, setEmployees] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'gerente' as 'gerente' | 'operador_stock' | 'vendedor' | 'financeiro',
    permissions: {
      editCatalog: true,
      processOrders: true,
      viewReports: false,
      manageEmployees: false
    }
  });

  // Load existing
  useEffect(() => {
    const saved = localStorage.getItem(localStorageKey);
    if (saved) {
      try {
        setEmployees(JSON.parse(saved));
      } catch (e) {
        console.warn('Could not load employees from storage:', e);
      }
    } else {
      // Seed initial dummy employees for a realistic, ready-to-use professional layout
      const defaultTeam = [
        {
          id: 'emp-1',
          name: 'Januário Tembe',
          email: 'januario.tembe@proservices.co.mz',
          role: 'vendedor',
          status: 'active',
          permissions: { editCatalog: false, processOrders: true, viewReports: false, manageEmployees: false }
        },
        {
          id: 'emp-2',
          name: 'Isabel Chongo',
          email: 'isabel.chongo@proservices.co.mz',
          role: 'operador_stock',
          status: 'active',
          permissions: { editCatalog: true, processOrders: false, viewReports: false, manageEmployees: false }
        }
      ];
      setEmployees(defaultTeam);
      localStorage.setItem(localStorageKey, JSON.stringify(defaultTeam));
    }
  }, [localStorageKey]);

  const saveToStorage = (updatedList: any[]) => {
    setEmployees(updatedList);
    localStorage.setItem(localStorageKey, JSON.stringify(updatedList));
  };

  // Switch presets depending on roles selected
  const handleRoleChange = (selectedRole: any) => {
    let perms = { editCatalog: false, processOrders: false, viewReports: false, manageEmployees: false };
    if (selectedRole === 'gerente') {
      perms = { editCatalog: true, processOrders: true, viewReports: true, manageEmployees: true };
    } else if (selectedRole === 'operador_stock') {
      perms = { editCatalog: true, processOrders: false, viewReports: false, manageEmployees: false };
    } else if (selectedRole === 'vendedor') {
      perms = { editCatalog: false, processOrders: true, viewReports: false, manageEmployees: false };
    } else if (selectedRole === 'financeiro') {
      perms = { editCatalog: false, processOrders: false, viewReports: true, manageEmployees: false };
    }
    setForm({ ...form, role: selectedRole, permissions: perms });
  };

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;

    const newEmp = {
      id: `emp-${Date.now()}`,
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      status: 'active',
      permissions: form.permissions
    };

    const updated = [newEmp, ...employees];
    saveToStorage(updated);
    
    // reset form
    setForm({
      name: '',
      email: '',
      role: 'vendedor',
      permissions: { editCatalog: false, processOrders: true, viewReports: false, manageEmployees: false }
    });
    setShowAddForm(false);
    setSuccess('Colaborador adicionado com sucesso!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleToggleStatus = (id: string) => {
    const updated = employees.map(emp => {
      if (emp.id === id) {
        return { ...emp, status: emp.status === 'active' ? 'suspended' : 'active' };
      }
      return emp;
    });
    saveToStorage(updated);
  };

  const handleDeleteEmployee = (id: string) => {
    if (!confirm('Eliminar permanentemente este funcionário do painel?')) return;
    const updated = employees.filter(emp => emp.id !== id);
    saveToStorage(updated);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in" id="employees-view-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            id="back-from-employees-btn"
            onClick={onBack} 
            className="p-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 text-navy transition-all cursor-pointer shadow-soft"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[10px] font-black uppercase text-orange tracking-[0.2em]">Gestão Organizacional</span>
            <h2 className="text-2xl font-black text-navy uppercase tracking-tight">Equipa & Funcionários</h2>
          </div>
        </div>

        <button
          id="btn-trigger-add-employee"
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-5 py-3 bg-navy text-white hover:bg-orange rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
        >
          <UserPlus className="w-4.5 h-4.5" /> Adicionar Membro
        </button>
      </div>

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-2xl text-green-700 text-xs font-semibold">
          {success}
        </div>
      )}

      {/* Embedded form creation */}
      {showAddForm && (
        <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-slate-100 shadow-soft text-left animate-slide-in">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
            <h3 className="text-sm font-black text-navy uppercase tracking-widest flex items-center gap-2">
              <Shield className="w-4.5 h-4.5 text-orange" /> Registro Comercial de Funcionário
            </h3>
            <button
              id="close-add-emp-form-btn"
              onClick={() => setShowAddForm(false)}
              className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full cursor-pointer text-slate-450"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCreateEmployee} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Nome Completo</label>
              <input
                id="emp-form-name"
                required
                type="text"
                placeholder="Ex: Alfredo Machava"
                className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold text-xs focus:ring-2 focus:ring-orange/20 focus:outline-none"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Email do Colaborador</label>
              <input
                id="emp-form-email"
                required
                type="email"
                placeholder="Ex: alfredo.machava@proservices.co.mz"
                className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold text-xs focus:ring-2 focus:ring-orange/20 focus:outline-none"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Função Atribuída</label>
              <select
                id="emp-form-role"
                className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold text-xs text-navy focus:ring-2 focus:ring-orange/20 focus:outline-none"
                value={form.role}
                onChange={(e) => handleRoleChange(e.target.value)}
              >
                <option value="gerente">Gerente Geral</option>
                <option value="operador_stock">Operador de Stock (Logística)</option>
                <option value="vendedor">Vendedor / Comercial</option>
                <option value="financeiro">Financeiro / Auditoria</option>
              </select>
            </div>

            {/* Direct detailed checklist permissions */}
            <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl md:col-span-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-3 text-left">Nível de Permissões Críticas</span>
              
              <div className="grid grid-cols-2 gap-4 text-xs font-bold text-navy">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    id="perm-edit-catalog"
                    type="checkbox"
                    checked={form.permissions.editCatalog}
                    onChange={(e) => setForm({ ...form, permissions: { ...form.permissions, editCatalog: e.target.checked } })}
                    className="w-4 h-4 text-orange focus:ring-orange/30 border-slate-200 rounded"
                  />
                  <span>Editar Catálogo / SKUs</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    id="perm-process-orders"
                    type="checkbox"
                    checked={form.permissions.processOrders}
                    onChange={(e) => setForm({ ...form, permissions: { ...form.permissions, processOrders: e.target.checked } })}
                    className="w-4 h-4 text-orange focus:ring-orange/30 border-slate-200 rounded"
                  />
                  <span>Aprovar/Processar Pedidos</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    id="perm-view-reports"
                    type="checkbox"
                    checked={form.permissions.viewReports}
                    onChange={(e) => setForm({ ...form, permissions: { ...form.permissions, viewReports: e.target.checked } })}
                    className="w-4 h-4 text-orange focus:ring-orange/30 border-slate-200 rounded"
                  />
                  <span>Ver Faturamento e Relatórios</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    id="perm-manage-employees"
                    type="checkbox"
                    checked={form.permissions.manageEmployees}
                    onChange={(e) => setForm({ ...form, permissions: { ...form.permissions, manageEmployees: e.target.checked } })}
                    className="w-4 h-4 text-orange focus:ring-orange/30 border-slate-200 rounded"
                  />
                  <span>Gerir Colaboradores</span>
                </label>
              </div>
            </div>

            <button
              id="btn-save-new-employee"
              type="submit"
              className="px-6 py-4 bg-orange hover:bg-orange/95 text-white rounded-2xl font-black text-xs uppercase tracking-wider md:col-span-2 cursor-pointer text-center"
            >
              Gravar Colaborador e Enviar Credenciais
            </button>
          </form>
        </div>
      )}

      {/* List of active employees */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/60 font-black text-slate-400 text-[10px] uppercase tracking-widest">
                <th className="px-6 py-4">Nome e Contacto</th>
                <th className="px-6 py-4">Função Atribuída</th>
                <th className="px-6 py-4">Estado de Acesso</th>
                <th className="px-6 py-4">Matriz de Permissões</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-bold text-xs">
                    Nenhum colaborador adicionado ao portfólio de equipa.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/45 transition-colors">
                    {/* Identity */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-550">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-extrabold text-navy">{emp.name}</p>
                          <p className="text-[10px] text-slate-400">{emp.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role mapped to badge */}
                    <td className="px-6 py-4 font-bold text-navy uppercase text-[10px] tracking-tight">
                      {emp.role === 'gerente' && '👔 Gerente Geral'}
                      {emp.role === 'operador_stock' && '📦 Operador de Stock'}
                      {emp.role === 'vendedor' && '🤝 Vendedor / Comercial'}
                      {emp.role === 'financeiro' && '💰 Financeiro'}
                    </td>

                    {/* Active suspende */}
                    <td className="px-6 py-4">
                      <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                        emp.status === 'active' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-650'
                      }`}>
                        {emp.status === 'active' ? 'Activo' : 'Suspenso'}
                      </span>
                    </td>

                    {/* Matrix */}
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {emp.permissions?.editCatalog && (
                          <span className="text-[8px] font-extrabold text-slate-600 bg-slate-100 rounded-md px-1.5 py-0.5 uppercase tracking-tighter">Catálogo</span>
                        )}
                        {emp.permissions?.processOrders && (
                          <span className="text-[8px] font-extrabold text-slate-600 bg-slate-100 rounded-md px-1.5 py-0.5 uppercase tracking-tighter">Pedidos</span>
                        )}
                        {emp.permissions?.viewReports && (
                          <span className="text-[8px] font-extrabold text-slate-600 bg-slate-100 rounded-md px-1.5 py-0.5 uppercase tracking-tighter">Relatórios</span>
                        )}
                        {emp.permissions?.manageEmployees && (
                          <span className="text-[8px] font-extrabold text-slate-600 bg-slate-100 rounded-md px-1.5 py-0.5 uppercase tracking-tighter">Equipa</span>
                        )}
                      </div>
                    </td>

                    {/* Control buttons */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          id={`toggle-status-${emp.id}`}
                          onClick={() => handleToggleStatus(emp.id)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            emp.status === 'active' ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                          }`}
                          title={emp.status === 'active' ? 'Suspender Acesso' : 'Ativar Acesso'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          id={`delete-employee-${emp.id}`}
                          onClick={() => handleDeleteEmployee(emp.id)}
                          className="p-1.5 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar Membro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
