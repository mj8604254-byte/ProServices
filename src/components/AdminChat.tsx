import React from 'react';
import { MessageSquare, X, Send, ShieldCheck, Headphones } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function AdminChat() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="fixed bottom-24 sm:bottom-6 right-6 z-[60]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-20 right-0 w-[360px] h-[500px] bg-white rounded-[40px] shadow-[0_20px_80px_rgba(0,0,0,0.15)] border border-slate-100 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-navy p-6 text-white relative">
              <div className="absolute top-0 right-0 w-32 h-24 bg-orange/20 rounded-full blur-3xl -mr-16 -mt-8" />
              <div className="relative z-10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                    <Headphones className="w-6 h-6 text-orange" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-tight">Suporte Moz ProServices</h3>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consultores Online</p>
                    </div>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            {/* Messages Area */}
            <div className="flex-1 p-6 bg-slate-50/50 overflow-y-auto space-y-6">
              <div className="flex justify-start">
                <div className="bg-white p-4 rounded-[24px] rounded-tl-none shadow-soft border border-slate-100 max-w-[85%]">
                  <p className="text-[13px] font-medium text-navy leading-relaxed">
                    Olá! Bem-vindo à Moz ProServices. Como podemos ajudar com a sua conta, pedidos ou logística hoje? 👋
                  </p>
                  <span className="text-[9px] font-bold text-slate-300 mt-2 block uppercase">Suporte Automático • Agora</span>
                </div>
              </div>

              <div className="flex items-center gap-2 px-4">
                <div className="h-px flex-1 bg-slate-100" />
                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest px-2">Conversa Segura</span>
                <div className="h-px flex-1 bg-slate-100" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  'Onde está o meu pedido?',
                  'Como vender na MozPro?',
                  'Problemas com pagamento',
                  'Falar com humano'
                ].map((hint) => (
                  <button key={hint} className="p-3 bg-white hover:bg-orange/5 border border-slate-100 rounded-2xl text-[10px] font-bold text-navy hover:text-orange hover:border-orange transition-all text-left">
                    {hint}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white border-t border-slate-100">
              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-3xl border border-slate-100 focus-within:ring-2 focus-within:ring-orange/20 pr-4">
                <input 
                  type="text" 
                  placeholder="Escreve a tua questão..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold text-navy px-4 h-12"
                />
                <button className="w-12 h-12 bg-navy text-white rounded-2xl flex items-center justify-center hover:bg-orange transition-all shadow-lg active:scale-95">
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 text-[9px] font-black text-slate-300 uppercase tracking-widest">
                <ShieldCheck className="w-3.5 h-3.5" />
                Protegido por Moz Security
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-[24px] flex items-center justify-center shadow-xl shadow-orange/20 hover:scale-110 hover:rotate-6 transition-all active:scale-95 z-50 ${
          isOpen ? 'bg-navy text-white' : 'bg-orange text-white'
        }`}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="w-8 h-8" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <MessageSquare className="w-8 h-8" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}
