import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Calendar, 
  Clock, 
  User, 
  MessageSquare, 
  Check, 
  X, 
  Plus, 
  Settings, 
  ChevronRight,
  Shield,
  Coffee,
  CalendarDays,
  Sun,
  Moon,
  Sparkles,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../../lib/supabase';

interface AgendaViewProps {
  orders: any[];
  profile: any;
  onBack: () => void;
  onRefresh: () => Promise<void>;
}

export function AgendaView({ orders, profile, onBack, onRefresh }: AgendaViewProps) {
  const uid = profile?.uid || 'guest';
  const [activeTab, setActiveTab] = useState<'appointments' | 'schedule_settings'>('appointments');
  const [bookingFilter, setBookingFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('all');
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [isRescheduling, setIsRescheduling] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');

  // Floating Chat Simulation with client
  const [isConversing, setIsConversing] = useState<any | null>(null);
  const [messageText, setMessageText] = useState('');
  const [chatHistory, setChatHistory] = useState<Record<string, Array<{ sender: 'provider' | 'client', text: string, time: string }>>>({});

  // Operating Hours Config State
  const [workingDays, setWorkingDays] = useState<Record<string, { enabled: boolean, start: string, end: string, breakStart: string, breakEnd: string }>>({
    'Segunda-feira': { enabled: true, start: '08:00', end: '18:00', breakStart: '12:00', breakEnd: '13:00' },
    'Terça-feira': { enabled: true, start: '08:00', end: '18:00', breakStart: '12:00', breakEnd: '13:00' },
    'Quarta-feira': { enabled: true, start: '08:00', end: '18:00', breakStart: '12:00', breakEnd: '13:00' },
    'Quinta-feira': { enabled: true, start: '08:00', end: '18:00', breakStart: '12:00', breakEnd: '13:00' },
    'Sexta-feira': { enabled: true, start: '08:00', end: '18:00', breakStart: '12:00', breakEnd: '13:00' },
    'Sábado': { enabled: true, start: '08:00', end: '13:00', breakStart: '11:00', breakEnd: '11:30' },
    'Domingo': { enabled: false, start: '09:00', end: '12:00', breakStart: '12:00', breakEnd: '13:00' }
  });

  const [exceptions, setExceptions] = useState<Array<{ date: string, note: string }>>([
    { date: '2026-06-25', note: 'Dia da Independência Nacional - Fechado' }
  ]);
  const [newExceptionDate, setNewExceptionDate] = useState('');
  const [newExceptionNote, setNewExceptionNote] = useState('');

  // Load custom agenda dates/hours and communication chats
  useEffect(() => {
    const storedHours = localStorage.getItem(`moz_working_hours_${uid}`);
    if (storedHours) {
      try { setWorkingDays(JSON.parse(storedHours)); } catch (e) {}
    }

    const storedExceptions = localStorage.getItem(`moz_working_exceptions_${uid}`);
    if (storedExceptions) {
      try { setExceptions(JSON.parse(storedExceptions)); } catch (e) {}
    }

    const storedChats = localStorage.getItem(`moz_chats_history_${uid}`);
    if (storedChats) {
      try { setChatHistory(JSON.parse(storedChats)); } catch (e) {}
    }
  }, [uid]);

  // Update order database state
  const handleUpdateBookingStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      await onRefresh();
    } catch (e: any) {
      alert('Erro ao atualizar agendamento: ' + e.message);
    }
  };

  const handleSaveWorkingHours = () => {
    localStorage.setItem(`moz_working_hours_${uid}`, JSON.stringify(workingDays));
    alert('Horário de funcionamento guardado com sucesso!');
  };

  const handleAddException = () => {
    if (!newExceptionDate || !newExceptionNote) return;
    const updated = [...exceptions, { date: newExceptionDate, note: newExceptionNote }];
    setExceptions(updated);
    localStorage.setItem(`moz_working_exceptions_${uid}`, JSON.stringify(updated));
    setNewExceptionDate('');
    setNewExceptionNote('');
  };

  const handleRemoveException = (idx: number) => {
    const updated = exceptions.filter((_, i) => i !== idx);
    setExceptions(updated);
    localStorage.setItem(`moz_working_exceptions_${uid}`, JSON.stringify(updated));
  };

  const handleReschedule = async (orderId: string) => {
    if (!rescheduleDate || !rescheduleTime) {
      alert('Selecione data e hora correspondentes.');
      return;
    }
    const combined = `${rescheduleDate} às ${rescheduleTime}`;
    try {
      // Store custom reschedule strings in local storage
      const reschedules = JSON.parse(localStorage.getItem(`moz_reschedules_${uid}`) || '{}');
      reschedules[orderId] = combined;
      localStorage.setItem(`moz_reschedules_${uid}`, JSON.stringify(reschedules));

      // Re-trigger visual indicators on list
      setIsRescheduling(null);
      await onRefresh();
      alert(`Serviço reagendado com sucesso para ${combined}`);
    } catch (err) {
      console.error(err);
    }
  };

  const sendChatMessage = (clientUid: string) => {
    if (!messageText.trim()) return;
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const currentList = chatHistory[clientUid] || [
      { sender: 'client', text: 'Olá, gostaria de confirmar se vão trazer as ferramentas corretas para o AC de 12000BTU.', time: '10:00' }
    ];
    
    const updatedChats = {
      ...chatHistory,
      [clientUid]: [...currentList, { sender: 'provider', text: messageText, time: timeNow }]
    };

    setChatHistory(updatedChats);
    localStorage.setItem(`moz_chats_history_${uid}`, JSON.stringify(updatedChats));
    setMessageText('');

    // Simulated quick customer response after 1.5s
    setTimeout(() => {
      const respList = updatedChats[clientUid];
      const botResponses = [
        "Perfeito! Obrigado pela confirmação rápida, estarei em vossa espera.",
        "Ótimo, obrigado pelo profissionalismo. Nos vemos amanhã!",
        "Seguro. Podem vir nesse horário combinado sem problemas."
      ];
      const randomResponse = botResponses[Math.floor(Math.random() * botResponses.length)];
      
      const finishedChats = {
        ...updatedChats,
        [clientUid]: [...respList, { sender: 'client', text: randomResponse, time: 'Agora' }]
      };
      setChatHistory(finishedChats);
      localStorage.setItem(`moz_chats_history_${uid}`, JSON.stringify(finishedChats));
    }, 1500);
  };

  // Get custom scheduled information strings
  const getRescheduledTime = (orderId: string) => {
    const res = JSON.parse(localStorage.getItem(`moz_reschedules_${uid}`) || '{}');
    return res[orderId] || null;
  };

  // Filter schedules
  const serviceBookings = orders.filter(o => o.type === 'service' || o.items?.some((it: any) => it.name.toLowerCase().includes('reparação') || it.name.toLowerCase().includes('manutenção') || it.name.toLowerCase().includes('limpeza')));

  const filteredBookings = serviceBookings.filter(b => {
    if (bookingFilter === 'all') return true;
    if (bookingFilter === 'pending') return b.status === 'pending';
    if (bookingFilter === 'confirmed') return b.status === 'accepted';
    if (bookingFilter === 'completed') return b.status === 'completed' || b.status === 'Entregue';
    return true;
  });

  return (
    <div className="space-y-6 text-left" id="agenda-view-container">
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
            <span className="text-[10px] font-black uppercase text-orange tracking-[0.2em]">Planeamento e Disponibilidade</span>
            <h2 className="text-2xl font-black text-navy uppercase tracking-tight">Agenda Integrada</h2>
          </div>
        </div>

        {/* View Switch */}
        <div className="flex bg-slate-100 p-1 rounded-2xl shrink-0 self-start sm:self-center">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'appointments' ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-navy'
            }`}
          >
            Sessões Agendadas
          </button>
          <button
            onClick={() => setActiveTab('schedule_settings')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'schedule_settings' ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-navy'
            }`}
          >
            Horário da Empresa
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'appointments' ? (
          <motion.div 
            key="appointments" 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="grid lg:grid-cols-3 gap-8"
          >
            {/* Left side list */}
            <div className="lg:col-span-2 space-y-6">
              {/* Filter Row */}
              <div className="flex overflow-x-auto gap-1.5 pb-2 custom-scrollbar">
                {[
                  { id: 'all', label: 'Todos Marcados' },
                  { id: 'pending', label: 'Espec. Confirmação' },
                  { id: 'confirmed', label: 'Confirmados' },
                  { id: 'completed', label: 'Concluídos' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setBookingFilter(f.id as any)}
                    className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shrink-0 cursor-pointer transition-all ${
                      bookingFilter === f.id
                        ? 'bg-navy border-navy text-white shadow'
                        : 'bg-white border-slate-150 text-slate-500 hover:text-navy hover:border-slate-300'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Booking Cards list */}
              <div className="space-y-4">
                {filteredBookings.length > 0 ? (
                  filteredBookings.map((b) => {
                    const clientUid = b.customer_id || 'unknown';
                    const customTime = getRescheduledTime(b.id) || `A definir • ${new Date(b.created_at).toLocaleDateString('pt-MZ')}`;
                    const itemsName = b.items?.map((it: any) => it.name).join(', ') || 'Serviço';

                    return (
                      <div 
                        key={b.id}
                        className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-soft hover:border-orange/20 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-orange/10 text-orange rounded-2xl flex items-center justify-center shrink-0">
                            <Calendar className="w-6 h-6" />
                          </div>
                          <div>
                            <span className="text-[9px] font-mono text-slate-400 font-extrabold block">REG # {b.id.slice(0, 8).toUpperCase()}</span>
                            <h4 className="font-extrabold text-navy text-md mt-0.5">{itemsName}</h4>
                            <p className="text-xs text-slate-400 font-bold flex items-center gap-1.5 mt-1">
                              <User className="w-3.5 h-3.5" />
                              Cliente: #{clientUid.slice(0, 8).toUpperCase()}
                            </p>
                            <p className="text-xs text-orange font-bold flex items-center gap-1.5 mt-1">
                              <Clock className="w-3.5 h-3.5" />
                              {customTime}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 sm:self-center shrink-0 w-full sm:w-auto">
                          {/* Pending actions */}
                          {b.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleUpdateBookingStatus(b.id, 'accepted')}
                                className="flex-1 sm:flex-none px-3.5 py-2.5 bg-green-650 hover:bg-green-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" /> Confirmar
                              </button>
                              <button
                                onClick={() => handleUpdateBookingStatus(b.id, 'cancelled')}
                                className="flex-1 sm:flex-none px-3.5 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" /> Cancelar
                              </button>
                            </>
                          )}

                          {/* Confirmed actions */}
                          {b.status === 'accepted' && (
                            <>
                              <button
                                onClick={() => {
                                  setIsRescheduling(b.id);
                                  setRescheduleDate(new Date(b.created_at).toISOString().split('T')[0]);
                                }}
                                className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-650 hover:bg-slate-100 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                              >
                                <Clock className="w-3.5 h-3.5" /> Reagendar
                              </button>
                              <button
                                onClick={() => setIsConversing({ id: clientUid, name: `Cliente #${clientUid.slice(0, 6).toUpperCase()}` })}
                                className="px-3.5 py-2.5 bg-orange/10 text-orange rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                              >
                                <MessageSquare className="w-3.5 h-3.5" /> Contactar
                              </button>
                            </>
                          )}

                          {/* Completed actions */}
                          {(b.status === 'completed' || b.status === 'Entregue') && (
                            <span className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                              Atendimento Concluído
                            </span>
                          )}

                          {/* Cancelled actions */}
                          {b.status === 'cancelled' && (
                            <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest">
                              Cancelado
                            </span>
                          )}
                        </div>

                        {/* Expandable Reschedule Widget Inline */}
                        <AnimatePresence>
                          {isRescheduling === b.id && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }} 
                              animate={{ opacity: 1, height: 'auto' }} 
                              exit={{ opacity: 0, height: 0 }}
                              className="w-full mt-4 p-4 border-t border-slate-50 space-y-3 bg-slate-50 rounded-2xl text-xs font-bold text-navy"
                            >
                              <p className="uppercased font-black text-slate-400 text-[9px] tracking-widest self-start">Escolha o Novo Turno</p>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-slate-400 mb-1">Nova Data</label>
                                  <input 
                                    type="date" 
                                    value={rescheduleDate}
                                    onChange={(e) => setRescheduleDate(e.target.value)}
                                    className="w-full p-2.5 rounded-xl border border-slate-200 text-navy bg-white focus:outline-none focus:border-orange font-bold text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-slate-400 mb-1">Nova Hora</label>
                                  <input 
                                    type="time" 
                                    value={rescheduleTime}
                                    onChange={(e) => setRescheduleTime(e.target.value)}
                                    className="w-full p-2.5 rounded-xl border border-slate-200 text-navy bg-white focus:outline-none focus:border-orange font-bold text-xs"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleReschedule(b.id)}
                                  className="flex-1 py-2 bg-navy text-white hover:bg-orange rounded-xl font-bold uppercase text-[9px]"
                                >
                                  Confirmar Reagendamento
                                </button>
                                <button 
                                  onClick={() => setIsRescheduling(null)}
                                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl font-bold uppercase text-[9px]"
                                >
                                  Fechar
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-white rounded-[32px] p-12 border border-dashed border-slate-200 text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-50 text-slate-450 rounded-full flex items-center justify-center mx-auto">
                      <CalendarDays className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-navy text-md">Nenhum agendamento para esta categoria</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        Altere os filtros ou adicione solicitações simuladas para testar o painel interativo.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Simulation Area Side floating panel */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-soft">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-50">
                  <h3 className="text-sm font-black text-navy uppercase tracking-tight flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-orange" />
                    Comunicação Directa
                  </h3>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                </div>

                {isConversing ? (
                  <div className="space-y-4">
                    <div className="bg-slate-50 p-3 rounded-2xl flex items-center justify-between">
                      <span className="text-xs font-black text-navy">{isConversing.name}</span>
                      <button 
                        onClick={() => setIsConversing(null)}
                        className="p-1 text-slate-400 hover:text-navy"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Chat Bubble Thread */}
                    <div className="h-64 overflow-y-auto outline-none border-none pr-1 space-y-3 font-medium text-xs max-h-64 flex flex-col pt-1">
                      <div className="bg-slate-50 text-slate-605 max-w-[85%] p-3 rounded-3xl self-start text-left">
                        <p className="text-slate-300 text-[8px] font-bold tracking-widest uppercase mb-1">Cliente</p>
                        Olá! Gostaria de confirmar se vão trazer as ferramentas para o AC de 12000BTU?
                        <span className="block text-[8px] text-slate-300 mt-1 text-right">10:00</span>
                      </div>

                      {(chatHistory[isConversing.id] || []).map((msg, i) => (
                        <div 
                          key={i} 
                          className={`max-w-[85%] p-3 rounded-3xl text-left ${
                            msg.sender === 'provider' 
                              ? 'bg-navy text-white self-end' 
                              : 'bg-slate-50 text-slate-700 self-start'
                          }`}
                        >
                          <p className={`text-[8px] font-bold tracking-widest uppercase mb-1 ${msg.sender === 'provider' ? 'text-orange' : 'text-slate-400'}`}>
                            {msg.sender === 'provider' ? 'Minha Resposta' : 'Cliente'}
                          </p>
                          {msg.text}
                          <span className="block text-[8px] opacity-60 mt-1 text-right">{msg.time}</span>
                        </div>
                      ))}
                    </div>

                    {/* Input field */}
                    <div className="flex gap-2 relative">
                      <input 
                        type="text" 
                        placeholder="Mensagem para cliente..." 
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendChatMessage(isConversing.id)}
                        className="flex-1 px-4 py-3 bg-white border border-slate-150 rounded-2xl placeholder:opacity-50 text-xs text-navy focus:outline-none focus:border-orange font-bold"
                      />
                      <button 
                        onClick={() => sendChatMessage(isConversing.id)}
                        className="p-3 bg-orange hover:bg-navy text-white rounded-2xl transition-colors cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    <MessageSquare className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold">Selecione "Contactar" num agendamento para abrir a linha direta com o seu cliente.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          /* Horario de Funcionamento tab content */
          <motion.div 
            key="schedule_settings" 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="grid md:grid-cols-3 gap-8"
          >
            {/* Days configure */}
            <div className="md:col-span-2 bg-white p-8 rounded-[40px] border border-slate-100 shadow-soft space-y-6">
              <div>
                <h3 className="text-md font-black text-navy uppercase tracking-widest flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange" />
                  Dias e Turnos Semanais
                </h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Defina quando a sua empresa está aberta para receber serviços públicos</p>
              </div>

              <div className="divide-y divide-slate-100">
                {Object.keys(workingDays).map((day) => {
                  const data = workingDays[day];
                  return (
                    <div key={day} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox"
                          checked={data.enabled}
                          onChange={(e) => {
                            setWorkingDays({
                              ...workingDays,
                              [day]: { ...data, enabled: e.target.checked }
                            });
                          }}
                          className="w-5 h-5 rounded-lg border-slate-300 text-orange accent-orange focus:ring-orange cursor-pointer"
                        />
                        <span className={`font-extrabold text-sm ${data.enabled ? 'text-navy' : 'text-slate-400 line-through'}`}>{day}</span>
                      </div>

                      {data.enabled && (
                        <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Sun className="w-3.5 h-3.5 text-orange" />
                            <input 
                              type="time" 
                              value={data.start}
                              onChange={(e) => setWorkingDays({ ...workingDays, [day]: { ...data, start: e.target.value }})}
                              className="p-1 border border-slate-200 rounded-lg text-xs" 
                            />
                            <span>até</span>
                            <input 
                              type="time" 
                              value={data.end}
                              onChange={(e) => setWorkingDays({ ...workingDays, [day]: { ...data, end: e.target.value }})}
                              className="p-1 border border-slate-200 rounded-lg text-xs" 
                            />
                          </div>

                          <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
                            <Coffee className="w-3.5 h-3.5 text-slate-400" />
                            <span>Intervalo:</span>
                            <input 
                              type="time" 
                              value={data.breakStart}
                              onChange={(e) => setWorkingDays({ ...workingDays, [day]: { ...data, breakStart: e.target.value }})}
                              className="p-1 border border-slate-200 rounded-lg text-xs" 
                            />
                            <span>às</span>
                            <input 
                              type="time" 
                              value={data.breakEnd}
                              onChange={(e) => setWorkingDays({ ...workingDays, [day]: { ...data, breakEnd: e.target.value }})}
                              className="p-1 border border-slate-200 rounded-lg text-xs" 
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={handleSaveWorkingHours}
                  className="px-6 py-3.5 bg-navy hover:bg-orange text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-colors cursor-pointer"
                >
                  Guardar Horários Semanais
                </button>
              </div>
            </div>

            {/* Exceptions & Vacation side panel */}
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-soft space-y-6">
              <div>
                <h3 className="text-md font-black text-navy uppercase tracking-widest flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange" />
                  Férias e Exceções
                </h3>
                <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">Configure feriados ou pausas exclusivas do negócio</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <input 
                    type="date" 
                    value={newExceptionDate}
                    onChange={(e) => setNewExceptionDate(e.target.value)}
                    className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-bold text-navy focus:outline-none focus:border-orange bg-slate-50"
                  />
                  <input 
                    type="text" 
                    placeholder="Descrição da Exceção (Ex: Férias do AC)"
                    value={newExceptionNote}
                    onChange={(e) => setNewExceptionNote(e.target.value)}
                    className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-bold text-navy focus:outline-none focus:border-orange bg-slate-50"
                  />
                  <button
                    onClick={handleAddException}
                    className="w-full py-3 bg-navy text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Adicionar Exceção
                  </button>
                </div>

                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                  {exceptions.map((ex, idx) => (
                    <div key={idx} className="py-3 flex items-start justify-between gap-2 text-xs">
                      <div>
                        <p className="font-extrabold text-navy font-mono">{new Date(ex.date).toLocaleDateString('pt-MZ')}</p>
                        <p className="text-slate-400 font-bold">{ex.note}</p>
                      </div>
                      <button 
                        onClick={() => handleRemoveException(idx)}
                        className="text-rose-500 hover:text-rose-700 bg-none border-none p-1 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
