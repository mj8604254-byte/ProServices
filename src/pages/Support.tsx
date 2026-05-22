import React, { useState } from 'react';
import { 
  Headphones, 
  MessageSquare, 
  FileText, 
  HelpCircle, 
  Plus, 
  ChevronRight, 
  AlertCircle, 
  ShieldCheck, 
  Clock,
  ArrowRight,
  Send,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

export function Support() {
  const { profile } = useAuth();
  const [activeTicket, setActiveTicket] = useState<any | null>(null);
  
  const faqCategories = [
    { title: 'Conta & Segurança', icon: ShieldCheck, questions: 5 },
    { title: 'Pagamentos & Saques', icon: Clock, questions: 8 },
    { title: 'Logística & Entregas', icon: Headphones, questions: 12 },
    { title: 'Vendas & Marketing', icon: MessageSquare, questions: 6 },
  ];

  const myTickets = [
    { id: '#TK-4820', subject: 'Problema com Saque', status: 'em_revisao', date: 'Hoje, 09:15' },
    { id: '#TK-4712', subject: 'Dúvida sobre Comissões', status: 'resolvido', date: 'Ontem' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 pb-24">
      <div className="flex flex-col md:flex-row gap-12 pt-8">
        {/* Left Side: Navigation & History */}
        <aside className="w-full md:w-80 space-y-8">
          <section>
            <h3 className="text-sm font-black text-navy uppercase tracking-widest mb-6">Central de Ajuda</h3>
            <div className="grid gap-3">
              {faqCategories.map((cat) => (
                <button key={cat.title} className="w-full flex items-center justify-between p-4 bg-white rounded-3xl border border-slate-100 shadow-soft hover:border-orange transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-navy group-hover:bg-orange group-hover:text-white transition-all">
                      <cat.icon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-navy leading-tight">{cat.title}</p>
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{cat.questions} Questões</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-orange" />
                </button>
              ))}
            </div>
          </section>

          <section className="bg-navy rounded-[40px] p-6 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange/20 rounded-full blur-3xl -mr-16 -mt-16" />
            <div className="relative z-10">
              <Plus className="w-10 h-10 text-orange mb-4" />
              <h4 className="text-lg font-black uppercase tracking-tight mb-2">Novo Ticket</h4>
              <p className="text-slate-400 text-xs font-medium leading-relaxed mb-6">Não encontraste a tua resposta? Abre um ticket técnico.</p>
              <button className="w-full py-3 bg-white text-navy rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange hover:text-white transition-all">Reportar Agora</button>
            </div>
          </section>
        </aside>

        {/* Main Content: Chat & Tickets */}
        <main className="flex-1 space-y-12">
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-navy uppercase tracking-tight">Os Meus Tickets</h2>
              <button className="text-[10px] font-black text-orange uppercase tracking-widest hover:underline">Ver Histórico</button>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {myTickets.map((ticket) => (
                <button 
                  key={ticket.id} 
                  onClick={() => setActiveTicket(ticket)}
                  className="bg-white p-6 rounded-[32px] shadow-soft border border-slate-100 hover:border-orange transition-all text-left flex flex-col justify-between h-48 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{ticket.id}</span>
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${ticket.status === 'resolvido' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-navy leading-tight mb-2 group-hover:text-orange transition-colors">{ticket.subject}</h4>
                    <p className="text-[10px] font-medium text-slate-400 italic">Actualizado {ticket.date}</p>
                  </div>
                  <div className="flex items-center gap-2 text-orange text-[10px] font-black uppercase tracking-widest mt-auto">
                    Continuar Conversa <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="bg-slate-50 border-4 border-white rounded-[48px] p-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left shadow-soft">
            <div className="w-20 h-20 bg-orange rounded-[32px] flex items-center justify-center text-white shadow-xl shadow-orange/20">
              <MessageSquare className="w-10 h-10" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-black text-navy uppercase tracking-tight mb-1">Chat em Tempo Real</h3>
              <p className="text-slate-400 text-sm font-medium">Fala directamente com um consultorMoz ProServices agora mesmo.</p>
            </div>
            <button className="px-10 py-5 bg-navy text-white rounded-[24px] font-black uppercase tracking-widest hover:bg-orange hover:shadow-xl transition-all">Iniciar Chat</button>
          </section>
        </main>
      </div>

      {/* Ticket/Chat Modal Overlay */}
      <AnimatePresence>
        {activeTicket && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveTicket(null)}
              className="absolute inset-0 bg-navy/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[48px] shadow-2xl overflow-hidden flex flex-col h-[80vh]"
            >
              <div className="p-6 bg-navy text-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md text-orange">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black uppercase tracking-tight">{activeTicket.subject}</h3>
                    <p className="text-slate-400 text-[10px] uppercase font-black">{activeTicket.id} • Em revisão</p>
                  </div>
                </div>
                <button onClick={() => setActiveTicket(null)} className="p-3 hover:bg-white/10 rounded-2xl transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 p-8 overflow-y-auto space-y-6 bg-slate-50">
                <div className="flex justify-start">
                  <div className="bg-white p-5 rounded-[32px] rounded-bl-none shadow-soft max-w-[80%]">
                    <p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-2">Suporte Moz</p>
                    <p className="text-sm font-medium text-navy leading-relaxed">Olá! Recebemos o seu ticket sobre {activeTicket.subject.toLowerCase()}. O nosso departamento financeiro já está a analisar a situação.</p>
                    <span className="text-[9px] font-bold text-slate-300 mt-2 block">10:45</span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="bg-orange p-5 rounded-[32px] rounded-br-none shadow-xl shadow-orange/10 max-w-[80%] text-white">
                    <p className="text-sm font-medium leading-relaxed">Muito obrigado. Fico à espera de uma resposta breve pois preciso do valor para repor stock.</p>
                    <span className="text-[9px] font-black uppercase text-orange-200 mt-2 block">10:50</span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white border-t border-slate-100">
                <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-3xl border border-slate-100 pr-4">
                  <input 
                    type="text" 
                    placeholder="Escreve a tua mensagem..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold text-navy px-4"
                  />
                  <button className="w-12 h-12 bg-navy text-white rounded-2xl flex items-center justify-center hover:bg-orange transition-all shadow-lg">
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
