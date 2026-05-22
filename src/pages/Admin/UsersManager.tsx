import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  UserPlus,
  Mail,
  Phone,
  Calendar,
  Eye,
  Slash
} from 'lucide-react';
import { supabase, handleSupabaseError } from '../../lib/supabase';
import { UserProfile, UserRole } from '../../types';

export function UsersManager() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mappedDocs = data.map(u => ({
        ...u,
        displayName: u.display_name,
        avatarUrl: u.avatar_url,
        isVerified: u.is_verified,
        createdAt: u.created_at
      })) as UserProfile[];
      
      setUsers(mappedDocs);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (uid: string, status: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: status })
        .eq('uid', uid);
        
      if (error) throw error;

      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, isVerified: status } : u));
    } catch (err) {
      console.error('Error verifying user:', err);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.displayName.toLowerCase().includes(search.toLowerCase()) || 
                          u.email.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || u.role === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-navy uppercase tracking-tight">Gestão de Utilizadores</h1>
          <p className="text-slate-500 font-medium">Controle e verificação de contas da plataforma.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Pesquisar utilizador..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-white border-none rounded-2xl pl-12 pr-6 py-3 font-bold text-sm shadow-soft focus:ring-2 focus:ring-orange/20"
            />
          </div>
          <button className="p-3 bg-white rounded-2xl shadow-soft hover:bg-slate-50 transition-colors">
            <Filter className="w-5 h-5 text-navy" />
          </button>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 no-scrollbar">
        {['all', 'customer', 'seller_micro', 'seller_macro', 'deliverer', 'service_provider'].map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shrink-0 ${
              filter === type ? 'bg-navy text-white shadow-lg' : 'bg-white text-slate-400 hover:bg-slate-50'
            }`}
          >
            {type.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-[40px] shadow-soft border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Utilizador</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center">
                    <div className="w-8 h-8 border-4 border-orange border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-bold uppercase text-xs">
                    Nenhum utilizador encontrado.
                  </td>
                </tr>
              ) : filteredUsers.map(user => (
                <tr key={user.uid} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" className="w-10 h-10 rounded-xl object-cover" />
                      ) : (
                        <div className="w-10 h-10 bg-navy rounded-xl flex items-center justify-center text-white text-xs font-black">
                          {user.displayName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-black text-navy text-sm tracking-tight">{user.displayName}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${getRoleColor(user.role)}`}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${user.isVerified ? 'bg-green-500' : 'bg-slate-300'}`} />
                      <span className="text-[10px] font-black text-navy uppercase tracking-widest">
                        {user.isVerified ? 'Verificado' : 'Pendente'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-xs font-bold text-slate-400">
                      {user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                    </p>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleVerify(user.uid, !user.isVerified)}
                        className={`p-2 rounded-xl transition-all ${user.isVerified ? 'bg-orange/10 text-orange' : 'bg-green-50 text-green-600'} hover:scale-110`}
                        title={user.isVerified ? "Desverificar" : "Verificar"}
                      >
                        {user.isVerified ? <Slash className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                      </button>
                      <button className="p-2 bg-slate-100 text-navy rounded-xl hover:bg-slate-200 transition-all hover:scale-110">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all hover:scale-110">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function getRoleColor(role: UserRole) {
  switch (role) {
    case UserRole.ADMIN: return 'bg-navy text-white';
    case UserRole.SELLER_MACRO: return 'bg-slate-900 text-white';
    case UserRole.SELLER_MICRO: return 'bg-orange/10 text-orange';
    case UserRole.DELIVERER: return 'bg-green-50 text-green-600';
    case UserRole.SERVICE_PROVIDER: return 'bg-indigo-50 text-indigo-600';
    default: return 'bg-blue-50 text-blue-600';
  }
}
