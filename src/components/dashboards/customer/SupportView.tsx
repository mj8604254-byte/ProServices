import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  ArrowLeft, 
  Plus, 
  Clock, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Send, 
  User, 
  ShieldCheck, 
  AlertCircle,
  Loader2,
  Check
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface SupportViewProps {
  profile: any;
  onBack: () => void;
}

interface SupportTicketItem {
  id: string;
  subject: string;
  description: string;
  status: 'pending' | 'in_review' | 'resolved' | 'closed';
  category: 'complaint' | 'suggestion' | 'help' | 'billing' | 'technical';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  time: string;
}

export function SupportView({ profile, onBack }: SupportViewProps) {
  const uid = profile?.uid;
  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tickets' | 'chat' | 'faq'>('tickets');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Ticket Form
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'complaint' | 'suggestion' | 'help' | 'billing' | 'technical'>('help');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [submitting, setSubmitting] = useState(false);

  // Live Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [agentTyping, setAgentTyping] = useState(false);

  // FAQs Accordion States
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const fetchTickets = async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', uid)
        .order('id', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (err) {
      console.error('Failed to load support tickets:', err);
      // Setup mock fallback array
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();

    // Default Chat initialization
    setChatMessages([
      { id: '1', sender: 'agent', text: `Olá ${profile?.displayName || 'Cliente'}! Sou a Sofia, assistente virtual da Moz ProServices. Como posso ajudar nas suas encomendas ou serviços hoje?`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);
  }, [uid]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      alert('Por favor, indique o assunto e os detalhes!');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: uid,
          subject,
          description,
          status: 'pending',
          category,
          priority
        });

      if (error) throw error;

      alert('Ticket de suporte aberto com sucesso! A nossa equipa irá analisar e responder o mais rápido possível.');
      setShowCreateModal(false);
      setSubject('');
      setDescription('');
      await fetchTickets();
    } catch (err: any) {
      console.error('Ticket creation error:', err);
      // Offline Simulation fallback
      const mockTicket: SupportTicketItem = {
        id: Math.random().toString(),
        subject,
        description,
        status: 'pending',
        category,
        priority,
        created_at: new Date().toISOString()
      };
      setTickets([mockTicket, ...tickets]);
      setShowCreateModal(false);
      setSubject('');
      setDescription('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'user',
      text: chatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    const userQuery = chatInput;
    setChatInput('');
    setAgentTyping(true);

    // Simulated Smart Virtual Agent Sofia Replies
    setTimeout(() => {
      let replyText = 'Entendido. Estou a registar este assunto e vou encaminhar para um técnico humano da nossa linha de apoio em Moçambique.';
      
      const query = userQuery.toLowerCase();
      if (query.includes('paga') || query.includes('m-pesa') || query.includes('m pesa') || query.includes('mola')) {
        replyText = 'Para problemas com pagamentos via M-Pesa ou e-Mola, por favor verifique o seu saldo no extrato da carteira digital. Asseguro que os fundos são estornados automaticamente em 5 minutos caso a transição falhe.';
      } else if (query.includes('reembolso') || query.includes('devolver') || query.includes('estorno')) {
        replyText = 'Pode solicitar reembolsos automáticos na aba "Carteira" clicando no botão de reembolso rápido para pedidos elegíveis, ou abrindo um ticket de categoria "Faturação" para auditoria manual.';
      } else if (query.includes('serviço') || query.includes('prestador') || query.includes('técnico')) {
        replyText = 'Todos os nossos prestadores são certificados. Se tiver um problema com o trabalho elétrico, hidráulico ou doméstico efetuado, o nosso seguro de garantia cobre reparações adicionais até 10.000 MT.';
      } else if (query.includes('olá') || query.includes('bom dia') || query.includes('boa tarde')) {
        replyText = `Olá de novo! Deseja abrir um novo ticket formalizado de categoria técnica ou apenas colocar alguma dúvida rápida sobre as suas taxas?`;
      }

      const agentMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: 'agent',
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, agentMsg]);
      setAgentTyping(false);
    }, 1500);
  };

  const faqs = [
    { q: 'Como funciona o seguro de garantia Moz ProServices?', a: 'Todos os serviços domésticos, elétricos, de encanamento e pinturas agendados pela nossa plataforma contam com proteção de garantia até 10.000 MT. Caso o serviço não corresponda às exigências contratadas, cobrimos reparações com profissionais de substituição sem qualquer taxa extra.' },
    { q: 'Quanto tempo demora o reembolso das compras via M-Pesa / e-Mola?', a: 'Para cancelamentos de pedidos e serviços não iniciados, o estorno na sua carteira virtual Moz ProServices é instantâneo. Pode utilizar o saldo imediatamente ou transferir diretamente para o seu número móvel sem taxas de levantamentos administradas.' },
    { q: 'As minhas informações e cartões bancários estão seguros?', a: 'Com certeza! Nós codificamos inteiramente todos os dados bancários na rede local e nunca retemos códigos CVV em nossos sistemas informáticos, garantindo conformidade escrupulosa com a norma PCI-DSS.' },
    { q: 'Como posso contestar uma avaliação recebida ou dada?', a: 'Para disputar classificações e observações escritas de clientes ou fornecedores de serviços, por favor abra um ticket de apoio técnico selecionando a categoria "Reclamação". Inclua relatórios de conversações e anexos para análise imparcial da moderação.' }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700 font-extrabold';
      case 'in_review': return 'bg-blue-100 text-blue-600 font-extrabold';
      case 'resolved': return 'bg-emerald-100 text-emerald-700 font-extrabold';
      default: return 'bg-slate-100 text-slate-500 font-semibold';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'in_review': return 'Em Análise';
      case 'resolved': return 'Resolvido';
      default: return 'Fechado';
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'complaint': return 'Reclamação';
      case 'suggestion': return 'Sugestão';
      case 'help': return 'Apoio Geral';
      case 'billing': return 'Faturação / Conta';
      default: return 'Suporte Técnico';
    }
  };

  return (
    <div className="space-y-6 text-left animate-fade-in" id="customer-support-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-navy transition-colors font-bold text-xs uppercase animate-fade-in"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao Painel
        </button>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 bg-orange text-white hover:bg-navy font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border-none shadow-md shadow-orange/10"
        >
          <Plus className="w-4.5 h-4.5" /> Abrir Novo Ticket
        </button>
      </div>

      {/* Selectors tabs */}
      <div className="flex border-b border-slate-100 gap-6">
        {[
          { id: 'tickets', label: `Tickets de Apoio (${tickets.length})`, icon: Clock },
          { id: 'chat', label: 'Chat Sofia AI', icon: MessageSquare },
          { id: 'faq', label: 'Central de FAQs', icon: HelpCircle },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              if (tab.id === 'tickets') fetchTickets();
            }}
            className={`pb-3 font-black text-xs uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === tab.id ? 'border-orange text-navy' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Container contents dynamically */}
      <AnimatePresence mode="wait">
        
        {/* Ticket Tab */}
        {activeTab === 'tickets' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-orange animate-spin" />
              </div>
            ) : tickets.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-soft hover:border-orange transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[9px] font-black text-orange uppercase tracking-widest bg-orange/10 px-2 py-0.5 rounded">
                            {getCategoryLabel(ticket.category)}
                          </span>
                          <h4 className="font-extrabold text-navy text-sm mt-1.5 leading-tight">{ticket.subject}</h4>
                        </div>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${getStatusBadge(ticket.status)}`}>
                          {getStatusLabel(ticket.status)}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs mt-3.5 leading-relaxed line-clamp-3">{ticket.description}</p>
                    </div>

                    <div className="border-t border-slate-50 mt-5 pt-3.5 flex items-center justify-between text-[11px] font-bold text-slate-405">
                      <span>Criado em: {new Date(ticket.created_at).toLocaleDateString()}</span>
                      <span className="capitalize font-mono text-[9px] bg-slate-50 px-2 py-0.5 rounded-md text-slate-500">Prioridade: {ticket.priority}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-12 py-16 rounded-[32px] border border-slate-200 border-dashed text-center space-y-3">
                <AlertCircle className="w-10 h-10 text-slate-300 mx-auto animate-pulse" />
                <div>
                  <h4 className="text-sm font-black text-navy uppercase tracking-tight">Sem tickets abertos</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Tudo operacional por aqui! Se tiver alguma dúvida ou queixa técnica relativamente a compras e pedidos, clique em "Abrir Novo Ticket".</p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Live Chat Tab */}
        {activeTab === 'chat' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-[32px] border border-slate-100 shadow-xl overflow-hidden h-[450px] flex flex-col justify-between"
          >
            {/* Chat header */}
            <div className="bg-navy p-4 px-6 text-white flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 bg-orange/20 border border-orange/20 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-5.5 h-5.5 text-orange" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm leading-tight">Sofia - Assistente Moz ProServices</h4>
                <p className="text-[10px] text-green-400 font-bold flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" /> Online • Apoio Instantâneo
                </p>
              </div>
            </div>

            {/* Messages areas */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/50">
              {chatMessages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div key={msg.id} className={`flex gap-2.5 max-w-[80%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs shrink-0 font-bold ${
                      isUser ? 'bg-orange text-white' : 'bg-navy text-white'
                    }`}>
                      {isUser ? 'Tu' : 'SF'}
                    </div>
                    <div>
                      <div className={`p-3.5 rounded-[20px] text-xs leading-relaxed text-left ${
                        isUser 
                          ? 'bg-orange text-white rounded-tr-none' 
                          : 'bg-white text-slate-650 rounded-tl-none border border-slate-100 shadow-soft'
                      }`}>
                        {msg.text}
                      </div>
                      <p className={`text-[9px] text-slate-400 mt-1 font-bold ${isUser ? 'text-right' : 'text-left'}`}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                );
              })}

              {agentTyping && (
                <div className="flex gap-2.5 max-w-[80%]">
                  <div className="w-8 h-8 rounded-lg bg-navy text-white flex items-center justify-center text-xs shrink-0 font-bold">
                    SF
                  </div>
                  <div className="bg-white p-3.5 rounded-[20px] rounded-tl-none border border-slate-100 shadow-soft flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-slate-450 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-slate-450 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-slate-450 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Input form footer */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 flex gap-2.5 shrink-0 bg-white">
              <input 
                type="text" 
                placeholder="Escreva a sua mensagem aqui (Ex: Como funciona o reembolso?)"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 h-11 border border-slate-200 bg-slate-50 rounded-xl px-4 text-xs font-bold outline-none focus:border-orange text-navy"
              />
              <button
                type="submit"
                className="h-11 w-11 bg-orange hover:bg-navy text-white rounded-xl flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer border-none"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </form>
          </motion.div>
        )}

        {/* FAQs Accordion Tab */}
        {activeTab === 'faq' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-soft space-y-4 text-left"
          >
            <h3 className="font-black text-navy text-sm uppercase tracking-wider mb-4">Perguntas Frequentes (FAQs)</h3>
            
            <div className="divide-y divide-slate-100">
              {faqs.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div key={index} className="py-4">
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      className="w-full flex items-center justify-between text-left font-extrabold text-navy text-xs sm:text-sm tracking-tight hover:text-orange transition-colors cursor-pointer bg-none border-none outline-none py-1"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-orange" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </button>
                    
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden mt-3"
                        >
                          <p className="text-xs text-slate-450 leading-relaxed font-semibold pr-4">
                            {faq.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg p-6 rounded-[32px] shadow-2xl border border-slate-100 text-left">
            <h3 className="text-lg font-black text-navy uppercase tracking-tight flex items-center gap-2 mb-2">
              <MessageSquare className="w-5 h-5 text-orange" />
              Abrir Novo Ticket de Suporte
            </h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">Indique as especificações da sua queixa ou sugestão para que a nossa equipa possa analisar o seu assunto.</p>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Categoria do Suporte</label>
                  <select 
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full h-11 border border-slate-200 rounded-xl px-3 text-xs font-bold text-navy outline-none focus:border-orange"
                  >
                    <option value="help">Apoio Geral / Dúvidas</option>
                    <option value="complaint">Reclamação de Serviço/Produto</option>
                    <option value="billing">Faturação e Pagamentos</option>
                    <option value="technical">Falha Técnica na App</option>
                    <option value="suggestion">Sugestão de Melhoria</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Nível de Urgência</label>
                  <select 
                    value={priority}
                    onChange={(e: any) => setPriority(e.target.value)}
                    className="w-full h-11 border border-slate-200 rounded-xl px-3 text-xs font-bold text-navy outline-none focus:border-orange"
                  >
                    <option value="low">Baixa (Responder em até 48h)</option>
                    <option value="medium">Média (Responder em até 24h)</option>
                    <option value="high">Alta (Urgente - Responder em até 4h)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Assunto Resumido</label>
                <input 
                  type="text" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ex: Divergência de valor cobrado via M-Pesa"
                  className="w-full h-11 border border-slate-200 rounded-xl px-4 text-xs font-bold text-navy outline-none focus:border-orange"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Descrição Detalhada do Assunto</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Por favor, explique o problema em detalhe. Adicione códigos de transacção ou IDs de encomendas se aplicável..."
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs font-bold text-navy outline-none focus:border-orange resize-none"
                  required
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-navy font-black text-[10px] uppercase tracking-widest rounded-xl cursor-pointer border-none shadow-soft"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-orange hover:bg-navy text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer border-none shadow-md"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-white" /> : 'Submeter Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
