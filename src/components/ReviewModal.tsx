import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, MessageSquare, X, Check, ShoppingBag, Loader2 } from 'lucide-react';
import { supabase, handleSupabaseError } from '../lib/supabase';

interface ReviewModalProps {
  order: any;
  onClose: () => void;
  onReviewSubmitted: () => void;
  customerId: string;
}

export function ReviewModal({ order, onClose, onReviewSubmitted, customerId }: ReviewModalProps) {
  // Store ratings and comments for each item in the order
  const [reviewsState, setReviewsState] = useState<
    Record<string, { rating: number; comment: string; hoverRating: number; submitted: boolean }>
  >(() => {
    const initialState: Record<string, { rating: number; comment: string; hoverRating: number; submitted: boolean }> = {};
    order.items.forEach((item: any) => {
      initialState[item.id] = {
        rating: 5,
        comment: '',
        hoverRating: 0,
        submitted: false,
      };
    });
    return initialState;
  });

  const [globalLoading, setGlobalLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleStarClick = (itemId: string, rating: number) => {
    setReviewsState((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], rating },
    }));
  };

  const handleStarHover = (itemId: string, rating: number) => {
    setReviewsState((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], hoverRating: rating },
    }));
  };

  const handleStarHoverLeave = (itemId: string) => {
    setReviewsState((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], hoverRating: 0 },
    }));
  };

  const handleCommentChange = (itemId: string, comment: string) => {
    setReviewsState((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], comment },
    }));
  };

  const getRatingFeedbackText = (rating: number) => {
    switch (rating) {
      case 1:
        return 'Péssimo 😞';
      case 2:
        return 'Fraco 😐';
      case 3:
        return 'Razoável 🙂';
      case 4:
        return 'Muito Bom Geral 😀';
      case 5:
        return 'Excelente, Recomendo! 🔥';
      default:
        return '';
    }
  };

  const submitReviewForItem = async (itemId: string) => {
    const itemReview = reviewsState[itemId];
    if (!itemReview) return;

    setGlobalLoading(true);
    setErrorMsg(null);
    try {
      const isService = order.type === 'service';
      const payload = {
        order_id: order.id,
        customer_id: customerId,
        product_id: isService ? null : itemId,
        service_id: isService ? itemId : null,
        rating: itemReview.rating,
        comment: itemReview.comment.trim() || null,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('reviews').insert(payload);

      if (error) {
        // If it was already reviewed, Supabase will fail depending on unique constraint or duplicate handling
        console.warn('Supabase DB Review Insertion Warning:', error.message);
        throw error;
      }

      setReviewsState((prev) => ({
        ...prev,
        [itemId]: { ...prev[itemId], submitted: true },
      }));

      // Check if all items are now submitted
      const updatedState = {
        ...reviewsState,
        [itemId]: { ...reviewsState[itemId], submitted: true },
      };
      
      const allSubmitted = Object.keys(updatedState).every((key) => updatedState[key].submitted);
      if (allSubmitted) {
        setSuccessMsg('Obrigado! Todas as avaliações foram enviadas com sucesso.');
        setTimeout(() => {
          onReviewSubmitted();
          onClose();
        }, 3000);
      } else {
        setSuccessMsg(`Avaliação do item "${order.items.find((i: any) => i.id === itemId)?.name}" enviada!`);
        setTimeout(() => setSuccessMsg(null), 2500);
      }
    } catch (err: any) {
      console.error('Error submitting review:', err);
      setErrorMsg(err.message || 'Erro ao submeter avaliação no banco de dados.');
    } finally {
      setGlobalLoading(false);
    }
  };

  const submitAllReviews = async () => {
    setGlobalLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const isService = order.type === 'service';
      
      // Determine which items haven't been submitted yet
      const pendingItems = order.items.filter((item: any) => !reviewsState[item.id].submitted);

      if (pendingItems.length === 0) {
        onClose();
        return;
      }

      const payloads = pendingItems.map((item: any) => {
        const itemReview = reviewsState[item.id];
        return {
          order_id: order.id,
          customer_id: customerId,
          product_id: isService ? null : item.id,
          service_id: isService ? item.id : null,
          rating: itemReview.rating,
          comment: itemReview.comment.trim() || null,
          created_at: new Date().toISOString(),
        };
      });

      const { error } = await supabase.from('reviews').insert(payloads);
      
      if (error) throw error;

      // Mark all as submitted
      setReviewsState((prev) => {
        const next = { ...prev };
        pendingItems.forEach((item: any) => {
          next[item.id] = { ...next[item.id], submitted: true };
        });
        return next;
      });

      setSuccessMsg('Obrigado! Todas as suas avaliações foram enviadas.');
      setTimeout(() => {
        onReviewSubmitted();
        onClose();
      }, 3000);
    } catch (err: any) {
      console.error('Error submitting all reviews:', err);
      setErrorMsg(err.message || 'Erro ao guardar avaliações. Por favor, tente de novo.');
    } finally {
      setGlobalLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white rounded-[40px] shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden flex flex-col my-8"
      >
        {/* Header */}
        <div className="bg-navy p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange rounded-xl flex items-center justify-center text-white">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg uppercase tracking-tight leading-none mb-1">Avaliar Pedido</h3>
              <p className="text-slate-400 text-xs font-mono">ID: {order.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-white/10 hover:bg-white/20 transition-all rounded-full flex items-center justify-center group"
          >
            <X className="w-5 h-5 text-slate-300 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
          <p className="text-sm text-slate-500 font-medium leading-relaxed">
            Como foi a sua experiência? Conte-nos o que achou dos seguintes itens para podermos manter a qualidade e recompensar os melhores fornecedores de Moçambique:
          </p>

          <AnimatePresence mode="wait">
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-green-550/10 text-green-600 p-4 rounded-2xl border border-green-200 text-xs font-semibold flex items-center gap-2"
              >
                <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span>{successMsg}</span>
              </motion.div>
            )}

            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-200 text-xs font-semibold"
              >
                {errorMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {order.items.map((item: any, idx: number) => {
            const itemReview = reviewsState[item.id] || { rating: 5, comment: '', hoverRating: 0, submitted: false };
            const activeStarCount = itemReview.hoverRating || itemReview.rating;

            return (
              <div 
                key={item.id} 
                className={`p-5 rounded-3xl border transition-all ${
                  itemReview.submitted 
                    ? 'bg-slate-50 border-slate-200 opacity-60' 
                    : 'bg-white border-slate-100 hover:border-orange/20 shadow-soft'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-extrabold text-navy text-sm leading-tight">{item.name}</h4>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5">
                      {order.type === 'service' ? 'Serviço' : 'Produto'} • {item.quantity || 1}x
                    </p>
                  </div>
                  {itemReview.submitted && (
                    <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <Check className="w-3 h-3" /> Avaliado
                    </span>
                  )}
                </div>

                {!itemReview.submitted && (
                  <div className="space-y-4 mt-3">
                    {/* Stars bar */}
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pontuação</p>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => handleStarClick(item.id, star)}
                            onMouseEnter={() => handleStarHover(item.id, star)}
                            onMouseLeave={() => handleStarHoverLeave(item.id)}
                            className="p-1 -ml-1 hover:scale-120 transition-transform duration-100"
                          >
                            <Star 
                              className={`w-7 h-7 transition-colors ${
                                star <= activeStarCount
                                  ? 'fill-orange text-orange drop-shadow-sm'
                                  : 'text-slate-300'
                              }`} 
                            />
                          </button>
                        ))}
                        <span className="ml-2 text-xs font-bold text-navy h-5 inline-flex items-center">
                          {getRatingFeedbackText(activeStarCount)}
                        </span>
                      </div>
                    </div>

                    {/* Comment text box */}
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                        Comentário (opcional)
                      </label>
                      <textarea
                        value={itemReview.comment}
                        onChange={(e) => handleCommentChange(item.id, e.target.value)}
                        placeholder="Ex: Entrega super rápida e produto impecável!"
                        maxLength={500}
                        rows={2}
                        className="w-full p-3 text-xs bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-orange/20 focus:border-orange transition-all placeholder:text-slate-300"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        disabled={globalLoading}
                        onClick={() => submitReviewForItem(item.id)}
                        className="px-4 py-2 bg-slate-100 hover:bg-orange hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest text-navy transition-all flex items-center gap-2"
                      >
                        Submeter esta avaliação
                      </button>
                    </div>
                  </div>
                )}

                {itemReview.submitted && (
                  <div className="mt-2 text-xs font-semibold text-slate-500">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-[10px] text-slate-400">Classificação:</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={`w-3.5 h-3.5 ${
                              star <= itemReview.rating ? 'fill-orange text-orange' : 'text-slate-200'
                            }`} 
                          />
                        ))}
                      </div>
                    </div>
                    {itemReview.comment && (
                      <p className="p-3 bg-slate-100/50 italic text-slate-500 rounded-xl mt-1 text-[11px]">
                        "{itemReview.comment}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-4 bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 rounded-2xl hover:bg-slate-50 transition-colors"
          >
            Fechar
          </button>

          {order.items.some((item: any) => !reviewsState[item.id]?.submitted) && (
            <button
              type="button"
              disabled={globalLoading}
              onClick={submitAllReviews}
              className="px-6 py-4 bg-orange text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] transition-transform shadow-lg shadow-orange/15 disabled:opacity-50 flex items-center gap-2"
            >
              {globalLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Enviar Todas as Avaliações
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
